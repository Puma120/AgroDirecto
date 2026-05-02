/**
 * App - Raiz de AgroDirecto
 * Monta todos los providers en el orden correcto:
 * Auth → Toast → Cart → Router
 */
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { CartProvider } from './context/CartContext';
import AppRouter from './routes/AppRouter';
import { cleanupExpiredOrders } from './mocks/mockOrders';

export default function App() {
  // Limpiar pedidos expirados (closedAt > 2h) en cada carga/refresh
  useEffect(() => {
    cleanupExpiredOrders();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}