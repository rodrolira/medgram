import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { PublishQueueService } from './publish-queue.service';

@Injectable()
export class PublishingService {
  constructor(
    private readonly content: ContentService,
    private readonly queue: PublishQueueService,
  ) {}

  /**
   * Programa (o publica de inmediato) contenido ya aprobado.
   * Marca el estado scheduled + audita, y encola el job de publicación.
   */
  async schedule(id: string, scheduledForIso: string | undefined, actor: string) {
    const when = scheduledForIso ? new Date(scheduledForIso) : new Date();
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException('scheduledFor inválido');
    }
    const item = await this.content.markScheduled(id, when, actor);
    await this.queue.enqueue(id, when);
    return item;
  }
}
