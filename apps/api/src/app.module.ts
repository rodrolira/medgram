import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SessionGuard } from './auth/session.guard';
import { AdsModule } from './ads/ads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CalendarModule } from './calendar/calendar.module';
import { ContentModule } from './content/content.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublishingModule } from './publishing/publishing.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite por defecto: 100 req/min por IP. Endpoints caros/públicos lo ajustan con @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    ContentModule,
    PublishingModule,
    SchedulerModule,
    WhatsAppModule,
    CalendarModule,
    NotificationsModule,
    AnalyticsModule,
    AdsModule,
  ],
  controllers: [HealthController],
  providers: [
    // El throttler corre primero (protege incluso rutas públicas), luego la sesión.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
