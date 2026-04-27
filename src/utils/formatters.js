/**
 * Funciones de formato para AgroDirecto
 * Precios en MXN, fechas relativas, etc.
 */

/**
 * Formatea un número como moneda mexicana
 * @param {number} amount - cantidad a formatear
 * @returns {string} "$123.50"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha ISO a texto relativo en español
 * @param {string} isoDate
 * @returns {string} "hace 2 horas" | "ayer" | "12 abr"
 */
export function formatRelativeDate(isoDate) {
  const now  = new Date();
  const date = new Date(isoDate);
  const diffMs    = now - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins < 1)    return 'ahora mismo';
  if (diffMins < 60)   return `hace ${diffMins} min`;
  if (diffHours < 24)  return `hace ${diffHours} h`;
  if (diffDays === 1)  return 'ayer';
  if (diffDays < 7)    return `hace ${diffDays} días`;

  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

/**
 * Formatea hora de cosecha como "Cosechado hace N horas"
 * @param {number} hours
 * @returns {string}
 */
export function formatFreshness(hours) {
  if (hours < 1)  return 'Cosechado esta mañana';
  if (hours < 24) return `Cosechado hace ${hours}h`;
  if (hours < 48) return 'Cosechado ayer';
  return `Cosechado hace ${Math.floor(hours / 24)} días`;
}

/**
 * Trunca texto a N caracteres con elipsis
 * @param {string} text
 * @param {number} maxLength
 */
export function truncate(text, maxLength = 60) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Formatea número de teléfono mexicano: 5512345678 → 55 1234-5678
 * @param {string} phone
 */
export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
