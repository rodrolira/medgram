import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

export interface BookingConfirmation {
  patientPhone: string;
  name?: string;
  scheduledFor?: string;
  messageId?: string;
}

export interface WhatsAppWebhookPayload {
  From?: string;
  Body?: string;
  ProfileName?: string;
  MessageSid?: string;
}

@Injectable()
export class WhatsAppBookingService {
  private readonly logger = new Logger(WhatsAppBookingService.name);
  private client: ReturnType<typeof Twilio> | null = null;

  private getClient(): ReturnType<typeof Twilio> | null {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    if (!this.client) {
      this.client = Twilio(sid, token);
    }
    return this.client;
  }

  private get twilioWhatsAppFrom(): string {
    return process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
  }

  /**
   * Processes an incoming WhatsApp message from a patient.
   * Detects booking intent and replies with scheduling instructions.
   * If TWILIO_* env vars are missing, logs the reply instead of sending.
   */
  async handleIncomingMessage(payload: WhatsAppWebhookPayload): Promise<string> {
    const from = payload.From ?? '';
    const body = (payload.Body ?? '').toLowerCase().trim();
    const name = payload.ProfileName ?? 'Paciente';

    this.logger.log(`[whatsapp] Mensaje de ${from}: "${payload.Body}"`);

    const isBookingIntent = this.detectBookingIntent(body);
    const replyText = isBookingIntent
      ? this.buildBookingReply(name)
      : this.buildDefaultReply(name);

    await this.sendReply(from, replyText);
    return replyText;
  }

  /**
   * Sends a booking confirmation after an appointment is saved.
   */
  async sendBookingConfirmation(booking: BookingConfirmation): Promise<void> {
    const { patientPhone, name, scheduledFor } = booking;
    const friendlyDate = scheduledFor
      ? new Date(scheduledFor).toLocaleString('es-CL', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'America/Santiago',
        })
      : '(por confirmar)';

    const text =
      `Hola${name ? ` ${name}` : ''}! Tu cita ha sido reservada para el ${friendlyDate}. ` +
      `Recibirás un recordatorio 24 horas antes. ` +
      `Si necesitas cancelar o reprogramar, responde a este mensaje.`;

    await this.sendReply(`whatsapp:${patientPhone.replace('whatsapp:', '')}`, text);
  }

  private detectBookingIntent(body: string): boolean {
    const keywords = [
      'agendar', 'agenda', 'cita', 'hora', 'turno', 'reservar', 'reserva',
      'consulta', 'appointment', 'book', 'schedule',
    ];
    return keywords.some((kw) => body.includes(kw));
  }

  private buildBookingReply(name: string): string {
    const phone = process.env.DOCTOR_WHATSAPP_NUMBER ?? '(número del consultorio)';
    return (
      `Hola ${name}! Gracias por contactarnos. Para agendar tu consulta de reumatología, ` +
      `puedes escribir tu nombre, RUT y la fecha que más te acomoda. ` +
      `También puedes llamar directamente a ${phone}. ` +
      `Nuestro equipo te confirmará la hora disponible a la brevedad. 🗓️`
    );
  }

  private buildDefaultReply(name: string): string {
    return (
      `Hola ${name}! Bienvenido/a al consultorio. ` +
      `Para agendar una consulta de reumatología, escríbenos "agendar cita" y te ayudaremos. ` +
      `Recuerda que también puedes ver nuestro contenido educativo en Instagram.`
    );
  }

  private async sendReply(to: string, body: string): Promise<void> {
    const client = this.getClient();
    if (!client) {
      this.logger.log(`[whatsapp simulado] Para ${to}:\n${body}`);
      return;
    }
    try {
      const msg = await client.messages.create({
        from: this.twilioWhatsAppFrom,
        to,
        body,
      });
      this.logger.log(`[whatsapp] Mensaje enviado: ${msg.sid}`);
    } catch (e) {
      this.logger.error(`[whatsapp] Error enviando a ${to}: ${(e as Error).message}`);
    }
  }
}
