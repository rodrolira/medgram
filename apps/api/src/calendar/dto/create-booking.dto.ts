import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  patientPhone: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsISO8601()
  scheduledFor: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
