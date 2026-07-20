import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { WhatsAppBookingService, WhatsAppWebhookPayload } from './whatsapp-booking.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly booking: WhatsAppBookingService) {}

  /**
   * Twilio webhook endpoint for incoming WhatsApp messages.
   * Twilio sends an HTTP POST with form-encoded data; NestJS body parser converts it to JSON.
   * Returns 200 with an empty TwiML response (Twilio ignores the body since we reply via API).
   */
  // Público al SessionGuard: se autentica por separado con la firma de Twilio (ver TwilioSignatureGuard).
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    await this.booking.handleIncomingMessage(payload);
    // Twilio expects a TwiML response or empty 200.
    return '<Response></Response>';
  }
}
