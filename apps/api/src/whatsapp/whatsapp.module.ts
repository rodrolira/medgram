import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { TwilioSignatureGuard } from './twilio-signature.guard';
import { WhatsAppBookingService } from './whatsapp-booking.service';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [CalendarModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppBookingService, TwilioSignatureGuard],
  exports: [WhatsAppBookingService],
})
export class WhatsAppModule {}
