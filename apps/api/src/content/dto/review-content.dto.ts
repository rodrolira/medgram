import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveContentDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectContentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class RequestChangesDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
