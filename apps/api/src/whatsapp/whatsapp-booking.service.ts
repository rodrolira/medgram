import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';
import { maskPhone } from '../common/mask';
import { GoogleCalendarService, TimeSlot } from '../calendar/google-calendar.service';
import { BookingService } from '../calendar/booking.service';

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

interface PendingSession {
  slots: TimeSlot[];
  date: string;
  name: string;
  expiresAt: number;
}

@Injectable()
export class WhatsAppBookingService {
  private readonly logger = new Logger(WhatsAppBookingService.name);
  private client: ReturnType<typeof Twilio> | null = null;

  /** In-memory session store: phone → pending slot selection */
  private readonly sessions = new Map<string, PendingSession>();

  constructor(
    private readonly gcal: GoogleCalendarService,
    private readonly bookingService: BookingService,
  ) {}

  private getClient(): ReturnType<typeof Twilio> | null {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    if (!this.client) this.client = Twilio(sid, token);
    return this.client;
  }

  private get twilioWhatsAppFrom(): string {
    return process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
  }

  async handleIncomingMessage(payload: WhatsAppWebhookPayload): Promise<string> {
    const from = payload.From ?? '';
    const rawBody = (payload.Body ?? '').trim();
    const body = rawBody.toLowerCase();
    const name = payload.ProfileName ?? 'Paciente';

    this.logger.log(`[whatsapp] Mensaje de ${maskPhone(from)}: "${rawBody}"`);

    // Limpiar sesiones expiradas
    this.purgeSessions();

    const session = this.sessions.get(from);

    // --- Flujo: selección de slot (turno 2) ---
    if (session) {
      const pick = parseInt(rawBody, 10);
      if (!isNaN(pick) && pick >= 1 && pick <= session.slots.length) {
        return this.confirmBooking(from, session, pick - 1);
      }
      // Si dice "cancelar" o "salir"
      if (body.includes('cancelar') || body.includes('salir')) {
        this.sessions.delete(from);
        const reply = 'Entendido, la reserva fue cancelada. Escríbenos cuando quieras agendar tu cita. 👋';
        await this.sendReply(from, reply);
        return reply;
      }
      // Número fuera de rango o texto inesperado → re-mostrar opciones
      const reminder = this.buildSlotMenu(session.slots, session.date);
      await this.sendReply(from, `Por favor elige un número del 1 al ${session.slots.length}, o escribe "cancelar".\n\n${reminder}`);
      return reminder;
    }

    // --- Flujo: intención de agendar (turno 1) ---
    if (this.detectBookingIntent(body)) {
      return this.showAvailableSlots(from, name, body);
    }

    // --- Respuesta por defecto ---
    const reply = this.buildDefaultReply(name);
    await this.sendReply(from, reply);
    return reply;
  }

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
      `⏰ *Recordatorio de cita*\n\n` +
      `Hola${name ? ` ${name}` : ''}! Te recordamos tu consulta de reumatología ` +
      `para mañana *${friendlyDate}*.\n\n` +
      `Si necesitas cancelar o reprogramar, responde a este mensaje.`;

