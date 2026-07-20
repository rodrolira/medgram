import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import { Role, Session, verifySession } from './session-crypto';

const SESSION_COOKIE = 'medgram-session';

/**
 * Guard global: verifica la cookie de sesión firmada con HMAC (mismo esquema y SESSION_SECRET
 * que el dashboard). Sin cookie válida -> 401. Con @Roles, exige el rol -> 403 si no coincide.
 *
 * Al pasar, sobreescribe el header x-user-email con el email verificado, de modo que los
 * controllers que ya lo leen usan la identidad confiable sin cambios.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = parseCookie(req.headers.cookie, SESSION_COOKIE);
    const session = token ? verifySession(token) : null;
    if (!session) {
      throw new UnauthorizedException('Sesión inválida o ausente');
    }

    attachSession(req, session);

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && roles.length > 0 && !roles.includes(session.role)) {
      throw new ForbiddenException('Rol sin permiso para esta acción');
    }

    return true;
  }
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

function attachSession(req: Request, session: Session): void {
  (req as Request & { session?: Session }).session = session;
  // Identidad confiable para los controllers que leen x-user-email.
  req.headers['x-user-email'] = session.email;
}
