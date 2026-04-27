/**
 * Hook personalizado para sincronizar estado con localStorage
 * Uso: const [valor, setValor] = useLocalStorage('clave', valorInicial)
 */
import { useState, useCallback } from 'react';

/**
 * @param {string} key  - clave de localStorage
 * @param {*} initialValue - valor inicial si no existe en storage
 */
export function useLocalStorage(key, initialValue) {
  // Inicializa leyendo desde localStorage (solo en el primer render)
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: error leyendo "${key}"`, error);
      return initialValue;
    }
  });

  /** Actualiza el estado y sincroniza con localStorage */
  const setValue = useCallback((value) => {
    try {
      // Permite pasar función updater igual que useState
      const valueToStore = typeof value === 'function'
        ? value(storedValue)
        : value;

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`useLocalStorage: error guardando "${key}"`, error);
    }
  }, [key, storedValue]);

  /** Elimina el valor del localStorage y resetea al inicial */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`useLocalStorage: error eliminando "${key}"`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
