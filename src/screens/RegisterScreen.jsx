/**
 * RegisterScreen — Pantalla de registro de nuevo usuario
 * Flujo: Datos personales → Selección de rol → Confirmación
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, ChevronLeft, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import { validateAuthForm } from '../utils/validators';
import { ROUTES, ROLES } from '../utils/constants';

export default function RegisterScreen() {
  const navigate    = useNavigate();
  const { register, authError, setAuthError } = useAuth();
  const { showToast } = useToast();

  const [step, setStep]     = useState(1); // 1: datos, 2: rol
  const [form, setForm]     = useState({
    name: '', email: '', phone: '', password: '', role: ROLES.CONSUMER,
  });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Actualiza campo y limpia error */
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  /** Avanza al paso 2 validando el formulario */
  function handleNextStep(e) {
    e.preventDefault();
    const validationErrors = validateAuthForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setStep(2);
  }

  /** Envío final */
  async function handleSubmit() {
    setIsLoading(true);
    const ok = await register(form);
    setIsLoading(false);

    if (ok) {
      showToast({
        message: `¡Bienvenido a AgroDirecto, ${form.name.split(' ')[0]}!`,
        type: 'success',
        title: 'Cuenta creada',
        duration: 4000,
      });
      navigate(form.role === ROLES.PRODUCER ? ROUTES.PRODUCER_HOME : ROUTES.CATALOG);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ─── Encabezado ───────────────────────────────────────────────── */}
      <div className="flex items-center px-4 pt-12 pb-6">
        <button
          onClick={() => step === 1 ? navigate(ROUTES.LOGIN) : setStep(1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors mr-2"
          aria-label="Regresar"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-sm text-gray-500">
            Paso {step} de 2 — {step === 1 ? 'Tus datos' : 'Tu rol'}
          </p>
        </div>
      </div>

      {/* ─── Barra de progreso ────────────────────────────────────────── */}
      <div className="px-6 mb-6">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 max-w-md w-full mx-auto">

        {/* ─── PASO 1: Datos personales ──────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleNextStep} noValidate className="space-y-4 animate-fade-in">

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {authError}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                Nombre completo
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ana García López"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                    ${errors.name ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-email">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="tu@correo.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                    ${errors.email ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">
                Teléfono (10 dígitos)
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="2221234567"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                    ${errors.phone ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'}`}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reg-password">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                    ${errors.password ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0 p-1"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <Button type="submit" size="full" className="mt-2">
              Continuar →
            </Button>
          </form>
        )}

        {/* ─── PASO 2: Selección de rol ──────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cómo usarás AgroDirecto?</h2>
              <p className="text-sm text-gray-500">Podrás cambiar esto después desde tu perfil</p>
            </div>

            <div className="space-y-3">
              {/* Rol Consumidor */}
              <button
                onClick={() => handleChange('role', ROLES.CONSUMER)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all min-h-[80px]
                  ${form.role === ROLES.CONSUMER
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <span className="text-3xl">🛒</span>
                <div>
                  <p className="font-semibold text-gray-900">Soy consumidor</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Compro productos frescos directamente del campo
                  </p>
                </div>
                {form.role === ROLES.CONSUMER && (
                  <span className="ml-auto text-primary-600 font-bold text-lg">✓</span>
                )}
              </button>

              {/* Rol Productor */}
              <button
                onClick={() => handleChange('role', ROLES.PRODUCER)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all min-h-[80px]
                  ${form.role === ROLES.PRODUCER
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <span className="text-3xl">👨‍🌾</span>
                <div>
                  <p className="font-semibold text-gray-900">Soy productor</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Vendo mis cosechas directamente a los consumidores
                  </p>
                </div>
                {form.role === ROLES.PRODUCER && (
                  <span className="ml-auto text-primary-600 font-bold text-lg">✓</span>
                )}
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {authError}
              </div>
            )}

            <Button size="full" loading={isLoading} onClick={handleSubmit}>
              Crear mi cuenta
            </Button>

            <p className="text-center text-xs text-gray-400 pb-4">
              Al registrarte aceptas los{' '}
              <span className="text-primary-600 underline cursor-pointer">Términos de uso</span>
              {' '}y la{' '}
              <span className="text-primary-600 underline cursor-pointer">Política de privacidad</span>
            </p>
          </div>
        )}

        {/* Enlace a login */}
        {step === 1 && (
          <p className="text-center text-sm text-gray-500 mt-6 pb-8">
            ¿Ya tienes cuenta?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary-600 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
