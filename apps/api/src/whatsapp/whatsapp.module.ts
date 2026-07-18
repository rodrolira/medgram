import { Module } from '@nestjs/common';
import { WhatsAppBookingService } from './whatsapp-booking.service';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppBookingService],
  exports: [WhatsAppBookingService],
})
export class WhatsAppModule {}
