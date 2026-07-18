import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ContentModule } from '../content/content.module';
import { NotificationService } from '../notifications/notification.service';
import { DailyContentGeneratorService } from './daily-content-generator.service';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ContentModule,
  ],
  controllers: [SchedulerController],
  providers: [DailyContentGeneratorService, NotificationService],
  exports: [DailyContentGeneratorService],
})
export class SchedulerModule {}
