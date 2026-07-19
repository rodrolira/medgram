import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentModule } from '../content/content.module';
import {
  INSTAGRAM_PUBLISHER,
  StubInstagramPublisher,
} from './instagram-publisher';
import { MetaInstagramPublisher } from './meta-instagram-publisher';
import { PublishQueueService } from './publish-queue.service';
import { PublishWorker } from './publish.worker';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';

@Module({
  imports: [ContentModule],
  controllers: [PublishingController],
  providers: [
    PublishingService,
    PublishQueueService,
    PublishWorker,
    {
      provide: INSTAGRAM_PUBLISHER,
      useFactory: (config: ConfigService) => {
        const hasCredentials =
          config.get('INSTAGRAM_USER_ID') && config.get('INSTAGRAM_ACCESS_TOKEN');
        if (hasCredentials) {
          return new MetaInstagramPublisher(config);
        }
        return new StubInstagramPublisher();
      },
      inject: [ConfigService],
    },
  ],
})
export class PublishingModule {}
