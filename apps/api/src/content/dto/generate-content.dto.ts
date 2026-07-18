import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CONTENT_TYPES, ContentType } from '@medgram/shared-types';

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsIn(CONTENT_TYPES)
  type: ContentType;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
