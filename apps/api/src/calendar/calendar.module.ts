import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { BookingService } from './booking.service';
import { CalendarController } from './calendar.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarController],
  providers: [GoogleCalendarService, BookingService],
  exports: [GoogleCalendarService, BookingService],
})
export class CalendarModule {}
