import { SetMetadata } from '@nestjs/common';
import type { Role } from './session-crypto';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a los roles indicados. El SessionGuard rechaza con 403 si el rol
 * de la sesión verificada no está en la lista. Sin este decorador, cualquier sesión válida
 * (doctor o agencia) puede acceder.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
