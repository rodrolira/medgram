import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { ReminderService } from '../calendar/reminder.service';

@Module({
  imports: [PrismaModule, CalendarModule, WhatsAppModule],
  providers: [ReminderService],
})
export class NotificationsModule {}
