import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContentStatus } from '@prisma/client';
import { CONTENT_STATUSES } from '@medgram/shared-types';
import { Roles } from '../auth/roles.decorator';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { GenerateContentDto } from './dto/generate-content.dto';
import { ApproveContentDto, RejectContentDto, RequestChangesDto } from './dto/review-content.dto';

// El revisor se identifica con x-user-email, que el SessionGuard sobreescribe con el email
// verificado de la cookie de sesión. El fallback solo aplica si el guard estuviera deshabilitado.
const DEFAULT_REVIEWER = 'doctor@medgram.local';

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.content.create(dto);
  }

  // Generación con IA: costosa (tokens + imagen). Limitar aunque sea agencia autenticada.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Roles('agency')
  @Post('generate')
  generate(@Body() dto: GenerateContentDto, @Headers('x-user-email') actor?: string) {
    return this.content.generateAndQueue(dto.topic, dto.type, actor ?? dto.createdBy);
  }

  @Roles('agency')
  @Post(':id/regenerate')
  regenerate(@Param('id', ParseUUIDPipe) id: string, @Headers('x-user-email') actor?: string) {
    return this.content.regenerate(id, actor);
  }

  @Get('pending-approval')
  pendingApproval() {
    return this.content.findPendingApproval();
  }

  @Get()
  findAll(@Query('status') status?: string) {
    if (status && !CONTENT_STATUSES.includes(status as never)) {
      throw new BadRequestException(`status inválido: ${status}`);
    }
    return this.content.findAll(status as ContentStatus | undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.findOne(id);
  }

  @Post(':id/compliance-check')
  complianceCheck(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.runComplianceCheck(id);
  }

  @Patch(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveContentDto,
    @Headers('x-user-email') reviewer?: string,
  ) {
    return this.content.approve(id, reviewer ?? DEFAULT_REVIEWER, dto.comment);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectContentDto,
    @Headers('x-user-email') reviewer?: string,
  ) {
    return this.content.reject(id, reviewer ?? DEFAULT_REVIEWER, dto.reason);
  }

  @Patch(':id/request-changes')
  requestChanges(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestChangesDto,
    @Headers('x-user-email') reviewer?: string,
  ) {
    return this.content.requestChanges(id, reviewer ?? DEFAULT_REVIEWER, dto.comment);
  }
}
