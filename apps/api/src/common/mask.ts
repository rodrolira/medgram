/**
 * Enmascara un teléfono para logs, dejando visibles solo los últimos 4 dígitos.
 * Evita volcar PHI (datos de pacientes) en texto plano en los registros.
 *   "whatsapp:+56911112222" -> "***2222"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(sin teléfono)';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}
