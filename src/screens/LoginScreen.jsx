/**
 * LoginScreen — Pantalla de inicio de sesión
 * Mobile-first: full-screen, validación en tiempo real, acceso como invitado
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import { isValidEmail, isValidPassword } from '../utils/validators';
import { ROUTES } from '../utils/constants';

export default function LoginScreen() {
  const navigate            = useNavigate();
  const { login, loginAsGuest, authError, setAuthError } = useAuth();
  const { showToast }       = useToast();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Usuarios demo para facilitar pruebas
  const DEMO_USERS = [
    { label: 'Consumidor demo', email: 'maria@ejemplo.com', password: '123456' },
    { label: 'Productor demo',  email: 'roberto@productor.com', password: 'productor123' },
  ];

  /** Actualiza campo y limpia error individual */
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  /** Valida campo al perder foco */
  function handleBlur(field) {
    if (field === 'email' && form.email && !isValidEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'Correo inválido' }));
    }
    if (field === 'password' && form.password && !isValidPassword(form.password)) {
      setErrors((prev) => ({ ...prev, password: 'Mínimo 6 caracteres' }));
    }
  }

  /** Envío del formulario */
  async function handleSubmit(e) {
    e.preventDefault();

    // Validación antes de enviar
    const newErrors = {};
    if (!isValidEmail(form.email))       newErrors.email    = 'Ingresa un correo válido';
    if (!isValidPassword(form.password)) newErrors.password = 'Ingresa tu contraseña';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const ok = await login(form.email, form.password);
    setIsLoading(false);

    if (ok) {
      showToast({ message: '¡Bienvenido de regreso!', type: 'success' });
      navigate(ROUTES.CATALOG);
    }
  }

  /** Carga usuario demo */
  function loadDemo(user) {
    setForm({ email: user.email, password: user.password });
    setErrors({});
    setAuthError(null);
  }

  /** Entra como invitado */
  function handleGuest() {
    loginAsGuest();
    navigate(ROUTES.CATALOG);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ─── Encabezado con degradado ─────────────────────────────────── */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-500 px-6 pt-16 pb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Leaf size={32} className="text-white" />
          <span className="text-3xl font-bold text-white tracking-tight">AgroDirecto</span>
        </div>
        <p className="text-primary-100 text-sm leading-relaxed">
          Del campo a tu mesa en menos de 24 horas.<br />
          Hasta <span className="font-bold text-white">42% más barato</span> que el supermercado.
        </p>
      </div>

      {/* ─── Formulario ───────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-8 max-w-md w-full mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
        <p className="text-gray-500 text-sm mb-6">Accede a tu cuenta</p>

        {/* Error global de auth */}
        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="tu@correo.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                  ${errors.email
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••"
                className={`w-full pl-10 pr-12 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-colors
                  ${errors.password
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0 p-1"
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* CTA principal */}
          <Button type="submit" size="full" loading={isLoading} className="mt-2">
            Entrar
          </Button>
        </form>

        {/* Usuarios demo (solo en desarrollo) */}
        <div className="mt-4">
          <p className="text-xs text-center text-gray-400 mb-2">Cuentas de prueba</p>
          <div className="flex gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => loadDemo(u)}
                className="flex-1 py-2 px-3 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors min-h-[36px]"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Continuar como invitado */}
        <Button variant="outline" size="full" onClick={handleGuest}>
          Continuar como invitado
        </Button>

        {/* Enlace de registro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary-600 font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
