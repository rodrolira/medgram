import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { getDailyTopics, RheumatologyTopic, SLOT_PUBLISH_TIMES } from '@medgram/shared-types';
import { generateMedicalImage } from '@medgram/content-pipeline';
import { ContentService } from '../content/content.service';
import { NotificationService } from '../notifications/notification.service';

export interface DailyGenerationResult {
  date: string;
  generated: number;
  pending: number;
  drafts: number;
  items: Array<{ id: string; topic: string; slot: number; status: string }>;
}

@Injectable()
export class DailyContentGeneratorService {
  private readonly logger = new Logger(DailyContentGeneratorService.name);

  constructor(
    private readonly content: ContentService,
    private readonly notifications: NotificationService,
  ) {}

  /** Runs at 7:00 AM Chile time (UTC-3 → UTC 10:00). Configurable via DAILY_CRON env. */
  @Cron(process.env.DAILY_CRON ?? '0 10 * * *')
  async runDailyGeneration() {
    await this.generateForDate(new Date());
  }

  /**
   * Generates the 5 daily rheumatology posts for a given date.
   * Deterministic: safe to retry — if called twice for the same date, you get
   * duplicate items (the doctor sees them in the queue), not a crash.
   * Returns a summary for logging and testing.
   */
  async generateForDate(date: Date): Promise<DailyGenerationResult> {
    const dateStr = date.toISOString().slice(0, 10);
    this.logger.log(`[daily-generator] Iniciando generación para ${dateStr}`);

    const topics = getDailyTopics(date);
    const results: DailyGenerationResult['items'] = [];

    for (const topic of topics) {
      const item = await this.generateSingle(topic);
      results.push(item);
    }

    const pending = results.filter((r) => r.status === 'pending_approval').length;
    const drafts = results.filter((r) => r.status === 'draft').length;

    this.logger.log(
      `[daily-generator] ${dateStr}: ${results.length} generados, ` +
        `${pending} en aprobación, ${drafts} en borrador (falló compliance)`,
    );

    if (results.length > 0) {
      await this.notifications.notifyDoctorDailyBatch(date, results.map((r, idx) => ({
        id: r.id,
        topic: r.topic,
        status: r.status,
        suggestedPublishTime: SLOT_PUBLISH_TIMES[(idx + 1) as 1 | 2 | 3 | 4 | 5].label,
      })));
    }

    return {
      date: dateStr,
      generated: results.length,
      pending,
      drafts,
      items: results,
    };
  }

  private async generateSingle(topic: RheumatologyTopic) {
    try {
      const { item } = await this.content.generateAndQueue(
        topic.topic,
        topic.type,
        'system:daily-generator',
        topic.condition,
      );

      // Generate image concurrently after copy (failure doesn't block the content item).
      const image = await generateMedicalImage(topic.topic, {
        condition: topic.condition,
        log: (m) => this.logger.log(m),
      }).catch((e: unknown) => {
        this.logger.warn(`[daily-generator] Imagen no generada para "${topic.topic}": ${(e as Error).message}`);
        return null;
      });

      if (image) {
        await this.content.setMedia(item.id, [{ url: image.url, source: image.source, prompt: image.prompt }]);
      }

      return { id: item.id, topic: topic.topic, slot: topic.slot, status: item.status };
    } catch (e) {
      this.logger.error(
        `[daily-generator] Fallo generando "${topic.topic}": ${(e as Error).message}`,
      );
      return { id: 'error', topic: topic.topic, slot: topic.slot, status: 'error' };
    }
  }
}
