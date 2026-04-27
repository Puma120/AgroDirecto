/**
 * CategoryChips — Chips de categorías con scroll horizontal
 * Permite filtrar el catálogo por categoría de forma táctil
 */
import { useRef } from 'react';
import { CATEGORIES } from '../utils/constants';

/**
 * @param {string}   selected   - id de categoría activa
 * @param {Function} onSelect   - callback(categoryId)
 * @param {Object[]} [counts]   - { categoryId: count } para mostrar cantidades
 */
export default function CategoryChips({ selected = 'all', onSelect, counts = {} }) {
  const scrollRef = useRef(null);

  return (
    <div className="relative">
      {/* Gradiente de fade en los bordes para indicar scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Lista scrollable */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        {CATEGORIES.map(({ id, label, emoji }) => {
          const isActive = selected === id;
          const count    = counts[id];

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] active:scale-95
                ${isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span role="img" aria-hidden="true">{emoji}</span>
              <span>{label}</span>
              {count !== undefined && count > 0 && !isActive && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
