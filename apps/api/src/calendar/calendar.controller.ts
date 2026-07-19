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

  /** GET /calendar/events */
  @Get('events')
  getUpcomingEvents(@Query('days') days?: string) {
    return this.gcal.getUpcomingEvents(days ? parseInt(days, 10) : 7);
  }

  /** POST /calendar/bookings */
  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  /** GET /calendar/bookings */
  @Get('bookings')
  listBookings(@Query('all') all?: string) {
    return this.bookingService.findAll(all !== 'true');
  }

  /** GET /calendar/bookings/:id */
  @Get('bookings/:id')
  getBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.findOne(id);
  }

  /** DELETE /calendar/bookings/:id */
  @Delete('bookings/:id')
  cancelBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.cancel(id);
  }

  /** PATCH /calendar/bookings/:id/complete */
  @Patch('bookings/:id/complete')
  completeBooking(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.markCompleted(id);
  }
}
