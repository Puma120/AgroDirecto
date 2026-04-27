/**
 * Funciones de validación para formularios de AgroDirecto
 */

/** Valida email básico */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Valida teléfono mexicano (10 dígitos, puede incluir +52)
 */
export function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  // acepta con o sin código de país 52
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('52'));
}

/**
 * Valida contraseña: mínimo 6 caracteres
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Valida nombre: al menos 2 caracteres
 */
export function isValidName(name) {
  return name && name.trim().length >= 2;
}

/**
 * Retorna el primer mensaje de error encontrado, o null si todo OK
 * @param {Object} fields - { fieldName: value }
 * @param {string[]} required - nombres de campos requeridos
 * @returns {Object} { fieldName: 'mensaje de error' } | {}
 */
export function validateAuthForm({ email, password, name, phone }) {
  const errors = {};

  if (name !== undefined && !isValidName(name)) {
    errors.name = 'Ingresa tu nombre completo';
  }
  if (email !== undefined && !isValidEmail(email)) {
    errors.email = 'Ingresa un correo válido';
  }
  if (phone !== undefined && !isValidPhone(phone)) {
    errors.phone = 'Ingresa un teléfono de 10 dígitos';
  }
  if (password !== undefined && !isValidPassword(password)) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return errors;
}
