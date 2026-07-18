import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentModule } from './content/content.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PublishingModule } from './publishing/publishing.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ContentModule,
    PublishingModule,
    SchedulerModule,
    WhatsAppModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
