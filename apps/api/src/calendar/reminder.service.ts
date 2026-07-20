import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { maskPhone } from '../common/mask';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppBookingService } from '../whatsapp/whatsapp-booking.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppBookingService,
  ) {}

  /** Corre todos los días a las 9 AM Chile (UTC-4) → 13:00 UTC */
  @Cron('0 13 * * *', { timeZone: 'America/Santiago' })
  async sendDailyReminders() {
    const now = new Date();
    const in23h = new Date(now.getTime() + 23 * 3600 * 1000);
    const in25h = new Date(now.getTime() + 25 * 3600 * 1000);

    const upcoming = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminderSent: false,
        scheduledFor: { gte: in23h, lte: in25h },
      },
    });

    this.logger.log(`[reminders] ${upcoming.length} citas en ventana 24h`);

    for (const booking of upcoming) {
      try {
        await this.whatsapp.sendBookingConfirmation({
          patientPhone: booking.patientPhone,
          name: booking.patientName ?? undefined,
          scheduledFor: booking.scheduledFor.toISOString(),
          messageId: booking.id,
        });
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
        this.logger.log(`[reminders] recordatorio enviado a ${maskPhone(booking.patientPhone)}`);
      } catch (e) {
        this.logger.error(`[reminders] error con booking ${booking.id}: ${(e as Error).message}`);
      }
    }
  }
}
