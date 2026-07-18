import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { INSTAGRAM_PUBLISHER, StubInstagramPublisher } from './instagram-publisher';
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
    // Fase 2: intercambiar por el publicador real cuando Meta apruebe la app.
    { provide: INSTAGRAM_PUBLISHER, useClass: StubInstagramPublisher },
  ],
})
export class PublishingModule {}
