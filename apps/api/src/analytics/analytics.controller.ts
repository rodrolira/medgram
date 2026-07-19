import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('content/:id')
  getForContent(@Param('id') id: string) {
    return this.analytics.getForContent(id);
  }

  @Post('content/:id/refresh')
  refreshForContent(@Param('id') id: string) {
    return this.analytics.refreshForContent(id);
  }

  @Get('summary')
  getSummary(@Query('limit') limit?: string) {
    return this.analytics.getSummary(limit ? Number(limit) : 30);
  }

  @Post('refresh')
  refreshAll() {
    return this.analytics.refreshAll();
  }
}
