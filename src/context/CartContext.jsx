/**
 * CartContext — Contexto global del carrito de compras
 * Persiste en localStorage automáticamente con cada cambio
 * Módulo 3 expandirá este contexto con checkout, dirección y pago
 */
import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, BUSINESS_RULES } from '../utils/constants';

// ─── Contexto ─────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage(STORAGE_KEYS.CART, []);

  // ── Totales calculados con useMemo (recalcula solo cuando items cambia) ───
  const totals = useMemo(() => {
    const subtotal  = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping  = subtotal >= BUSINESS_RULES.FREE_SHIPPING_THRESHOLD
      ? 0
      : subtotal > 0 ? BUSINESS_RULES.SHIPPING_COST : 0;
    const discount  = 0; // Se aplica en checkout con cupones (Módulo 3)
    const total     = subtotal + shipping - discount;
    const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

    return { subtotal, shipping, discount, total, itemCount };
  }, [items]);

  /**
   * Agrega un producto al carrito o incrementa su cantidad
   * @param {Object} product - producto del catálogo
   * @param {number} qty     - cantidad a agregar (default 1)
   */
  const addItem = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        // Respeta stock máximo del producto
        const newQty = Math.min(existing.qty + qty, product.maxOrder || 99);
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: newQty } : i
        );
      }
      // Agrega nuevo item con los campos necesarios
      return [...prev, {
        id:         product.id,
        name:       product.name,
        price:      product.price,
        unit:       product.unit,
        image:      product.image,
        producer:   product.producer?.farmName || product.producer?.name,
        producerId: product.producer?.id ?? null,
        maxOrder:   product.maxOrder || 99,
        qty,
      }];
    });
  }, [setItems]);

  /**
   * Actualiza la cantidad de un producto en el carrito
   * Si qty <= 0, elimina el producto
   * @param {string} productId
   * @param {number} qty
   */
  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => i.id === productId
        ? { ...i, qty: Math.min(qty, i.maxOrder || 99) }
        : i
      )
    );
  }, [setItems]);

  /**
   * Elimina un producto del carrito
   * @param {string} productId
   */
  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, [setItems]);

  /** Vacía el carrito completamente */
  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  /**
   * Verifica si un producto está en el carrito
   * @param {string} productId
   * @returns {boolean}
   */
  const isInCart = useCallback((productId) => {
    return items.some((i) => i.id === productId);
  }, [items]);

  /**
   * Obtiene la cantidad de un producto en el carrito
   * @param {string} productId
   * @returns {number}
   */
  const getItemQty = useCallback((productId) => {
    return items.find((i) => i.id === productId)?.qty || 0;
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      totals,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      isInCart,
      getItemQty,
      minFreeShipping: BUSINESS_RULES.FREE_SHIPPING_THRESHOLD,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
