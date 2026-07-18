import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const PUBLISH_QUEUE = 'publish';

export interface PublishJobData {
  contentItemId: string;
}

function redisConnection(): IORedis {
  // maxRetriesPerRequest: null es requerido por BullMQ.
  return new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
}

@Injectable()
export class PublishQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublishQueueService.name);
  private connection!: IORedis;
  private queue!: Queue<PublishJobData>;

  onModuleInit() {
    this.connection = redisConnection();
    this.queue = new Queue<PublishJobData>(PUBLISH_QUEUE, { connection: this.connection });
  }

  /** Encola la publicación con un delay según scheduledFor (0 = ahora). */
  async enqueue(contentItemId: string, scheduledFor: Date) {
    const delay = Math.max(0, scheduledFor.getTime() - Date.now());
    await this.queue.add(
      'publish',
      { contentItemId },
      {
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`encolada publicación de ${contentItemId} (delay ${delay}ms)`);
  }

  async onModuleDestroy() {
    await this.queue?.close();
    await this.connection?.quit();
  }
}

export { redisConnection };
