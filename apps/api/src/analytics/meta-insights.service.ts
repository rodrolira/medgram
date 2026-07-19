import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const METRICS = 'impressions,reach,likes,comments,shares,saved';

export interface InsightsData {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saved: number;
  engagementRate: number;
}

@Injectable()
export class MetaInsightsService {
  private readonly logger = new Logger(MetaInsightsService.name);
  private readonly token: string | null;

  constructor(config: ConfigService) {
    this.token = config.get('INSTAGRAM_ACCESS_TOKEN') ?? null;
    if (!this.token) {
      this.logger.warn('INSTAGRAM_ACCESS_TOKEN no configurado — analytics en modo simulación');
    }
  }

  get isConnected(): boolean {
    return this.token !== null;
  }

  async fetchInsights(igMediaId: string): Promise<InsightsData> {
    if (!this.token || igMediaId.startsWith('stub_')) {
      return this.simulatedInsights();
    }

    try {
      const url =
        `${GRAPH_URL}/${igMediaId}/insights` +
        `?metric=${METRICS}&period=lifetime&access_token=${this.token}`;

      const res = await fetch(url);
      const json = (await res.json()) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };

      if (!res.ok) {
        this.logger.warn(`[insights] Meta API error para ${igMediaId}`);
        return this.simulatedInsights();
      }

      const getValue = (name: string): number => {
        const item = json.data?.find((d) => d.name === name);
        return item?.values?.[0]?.value ?? 0;
      };

      const impressions = getValue('impressions');
      const reach = getValue('reach');
      const likes = getValue('likes');
      const comments = getValue('comments');
      const shares = getValue('shares');
      const saved = getValue('saved');
      const engagementRate = reach > 0 ? ((likes + comments + shares + saved) / reach) * 100 : 0;

      return { impressions, reach, likes, comments, shares, saved, engagementRate };
    } catch (e) {
      this.logger.error(`[insights] Error: ${(e as Error).message}`);
      return this.simulatedInsights();
    }
  }

  private simulatedInsights(): InsightsData {
    const reach = Math.floor(Math.random() * 800) + 200;
    const likes = Math.floor(reach * (0.03 + Math.random() * 0.07));
    const comments = Math.floor(likes * 0.1);
    const shares = Math.floor(likes * 0.05);
    const saved = Math.floor(likes * 0.15);
    const impressions = Math.floor(reach * 1.3);
    const engagementRate = ((likes + comments + shares + saved) / reach) * 100;
    return { impressions, reach, likes, comments, shares, saved, engagementRate };
  }
}
