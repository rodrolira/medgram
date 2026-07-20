const INSECURE_DEFAULT_SECRET = 'dev-insecure-secret-change-in-production';

/**
 * Validación de entorno al arranque. En producción, un secreto de sesión ausente o igual al
 * default inseguro haría que la API verifique cookies con una clave conocida — cualquiera podría
 * forjar una sesión de agencia. Preferimos fallar rápido y ruidoso antes que arrancar inseguro.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  const errors: string[] = [];
  const secret = env.SESSION_SECRET;

  if (!secret || secret === INSECURE_DEFAULT_SECRET) {
    errors.push(
      'SESSION_SECRET ausente o con el valor por defecto inseguro. Generá uno con `openssl rand -base64 32` ' +
        'y usá el MISMO valor en la API y el dashboard.',
    );
  } else if (secret.length < 32) {
    errors.push('SESSION_SECRET demasiado corto (mínimo 32 caracteres).');
  }

  if (errors.length > 0) {
    throw new Error(`Configuración inválida en producción:\n- ${errors.join('\n- ')}`);
  }
}
