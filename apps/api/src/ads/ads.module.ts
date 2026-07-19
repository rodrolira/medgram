import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { MetaAdsService } from './meta-ads.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AdsController],
  providers: [AdsService, MetaAdsService],
  exports: [AdsService],
})
export class AdsModule {}
