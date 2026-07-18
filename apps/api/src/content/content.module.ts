import { Module } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService, NotificationService],
  exports: [ContentService],
})
export class ContentModule {}
