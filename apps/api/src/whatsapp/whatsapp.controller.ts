import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TwilioSignatureGuard } from './twilio-signature.guard';
import { WhatsAppBookingService, WhatsAppWebhookPayload } from './whatsapp-booking.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly booking: WhatsAppBookingService) {}

  /**
   * Twilio webhook endpoint for incoming WhatsApp messages.
   * Twilio sends an HTTP POST with form-encoded data; NestJS body parser converts it to JSON.
   * Returns 200 with an empty TwiML response (Twilio ignores the body since we reply via API).
   */
  // Exento del SessionGuard (no hay cookie): se autentica con la firma de Twilio.
  @Public()
  @UseGuards(TwilioSignatureGuard)
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    await this.booking.handleIncomingMessage(payload);
    // Twilio expects a TwiML response or empty 200.
    return '<Response></Response>';
  }
}
