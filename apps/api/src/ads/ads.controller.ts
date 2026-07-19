import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';

@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Post('promote')
  promote(@Body() dto: CreateAdDto) {
    return this.ads.promoteContent(dto);
  }

  @Get('status')
  status() {
    return this.ads.connectionStatus();
  }
}
