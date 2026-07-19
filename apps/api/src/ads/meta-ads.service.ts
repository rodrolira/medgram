import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

export interface AdCampaign {
  campaignId: string;
  adsetId: string;
  adId: string;
  status: 'active' | 'simulated';
  previewUrl?: string;
}

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);
  private readonly token: string | null;
  private readonly adAccountId: string | null;
  private readonly pageId: string | null;

  constructor(config: ConfigService) {
    this.token = config.get('META_ACCESS_TOKEN') ?? config.get('INSTAGRAM_ACCESS_TOKEN') ?? null;
    this.adAccountId = config.get('META_AD_ACCOUNT_ID') ?? null;
    this.pageId = config.get('META_FACEBOOK_PAGE_ID') ?? null;

    if (!this.token || !this.adAccountId || !this.pageId) {
      this.logger.warn(
        'META_ACCESS_TOKEN / META_AD_ACCOUNT_ID / META_FACEBOOK_PAGE_ID no configurados — ads en modo simulación',
      );
    }
  }

  get isConnected(): boolean {
    return !!(this.token && this.adAccountId && this.pageId);
  }

  async promotePost(opts: {
    igMediaId: string;
    topic: string;
    dailyBudgetCents: number;
    durationDays: number;
  }): Promise<AdCampaign> {
    if (!this.isConnected || opts.igMediaId.startsWith('stub_')) {
      return this.simulatedCampaign(opts.igMediaId);
    }

    try {
      const campaignId = await this.createCampaign(opts.topic);
      const adsetId = await this.createAdset(campaignId, opts.dailyBudgetCents, opts.durationDays);
      const creativeId = await this.createCreative(opts.igMediaId, opts.topic);
      const adId = await this.createAd(adsetId, creativeId, opts.topic);

      this.logger.log(`[ads] Campaña creada: campaign=${campaignId} ad=${adId}`);
      return {
        campaignId,
        adsetId,
        adId,
        status: 'active',
        previewUrl: `https://www.facebook.com/ads/manager/account/campaigns?act=${this.adAccountId}`,
      };
    } catch (e) {
      this.logger.error(`[ads] Error creando campaña: ${(e as Error).message}`);
      return this.simulatedCampaign(opts.igMediaId);
    }
  }

  private async createCampaign(topic: string): Promise<string> {
    const res = await this.post(`/act_${this.adAccountId}/campaigns`, {
      name: `Medgram — ${topic.slice(0, 40)}`,
      objective: 'OUTCOME_ENGAGEMENT',
      status: 'ACTIVE',
      special_ad_categories: '[]',
    });
    return res.id;
  }

  private async createAdset(
    campaignId: string,
    dailyBudgetCents: number,
    durationDays: number,
  ): Promise<string> {
    const startTime = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const res = await this.post(`/act_${this.adAccountId}/adsets`, {
      name: `AdSet — ${campaignId.slice(-6)}`,
      campaign_id: campaignId,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      daily_budget: String(dailyBudgetCents),
      targeting: JSON.stringify({
        geo_locations: { countries: ['CL'] },
        age_min: 25,
        age_max: 65,
      }),
      start_time: startTime,
      end_time: endDate.toISOString(),
      status: 'ACTIVE',
    });
    return res.id;
  }

  private async createCreative(igMediaId: string, topic: string): Promise<string> {
    const res = await this.post(`/act_${this.adAccountId}/adcreatives`, {
      name: `Creative — ${topic.slice(0, 40)}`,
      object_story_id: `${this.pageId}_${igMediaId}`,
    });
    return res.id;
  }

  private async createAd(adsetId: string, creativeId: string, topic: string): Promise<string> {
    const res = await this.post(`/act_${this.adAccountId}/ads`, {
      name: `Ad — ${topic.slice(0, 40)}`,
      adset_id: adsetId,
      creative: JSON.stringify({ creative_id: creativeId }),
      status: 'ACTIVE',
    });
    return res.id;
  }

  private async post(path: string, body: Record<string, string>): Promise<{ id: string }> {
    const payload = { ...body, access_token: this.token! };
    const res = await fetch(`${GRAPH_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { id?: string; error?: { message: string } };
    if (!res.ok || data.error) {
      throw new Error(data.error?.message ?? `Meta error en ${path}`);
    }
    return { id: data.id! };
  }

  private simulatedCampaign(igMediaId: string): AdCampaign {
    this.logger.log(`[ads simulado] Campaña simulada para ${igMediaId}`);
    return {
      campaignId: `stub-campaign-${Date.now()}`,
      adsetId: `stub-adset-${Date.now()}`,
      adId: `stub-ad-${Date.now()}`,
      status: 'simulated',
    };
  }
}
