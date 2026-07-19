import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstagramPublisher, PublishInput, PublishResult } from './instagram-publisher';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20; // 60 s máx

@Injectable()
export class MetaInstagramPublisher implements InstagramPublisher {
  private readonly logger = new Logger(MetaInstagramPublisher.name);
  private readonly userId: string;
  private readonly token: string;

  constructor(config: ConfigService) {
    this.userId = config.getOrThrow('INSTAGRAM_USER_ID');
    this.token = config.getOrThrow('INSTAGRAM_ACCESS_TOKEN');
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const { id, type, copy, mediaUrls = [] } = input;
    this.logger.log(`[meta] publicando ${id} (${type})`);

    let creationId: string;

    if (type === 'carousel' && mediaUrls.length > 1) {
      creationId = await this.createCarouselContainer(copy, mediaUrls);
    } else if (type === 'reel') {
      creationId = await this.createReelContainer(copy, mediaUrls[0]);
    } else {
      creationId = await this.createImageContainer(copy, mediaUrls[0]);
    }

    await this.waitUntilFinished(creationId);

    const igMediaId = await this.publishContainer(creationId);
    this.logger.log(`[meta] publicado ig_media_id=${igMediaId}`);
    return { igMediaId };
  }

  private async createImageContainer(caption: string, imageUrl?: string): Promise<string> {
    const body: Record<string, string> = { caption, access_token: this.token };
    if (imageUrl) body.image_url = imageUrl;

    const res = await this.post(`/${this.userId}/media`, body);
    return res.id;
  }

  private async createReelContainer(caption: string, videoUrl?: string): Promise<string> {
    const body: Record<string, string> = {
      media_type: 'REELS',
      caption,
      access_token: this.token,
    };
    if (videoUrl) body.video_url = videoUrl;

    const res = await this.post(`/${this.userId}/media`, body);
    return res.id;
  }

  private async createCarouselContainer(caption: string, imageUrls: string[]): Promise<string> {
    // Paso 1: crear un item-container por cada imagen
    const childIds = await Promise.all(
      imageUrls.map((url) =>
        this.post(`/${this.userId}/media`, {
          image_url: url,
          is_carousel_item: 'true',
          access_token: this.token,
        }).then((r) => r.id as string),
      ),
    );

    // Paso 2: crear el container carousel
    const res = await this.post(`/${this.userId}/media`, {
      media_type: 'CAROUSEL',
      caption,
      children: childIds.join(','),
      access_token: this.token,
    });
    return res.id;
  }

  private async waitUntilFinished(containerId: string): Promise<void> {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      const res = await this.get(`/${containerId}`, 'fields=status_code');
      if (res.status_code === 'FINISHED') return;
      if (res.status_code === 'ERROR') {
        throw new Error(`Meta container ${containerId} falló: ${res.status_code}`);
      }
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`Meta container ${containerId} no terminó en tiempo`);
  }

  private async publishContainer(containerId: string): Promise<string> {
    const res = await this.post(`/${this.userId}/media_publish`, {
      creation_id: containerId,
      access_token: this.token,
    });
    return res.id;
  }

  private async post(path: string, body: Record<string, string>): Promise<Record<string, string>> {
    const res = await fetch(`${GRAPH_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok || data.error) {
      const err = (data.error as Record<string, string> | undefined)?.message ?? JSON.stringify(data);
      throw new Error(`Meta API error (${path}): ${err}`);
    }
    return data as Record<string, string>;
  }

  private async get(path: string, query: string): Promise<Record<string, string>> {
    const url = `${GRAPH_URL}${path}?${query}&access_token=${this.token}`;
    const res = await fetch(url);
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok || data.error) {
      const err = (data.error as Record<string, string> | undefined)?.message ?? JSON.stringify(data);
      throw new Error(`Meta API error (${path}): ${err}`);
    }
    return data as Record<string, string>;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
