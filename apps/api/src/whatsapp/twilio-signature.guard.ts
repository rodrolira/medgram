import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { validateRequest } from 'twilio';

/**
 * Valida la firma X-Twilio-Signature del webhook entrante para garantizar que la petición
 * viene realmente de Twilio y no de un tercero que intenta crear citas falsas.
 *
 * Algoritmo (lo implementa validateRequest del SDK): HMAC-SHA1 con el Auth Token sobre la URL
 * pública + los parámetros del POST ordenados, comparado en base64 contra el header.
 *
 * Degradación graceful: si TWILIO_AUTH_TOKEN no está configurado, el módulo de WhatsApp corre
 * en modo simulación (sin Twilio real), por lo que no hay firma que validar y se deja pasar con
 * una advertencia. En cuanto hay token, la validación es obligatoria.
 */
@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      this.logger.warn(
        'TWILIO_AUTH_TOKEN no configurado: webhook sin validar (modo simulación). Configúralo en producción.',
      );
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const signature = req.header('x-twilio-signature');
    if (!signature) {
      throw new ForbiddenException('Falta X-Twilio-Signature');
    }

    const url = webhookUrl(req);
    const params = (req.body ?? {}) as Record<string, unknown>;

    if (!validateRequest(authToken, signature, url, params)) {
      this.logger.warn(`Firma de Twilio inválida para ${url}`);
      throw new ForbiddenException('Firma de Twilio inválida');
    }

    return true;
  }
}

/**
 * Reconstruye la URL exacta que Twilio firmó. Detrás de un proxy (ngrok, load balancer) la URL
 * pública difiere de la interna, por eso se prioriza WEBHOOK_PUBLIC_URL y luego los headers
 * X-Forwarded-*.
 */
function webhookUrl(req: Request): string {
  if (process.env.WEBHOOK_PUBLIC_URL) return process.env.WEBHOOK_PUBLIC_URL;
  const proto = req.header('x-forwarded-proto') ?? req.protocol;
  const host = req.header('x-forwarded-host') ?? req.get('host') ?? 'localhost';
  return `${proto}://${host}${req.originalUrl}`;
}
