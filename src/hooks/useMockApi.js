/**
 * Hook genérico para llamadas a la API mock
 * Maneja estado de carga, error y datos de forma uniforme
 */
import { useState, useCallback } from 'react';

/**
 * @returns {{ data, loading, error, execute }}
 * - execute(asyncFn) dispara la llamada y gestiona el estado
 */
export function useMockApi() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /**
   * Ejecuta una función async (e.g. mockLogin, fetchProducts)
   * @param {Function} asyncFn - función que retorna Promise
   * @returns {Promise<*>} - el resultado de la función
   */
  const execute = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Limpia estado (útil al desmontar) */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
