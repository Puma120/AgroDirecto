/**
 * URL base de la API.
 *
 * • En desarrollo (Vite dev server) queda vacío → los fetch usan rutas relativas
 *   como `/api/products`, que el proxy de Vite redirige a http://localhost:3001.
 *
 * • En producción (Vercel) se define VITE_API_URL en las variables de entorno
 *   del proyecto Vercel apuntando al servicio de Render, p. ej.:
 *   https://agrodirecto-api.onrender.com
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';
