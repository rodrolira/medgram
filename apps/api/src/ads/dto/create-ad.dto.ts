import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAdDto {
  @IsString()
  contentItemId: string;

  @IsInt()
  @Min(100)
  @Max(100_000_00)
  dailyBudgetCents: number;

  @IsInt()
  @Min(1)
  @Max(90)
  durationDays: number;

  @IsOptional()
  @IsString()
  customTopic?: string;
}
