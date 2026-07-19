import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { WhatsAppBookingService } from './whatsapp-booking.service';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [CalendarModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppBookingService],
  exports: [WhatsAppBookingService],
})
export class WhatsAppModule {}
