import { Body, Controller, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ScheduleContentDto } from './dto/schedule-content.dto';
import { PublishingService } from './publishing.service';

@Controller('content')
export class PublishingController {
  constructor(private readonly publishing: PublishingService) {}

  @Post(':id/schedule')
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleContentDto,
    @Headers('x-user-email') actor?: string,
  ) {
    return this.publishing.schedule(id, dto.scheduledFor, actor ?? 'system:api');
  }
}
