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
      this.logger.error(`job ${job?.id} falló: ${err.message}`);
    });
  }

  private async process(contentItemId: string) {
    const item = await this.content.findOne(contentItemId);
    // Si ya no está programado (reprogramado, rechazado, ya publicado), no hacer nada.
    if (item.status !== 'scheduled') {
      this.logger.warn(`${contentItemId} no está scheduled (${item.status}); se omite`);
      return;
    }
    try {
      const { igMediaId } = await this.publisher.publish({
        id: item.id,
        type: item.type,
        copy: item.generatedCopy ?? '',
      });
      await this.content.markPublished(contentItemId, igMediaId);
    } catch (e) {
      const reason = (e as Error).message;
      await this.content.markPublishFailed(contentItemId, reason);
      throw e; // deja que BullMQ reintente según la política de la cola
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
