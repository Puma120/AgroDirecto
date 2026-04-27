/**
 * Toast — Notificación temporal tipo snackbar
 * Se usa mediante el ToastContext (ver abajo)
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle  size={20} className="text-green-500" />,
  error:   <XCircle      size={20} className="text-red-500"   />,
  warning: <AlertTriangle size={20} className="text-yellow-500" />,
  info:    <Info          size={20} className="text-blue-500"  />,
};

const BG_COLORS = {
  success: 'bg-green-50 border-green-200',
  error:   'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info:    'bg-blue-50 border-blue-200',
};

/** Toast individual */
function ToastItem({ toast, onDismiss }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up max-w-sm w-full ${BG_COLORS[toast.type]}`}
      role="alert"
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
        )}
        <p className="text-gray-700 text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 min-h-0 p-0.5"
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/** Contenedor de toasts (esquina superior derecha en desktop, abajo en mobile) */
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none sm:bottom-4 sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Muestra un toast
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} [title]
   * @param {number} [duration] ms — 0 para no auto-cerrar
   */
  const showToast = useCallback(({ message, type = 'info', title, duration = 3500 }) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
