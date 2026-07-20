import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { BookingService } from './booking.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly gcal: GoogleCalendarService,
  ) {}

  /** GET /calendar/slots?date=YYYY-MM-DD */
  @Get('slots')
  getSlots(@Query('date') date: string) {
    return this.gcal.getAvailableSlots(date ?? new Date().toISOString().slice(0, 10));
  }

  /** GET /calendar/status */
  @Get('status')
  getStatus() {
    return { connected: this.gcal.isConnected };
  }

  // Los eventos y las citas contienen datos de pacientes (PHI): solo el doctor los ve/gestiona.
  // La agencia gestiona marketing, no información clínica. slots/status quedan abiertos porque
  // solo exponen disponibilidad, sin PHI.

  /** GET /calendar/events */
  @Roles('doctor')
  @Get('events')
  getUpcomingEvents(@Query('days') days?: string) {
    return this.gcal.getUpcomingEvents(days ? parseInt(days, 10) : 7);
  }

  /** POST /calendar/bookings */
  @Roles('doctor')
  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  /** GET /calendar/bookings */
  @Roles('doctor')
  @Get('bookings')
  listBookings(@Query('all') all?: string) {
    return this.bookingService.findAll(all !== 'true');
  }

  /** GET /calendar/bookings/:id */
  @Roles('doctor')
  @Get('bookings/:id')
  getBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.findOne(id);
  }

  /** DELETE /calendar/bookings/:id */
  @Roles('doctor')
  @Delete('bookings/:id')
  cancelBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.cancel(id);
  }

  /** PATCH /calendar/bookings/:id/complete */
  @Roles('doctor')
  @Patch('bookings/:id/complete')
  completeBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.markCompleted(id);
  }
}
