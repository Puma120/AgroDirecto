/**
 * App - Raiz de AgroDirecto
 * Monta todos los providers en el orden correcto:
 * Auth → Toast → Cart → Router
 */
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { CartProvider } from './context/CartContext';
import AppRouter from './routes/AppRouter';

export default function App() {
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