    await this.sendReply(`whatsapp:${patientPhone.replace('whatsapp:', '')}`, text);
  }

  // --- Internals ---

  private async showAvailableSlots(from: string, name: string, body: string): Promise<string> {
    const date = this.extractDate(body) ?? new Date().toISOString().slice(0, 10);
    const nextDate = this.getNextBusinessDay(date);

    let slots = await this.gcal.getAvailableSlots(date);
    let usedDate = date;

    // Si hoy no tiene slots disponibles, intentar el siguiente día hábil
    const availableToday = slots.filter((s) => s.available && new Date(s.start) > new Date());
    if (availableToday.length === 0) {
      slots = await this.gcal.getAvailableSlots(nextDate);
      usedDate = nextDate;
    }

    const available = slots.filter((s) => s.available && new Date(s.start) > new Date());

    if (available.length === 0) {
      const reply =
        `Hola ${name}! No encontramos horarios disponibles en los próximos días. ` +
        `Por favor contáctanos directamente al ${process.env.DOCTOR_WHATSAPP_NUMBER ?? 'nuestro número'}.`;
      await this.sendReply(from, reply);
      return reply;
    }

    // Guardar sesión (expira en 10 min)
    this.sessions.set(from, {
      slots: available,
      date: usedDate,
      name,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const menu = this.buildSlotMenu(available, usedDate);
    const reply =
      `Hola ${name}! 📅 Estos son los horarios disponibles para *${this.formatDate(usedDate)}*:\n\n` +
      menu +
      `\n\nResponde con el *número* del horario que prefieras, o escribe "cancelar".`;

    await this.sendReply(from, reply);
    return reply;
  }

  private async confirmBooking(from: string, session: PendingSession, slotIndex: number): Promise<string> {
    const slot = session.slots[slotIndex];
    this.sessions.delete(from);

    try {
      const booking = await this.bookingService.create({
        patientPhone: from.replace('whatsapp:', ''),
        patientName: session.name,
        scheduledFor: slot.start,
        source: 'whatsapp',
      });

      const friendlyDate = new Date(slot.start).toLocaleString('es-CL', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Santiago',
      });

      const reply =
        `✅ *Cita confirmada*\n\n` +
        `${session.name}, tu consulta de reumatología quedó agendada para:\n` +
        `📅 *${friendlyDate}*\n\n` +
        `Recibirás un recordatorio 24 horas antes. ` +
        `Si necesitas cancelar, responde "cancelar cita ${booking.id.slice(0, 8)}".`;

      await this.sendReply(from, reply);
      return reply;
    } catch (e) {
      const errMsg = (e as Error).message;
      const reply =
        errMsg.includes('ya está reservado')
          ? `Lo sentimos, ese horario fue tomado mientras conversábamos. Escríbenos "agendar" para ver los horarios actualizados.`
          : `Ocurrió un error al confirmar tu cita. Por favor intenta nuevamente o contáctanos directamente.`;

      await this.sendReply(from, reply);
      return reply;
    }
  }

  private buildSlotMenu(slots: TimeSlot[], date: string): string {
    return slots
      .slice(0, 8) // máx 8 opciones en WhatsApp para no saturar
      .map((s, i) => {
        const time = new Date(s.start).toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Santiago',
        });
        return `*${i + 1}.* ${time}`;
      })
      .join('\n');
  }

  private detectBookingIntent(body: string): boolean {
    const keywords = [
      'agendar', 'agenda', 'cita', 'hora', 'turno', 'reservar', 'reserva',
      'consulta', 'appointment', 'book', 'schedule', 'quiero una hora',
    ];
    return keywords.some((kw) => body.includes(kw));
  }

  private extractDate(body: string): string | null {
    // Formato explícito YYYY-MM-DD o DD/MM/YYYY
    const isoMatch = body.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const slashMatch = body.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (slashMatch) {
      const [, d, m, y] = slashMatch;
      const year = y ?? new Date().getFullYear().toString();
      return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Palabras relativas
    const today = new Date();
    if (body.includes('hoy')) return today.toISOString().slice(0, 10);
    if (body.includes('mañana')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().slice(0, 10);
    }

    return null;
  }

  private getNextBusinessDay(fromDate: string): string {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + 1);
    // Saltar fin de semana
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  private buildDefaultReply(name: string): string {
    return (
      `Hola ${name}! 👋 Bienvenido/a al consultorio de reumatología.\n\n` +
      `Puedo ayudarte a *agendar una cita*. Solo escríbeme "agendar" o "quiero una hora" y te mostraré los horarios disponibles.\n\n` +
      `También puedes ver nuestro contenido educativo en Instagram. 📸`
    );
  }

  private async sendReply(to: string, body: string): Promise<void> {
    const client = this.getClient();
    if (!client) {
      this.logger.log(`[whatsapp simulado] Para ${to}:\n${body}`);
      return;
    }
    try {
      const msg = await client.messages.create({ from: this.twilioWhatsAppFrom, to, body });
      this.logger.log(`[whatsapp] Mensaje enviado: ${msg.sid}`);
    } catch (e) {
      this.logger.error(`[whatsapp] Error enviando a ${to}: ${(e as Error).message}`);
    }
  }

  private purgeSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions) {
      if (session.expiresAt < now) this.sessions.delete(key);
    }
  }
}
