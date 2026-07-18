import { IsDateString, IsOptional } from 'class-validator';

export class ScheduleContentDto {
  /** ISO 8601. Si se omite, se publica de inmediato. */
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
