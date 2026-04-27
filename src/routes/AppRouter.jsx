/**
 * AppRouter — Enrutador principal de AgroDirecto con React Router v6
 * Maneja:
 * - Rutas públicas (login, register, bienvenida)
 * - Rutas protegidas por rol (consumer vs producer)
 * - Layout mobile con BottomNav
 * - Redirección automática según sesión
 */
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, ROLES } from '../utils/constants';
import BottomNav from '../components/BottomNav';

// ─── Pantallas ────────────────────────────────────────────────────────────────
import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import WelcomeGuestScreen   from '../screens/WelcomeGuestScreen';

// Lazy placeholders para módulos futuros (se reemplazarán en cada módulo)
import { lazy, Suspense } from 'react';
import { ProductGridSkeleton } from '../components/Skeleton';

// Screens con lazy loading
const CatalogScreen       = lazy(() => import('../screens/CatalogScreen'));
const ProductDetailScreen = lazy(() => import('../screens/ProductDetailScreen'));
const CartScreen          = lazy(() => import('../screens/CartScreen'));
const CheckoutScreen      = lazy(() => import('../screens/CheckoutScreen'));
const OrderSuccessScreen  = lazy(() => import('../screens/OrderSuccessScreen'));
const OrdersScreen        = lazy(() => import('../screens/OrdersScreen'));
const OrderDetailScreen   = lazy(() => import('../screens/OrderDetailScreen'));
const ProfileScreen       = lazy(() => import('../screens/ProfileScreen'));
const ProducerDashboard   = lazy(() => import('../screens/ProducerDashboard'));

// ─── Componente de carga mientras lazy-load ───────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

// ─── Guard: redirige a login si no hay sesión ─────────────────────────────────
function RequireAuth({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
}

// ─── Guard: redirige a catálogo si ya hay sesión ──────────────────────────────
function RedirectIfAuth({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isLoggedIn) return <Navigate to={ROUTES.CATALOG} replace />;
  return children;
}

// ─── Guard: solo productores ──────────────────────────────────────────────────
function RequireProducer({ children }) {
  const { isLoggedIn, isProducer, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!isProducer) return <Navigate to={ROUTES.CATALOG} replace />;
  return children;
}

// ─── Layout principal (con BottomNav) ────────────────────────────────────────
/**
 * Envuelve las pantallas del consumidor con la navegación inferior.
 * En desktop el BottomNav se oculta con sm:hidden.
 */
function ConsumerLayout() {
  const { isProducer } = useAuth();

  // Los productores acceden por otra ruta
  if (isProducer) return <Navigate to={ROUTES.PRODUCER_HOME} replace />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Contenido principal — padding-bottom para que no tape el BottomNav */}
      <main className="flex-1 pb-16 sm:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {/* BottomNav fijo en la parte inferior (solo mobile) */}
      <BottomNav />
    </div>
  );
}

// ─── Router principal ─────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rutas públicas (sin sesión requerida) ── */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <RedirectIfAuth>
              <LoginScreen />
            </RedirectIfAuth>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <RedirectIfAuth>
              <RegisterScreen />
            </RedirectIfAuth>
          }
        />
        <Route path={ROUTES.WELCOME_GUEST} element={<WelcomeGuestScreen />} />

        {/* ── Rutas de consumidor (con layout + BottomNav) ── */}
        <Route
          element={
            <RequireAuth>
              <ConsumerLayout />
            </RequireAuth>
          }
        >
          <Route path={ROUTES.CATALOG}        element={<CatalogScreen />}        />
          <Route path={ROUTES.PRODUCT_DETAIL}  element={<ProductDetailScreen />}  />
          <Route path={ROUTES.CART}            element={<CartScreen />}            />
          <Route path={ROUTES.CHECKOUT}        element={<CheckoutScreen />}        />
          <Route path={ROUTES.ORDER_SUCCESS}   element={<OrderSuccessScreen />}   />
          <Route path={ROUTES.ORDERS}          element={<OrdersScreen />}          />
          <Route path={ROUTES.ORDER_DETAIL}    element={<OrderDetailScreen />}    />
          <Route path={ROUTES.PROFILE}         element={<ProfileScreen />}         />
        </Route>

        {/* ── Rutas del productor ── */}
        <Route
          path={ROUTES.PRODUCER_HOME}
          element={
            <RequireProducer>
              <Suspense fallback={<PageLoader />}>
                <ProducerDashboard />
              </Suspense>
            </RequireProducer>
          }
        />

        {/* ── Redireccionamientos por defecto ── */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.CATALOG} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
