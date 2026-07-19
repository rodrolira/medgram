import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetaInsightsService } from './meta-insights.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: MetaInsightsService,
  ) {}

  async getForContent(contentItemId: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { analytics: true },
    });
    if (!item) throw new NotFoundException(`ContentItem ${contentItemId} no existe`);

    if (item.analytics) return item.analytics;

    if (item.igMediaId) {
      return this.refreshForContent(contentItemId);
    }

    return null;
  }

  async refreshForContent(contentItemId: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });
    if (!item) throw new NotFoundException(`ContentItem ${contentItemId} no existe`);

    const data = await this.insights.fetchInsights(item.igMediaId ?? `stub_${contentItemId}`);

    return this.prisma.contentAnalytics.upsert({
      where: { contentItemId },
      create: { contentItemId, ...data },
      update: { ...data, fetchedAt: new Date() },
    });
  }

  async getSummary(limit = 30) {
    const items = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      include: { analytics: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    const withAnalytics = items.filter((i) => i.analytics);
    const totals = withAnalytics.reduce(
      (acc, i) => {
        const a = i.analytics!;
        acc.impressions += a.impressions;
        acc.reach += a.reach;
        acc.likes += a.likes;
        acc.comments += a.comments;
        acc.shares += a.shares;
        acc.saved += a.saved;
        return acc;
      },
      { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saved: 0 },
    );

    const avgEngagementRate =
      withAnalytics.length > 0
        ? withAnalytics.reduce((s, i) => s + (i.analytics?.engagementRate ?? 0), 0) /
          withAnalytics.length
        : 0;

    return {
      totalPublished: items.length,
      withAnalytics: withAnalytics.length,
      totals,
      avgEngagementRate: Number(avgEngagementRate.toFixed(2)),
      topPosts: withAnalytics
        .sort((a, b) => (b.analytics!.engagementRate ?? 0) - (a.analytics!.engagementRate ?? 0))
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          topic: i.topic,
          type: i.type,
          publishedAt: i.publishedAt,
          engagementRate: i.analytics!.engagementRate,
          reach: i.analytics!.reach,
          likes: i.analytics!.likes,
        })),
    };
  }

  async refreshAll() {
    const published = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      published.map((p) => this.refreshForContent(p.id)),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { total: published.length, success, failed };
  }
}
