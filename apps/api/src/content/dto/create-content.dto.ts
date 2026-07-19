import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CONTENT_TYPES, ContentType } from '@medgram/shared-types';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsIn(CONTENT_TYPES)
  type: ContentType;

  /** Copy opcional: en Fase 1 lo puede escribir la agencia; el pipeline IA (Paso 5) lo generará. */
  @IsOptional()
  @IsString()
  generatedCopy?: string;

  /** Quién crea el borrador (email o etiqueta); default "system:api". */
  @IsOptional()
  @IsString()
  createdBy?: string;

  /** Guión para reels generado por el pipeline IA. */
  @IsOptional()
  @IsString()
  reelScript?: string;
}
