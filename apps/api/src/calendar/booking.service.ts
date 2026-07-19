import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Booking } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gcal: GoogleCalendarService,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    const start = new Date(dto.scheduledFor);
    if (isNaN(start.getTime())) throw new BadRequestException('scheduledFor inválido');

    const end = new Date(start.getTime() + (dto.durationMinutes ?? 30) * 60000);

    // Verificar que el slot no esté ocupado en la DB
    const conflict = await this.prisma.booking.findFirst({
      where: {
        status: 'confirmed',
        scheduledFor: { gte: start, lt: end },
      },
    });
    if (conflict) throw new BadRequestException('El horario ya está reservado');

    const eventId = await this.gcal.createEvent({
      summary: `Consulta — ${dto.patientName ?? dto.patientPhone}`,
      start: start.toISOString(),
      end: end.toISOString(),
      description: dto.notes,
      attendeePhone: dto.patientPhone,
    });

    return this.prisma.booking.create({
      data: {
        patientPhone: dto.patientPhone,
        patientName: dto.patientName,
        scheduledFor: start,
        durationMinutes: dto.durationMinutes ?? 30,
        source: dto.source ?? 'whatsapp',
        notes: dto.notes,
        googleCalendarEventId: eventId,
      },
    });
  }

  async findAll(upcoming = true): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: upcoming ? { scheduledFor: { gte: new Date() }, status: 'confirmed' } : {},
      orderBy: { scheduledFor: 'asc' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<Booking> {
    const b = await this.prisma.booking.findUnique({ where: { id } });
    if (!b) throw new NotFoundException(`Booking ${id} no encontrado`);
    return b;
  }

  async cancel(id: string): Promise<Booking> {
    const b = await this.findOne(id);
    if (b.googleCalendarEventId) {
      await this.gcal.deleteEvent(b.googleCalendarEventId);
    }
    return this.prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
  }

  async markCompleted(id: string): Promise<Booking> {
    await this.findOne(id);
    return this.prisma.booking.update({ where: { id }, data: { status: 'completed' } });
  }
}
