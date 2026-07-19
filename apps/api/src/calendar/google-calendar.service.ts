import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';

export interface TimeSlot {
  start: string; // ISO string
  end: string;
  available: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

const SLOT_DURATION_MIN = 30;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: calendar_v3.Calendar | null = null;
  private calendarId: string;

  constructor(private readonly config: ConfigService) {
    this.calendarId = config.get('GOOGLE_CALENDAR_ID') ?? 'primary';
    const email = config.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const key = config.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

    if (email && key) {
      const auth = new google.auth.JWT({
        email,
        key: key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      this.calendar = google.calendar({ version: 'v3', auth });
      this.logger.log('Google Calendar conectado via Service Account');
    } else {
      this.logger.warn(
        'GOOGLE_SERVICE_ACCOUNT_EMAIL / PRIVATE_KEY no configurados — modo simulación activado',
      );
    }
  }

  get isConnected(): boolean {
    return this.calendar !== null;
  }

  /** Devuelve los slots de 30 min entre DAY_START y DAY_END, marcando cuáles están libres. */
  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const slots = this.buildSlots(date);

    if (!this.calendar) {
      // Simulación: todos disponibles
      return slots.map((s) => ({ ...s, available: true }));
    }

    try {
      const dayStart = new Date(`${date}T${pad(DAY_START_HOUR)}:00:00`);
      const dayEnd = new Date(`${date}T${pad(DAY_END_HOUR)}:00:00`);

      const res = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          items: [{ id: this.calendarId }],
        },
      });

      const busy = res.data.calendars?.[this.calendarId]?.busy ?? [];

      return slots.map((slot) => ({
        ...slot,
        available: !busy.some(
          (b) =>
            b.start && b.end &&
            new Date(b.start) < new Date(slot.end) &&
            new Date(b.end) > new Date(slot.start),
        ),
      }));
    } catch (e) {
      this.logger.error(`freebusy query falló: ${(e as Error).message}`);
      return slots.map((s) => ({ ...s, available: true }));
    }
  }

  /** Crea un evento en Google Calendar y retorna el eventId, o null si no hay credenciales. */
  async createEvent(opts: {
    summary: string;
    start: string;
    end: string;
    description?: string;
    attendeePhone?: string;
  }): Promise<string | null> {
    if (!this.calendar) {
      this.logger.log(
        `[simulación] Evento creado: "${opts.summary}" ${opts.start} → ${opts.end}`,
      );
      return `stub-event-${Date.now()}`;
    }

    try {
      const res = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: {
          summary: opts.summary,
          description: opts.description,
          start: { dateTime: opts.start },
          end: { dateTime: opts.end },
          reminders: {
            useDefault: false,
            overrides: [{ method: 'email', minutes: 1440 }], // 24h antes
          },
        },
      });
      return res.data.id ?? null;
    } catch (e) {
      this.logger.error(`createEvent falló: ${(e as Error).message}`);
      return null;
    }
  }

  /** Cancela un evento (no lanza si el evento ya no existe). */
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.calendar || eventId.startsWith('stub-')) return;
    try {
      await this.calendar.events.delete({ calendarId: this.calendarId, eventId });
    } catch (e) {
      this.logger.warn(`deleteEvent ${eventId}: ${(e as Error).message}`);
    }
  }

  /** Retorna los próximos eventos en los siguientes `days` días. */
  async getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
    if (!this.calendar) return [];

    try {
      const now = new Date();
      const until = new Date(now);
      until.setDate(until.getDate() + days);

      const res = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: until.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      return (res.data.items ?? [])
        .filter((e) => e.id && e.start?.dateTime)
        .map((e) => ({
          id: e.id!,
          summary: e.summary ?? '(sin título)',
          start: e.start!.dateTime!,
          end: e.end?.dateTime ?? e.start!.dateTime!,
          description: e.description ?? undefined,
        }));
    } catch (e) {
      this.logger.error(`getUpcomingEvents falló: ${(e as Error).message}`);
      return [];
    }
  }

  private buildSlots(date: string): Omit<TimeSlot, 'available'>[] {
    const slots: Omit<TimeSlot, 'available'>[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h += SLOT_DURATION_MIN / 60) {
      const hour = Math.floor(h);
      const min = Math.round((h - hour) * 60);
      const start = new Date(`${date}T${pad(hour)}:${pad(min)}:00`);
      const end = new Date(start.getTime() + SLOT_DURATION_MIN * 60000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
    return slots;
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
