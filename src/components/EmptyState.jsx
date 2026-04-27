/**
 * EmptyState — Estado vacío reutilizable
 * Para listas sin datos, resultados sin coincidencias, etc.
 */

/**
 * @param {React.ReactNode} icon     - ícono o emoji grande
 * @param {string}          title    - título principal
 * @param {string}          message  - descripción secundaria
 * @param {React.ReactNode} action   - CTA (botón u otro elemento)
 */
export default function EmptyState({ icon, title, message, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && (
        <div className="text-5xl mb-4 select-none" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
          {message}
        </p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
