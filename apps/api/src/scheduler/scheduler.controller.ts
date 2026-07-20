import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/roles.decorator';
import { DailyContentGeneratorService } from './daily-content-generator.service';

class TriggerDailyDto {
  /** ISO date string (YYYY-MM-DD). Defaults to today. */
  date?: string;
}

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly generator: DailyContentGeneratorService) {}

  /** Trigger daily generation manually (for testing / backfill). */
  // Dispara 5 generaciones de IA de golpe: límite bajo.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Roles('agency')
  @Post('trigger-daily')
  async triggerDaily(@Body() dto: TriggerDailyDto) {
    const date = dto.date ? new Date(dto.date) : new Date();
    return this.generator.generateForDate(date);
  }
}
