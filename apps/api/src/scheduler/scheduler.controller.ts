import { Body, Controller, Post } from '@nestjs/common';
import { DailyContentGeneratorService } from './daily-content-generator.service';

class TriggerDailyDto {
  /** ISO date string (YYYY-MM-DD). Defaults to today. */
  date?: string;
}

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly generator: DailyContentGeneratorService) {}

  /** Trigger daily generation manually (for testing / backfill). */
  @Post('trigger-daily')
  async triggerDaily(@Body() dto: TriggerDailyDto) {
    const date = dto.date ? new Date(dto.date) : new Date();
    return this.generator.generateForDate(date);
  }
}
