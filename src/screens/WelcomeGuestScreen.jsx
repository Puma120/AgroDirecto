/**
 * WelcomeGuestScreen — Pantalla de bienvenida para invitados
 * Muestra la propuesta de valor y CTA para registrarse
 */
import { useNavigate } from 'react-router-dom';
import { Leaf, Clock, TrendingDown, Truck, Star } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

const FEATURES = [
  {
    icon: Clock,
    color: 'bg-blue-50 text-blue-600',
    title: 'Cosechado en 24h',
    desc:  'Del campo a tu puerta en menos de un día',
  },
  {
    icon: TrendingDown,
    color: 'bg-green-50 text-green-600',
    title: '42% más barato',
    desc:  'Precios directos sin intermediarios',
  },
  {
    icon: Truck,
    color: 'bg-orange-50 text-orange-600',
    title: 'Envío gratis +$300',
    desc:  'Envío express gratis en pedidos mayores a $300',
  },
  {
    icon: Star,
    color: 'bg-yellow-50 text-yellow-600',
    title: 'Productores verificados',
    desc:  'Todos nuestros productores son de Puebla y están certificados',
  },
];

export default function WelcomeGuestScreen() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  function handleContinueAsGuest() {
    loginAsGuest();
    navigate(ROUTES.CATALOG);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary-600 via-primary-500 to-primary-400 px-6 pt-20 pb-14 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf size={36} className="text-white" />
          <span className="text-4xl font-bold text-white tracking-tight">AgroDirecto</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Del campo de Puebla a tu mesa
        </h2>
        <p className="text-primary-100 text-sm leading-relaxed max-w-xs mx-auto">
          Conectamos productores locales con familias urbanas. Sin intermediarios. Con trazabilidad total.
        </p>

        {/* Estadísticas */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">42%</p>
            <p className="text-primary-100 text-xs mt-0.5">más barato</p>
          </div>
          <div className="w-px bg-primary-300" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">&lt;24h</p>
            <p className="text-primary-100 text-xs mt-0.5">desde la cosecha</p>
          </div>
          <div className="w-px bg-primary-300" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">50+</p>
            <p className="text-primary-100 text-xs mt-0.5">productores</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-8 max-w-md w-full mx-auto">
        <div className="space-y-3 mb-8">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button size="full" onClick={() => navigate(ROUTES.REGISTER)}>
            Crear cuenta gratis
          </Button>
          <Button size="full" variant="outline" onClick={() => navigate(ROUTES.LOGIN)}>
            Ya tengo cuenta — Iniciar sesión
          </Button>
          <button
            onClick={handleContinueAsGuest}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors min-h-[44px]"
          >
            Explorar sin registrarme →
          </button>
        </div>
      </div>
    </div>
  );
}
