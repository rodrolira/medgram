import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como público: el SessionGuard lo deja pasar sin cookie de sesión.
 * Usar solo en rutas con su propio esquema de autenticación (webhook de Twilio) o sin datos
 * sensibles (health check).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
