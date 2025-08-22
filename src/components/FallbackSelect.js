import React from 'react';

/**
 * Componente de fallback para navegadores que não suportam o CustomSelect
 * Usa o select nativo do navegador com estilos melhorados
 */
const FallbackSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  disabled = false,
  className = '',
  label = '',
  required = false,
  error = null
}) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 rounded-xl border transition-all duration-300
          ${disabled 
            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed' 
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:border-amber-500 dark:hover:border-amber-500 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer'
          }
          ${error ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''}
          custom-select-native
        `}
        style={{
          backgroundImage: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none'
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{
              backgroundColor: 'var(--bg-color, #ffffff)',
              color: 'var(--text-color, #171717)'
            }}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default FallbackSelect;
