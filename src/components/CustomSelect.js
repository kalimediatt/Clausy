import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import './CustomSelect.css';

/**
 * Componente de select customizado para melhor compatibilidade entre navegadores
 */
const CustomSelect = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const selectRef = useRef(null);

  // Encontrar a opção selecionada
  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option);
  }, [value, options]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Navegar para próxima opção
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        handleSelect(options[nextIndex]);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Navegar para opção anterior
        const currentIndex = options.findIndex(opt => opt.value === value);
        const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
        handleSelect(options[prevIndex]);
      }
    }
  };

  return (
    <div className={`relative custom-select-container ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        ref={selectRef}
        className={`
          relative w-full px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer custom-select-header
          ${disabled 
            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed' 
            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:border-amber-500 dark:hover:border-amber-500 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
          }
          ${error ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${label}-label` : undefined}
        aria-describedby={error ? `${label}-error` : undefined}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${!selectedOption ? 'text-neutral-500 dark:text-neutral-400' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2"
          >
            <FaChevronDown className="w-4 h-4 text-neutral-400" />
          </motion.div>
        </div>
      </div>

      {error && (
        <p id={`${label}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl backdrop-blur-lg max-h-60 overflow-auto custom-select-options"
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option, index) => (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.05 }}
                  className={`
                    relative px-3 py-2 cursor-pointer transition-all duration-200 custom-select-option
                    ${option.value === value 
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' 
                      : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }
                    ${index === 0 ? 'rounded-t-xl' : ''}
                    ${index === options.length - 1 ? 'rounded-b-xl' : ''}
                  `}
                  onClick={() => handleSelect(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option);
                    }
                  }}
                  role="option"
                  aria-selected={option.value === value}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate">{option.label}</span>
                    {option.value === value && (
                      <FaCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
