import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ContentService } from '../content/content.service';
import {
  INSTAGRAM_PUBLISHER,
  InstagramPublisher,
} from './instagram-publisher';
import { PUBLISH_QUEUE, PublishJobData, redisConnection } from './publish-queue.service';

@Injectable()
export class PublishWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublishWorker.name);
  private connection!: IORedis;
  private worker!: Worker<PublishJobData>;

  constructor(
    private readonly content: ContentService,
    @Inject(INSTAGRAM_PUBLISHER) private readonly publisher: InstagramPublisher,
  ) {}

  onModuleInit() {
    this.connection = redisConnection();
    this.worker = new Worker<PublishJobData>(
      PUBLISH_QUEUE,
      (job: Job<PublishJobData>) => this.process(job.data.contentItemId),
      { connection: this.connection },
    );
    this.worker.on('failed', (job, err) => {
      void this.onJobFailed(job, err);
    });
  }

  /**
   * Se dispara tras cada intento fallido. Registra el fallo y, solo cuando se agotan todos los
   * reintentos, marca el ítem como fallo definitivo (lo revierte a "aprobado" para re-agendar).
   */
  private async onJobFailed(job: Job<PublishJobData> | undefined, err: Error) {
    if (!job) {
      this.logger.error(`job desconocido falló: ${err.message}`);
      return;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    const isFinal = job.attemptsMade >= maxAttempts;
    this.logger.error(
      `job ${job.id} falló (intento ${job.attemptsMade}/${maxAttempts}): ${err.message}`,
    );
    try {
      await this.content.markPublishFailed(job.data.contentItemId, err.message, isFinal);
    } catch (markErr) {
      this.logger.error(`no se pudo registrar el fallo de ${job.data.contentItemId}: ${(markErr as Error).message}`);
    }
  }

  private async process(contentItemId: string) {
    const item = await this.content.findOne(contentItemId);
    // Si ya no está programado (reprogramado, rechazado, ya publicado), no hacer nada.
    if (item.status !== 'scheduled') {
      this.logger.warn(`${contentItemId} no está scheduled (${item.status}); se omite`);
      return;
    }
    const { igMediaId } = await this.publisher.publish({
      id: item.id,
      type: item.type,
      copy: item.generatedCopy ?? '',
    });
    await this.content.markPublished(contentItemId, igMediaId);
    // Si publish() lanza, el error se propaga: BullMQ reintenta y el evento 'failed'
    // registra el fallo (definitivo solo al agotar los reintentos).
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
