import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetaAdsService } from './meta-ads.service';
import { CreateAdDto } from './dto/create-ad.dto';

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAds: MetaAdsService,
  ) {}

  async promoteContent(dto: CreateAdDto) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: dto.contentItemId },
    });
    if (!item) throw new NotFoundException(`ContentItem ${dto.contentItemId} no existe`);

    const topic = dto.customTopic ?? item.topic;
    const igMediaId = item.igMediaId ?? `stub_${item.id}`;

    const campaign = await this.metaAds.promotePost({
      igMediaId,
      topic,
      dailyBudgetCents: dto.dailyBudgetCents,
      durationDays: dto.durationDays,
    });

    return { contentItemId: item.id, topic, campaign };
  }

  connectionStatus() {
    return { connected: this.metaAds.isConnected };
  }
}
