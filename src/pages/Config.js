import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSun, FaMoon, FaBell, FaSave, FaLanguage, FaCog, FaToggleOn, FaToggleOff, FaChevronDown } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';

// ⚙️ CONFIGURAÇÃO RÁPIDA: Habilita/Desabilita o botão de Modo Escuro
// Para BLOQUEAR: mude para false
// Para HABILITAR: mude para true
const ENABLE_THEME_TOGGLE = false;

const Config = () => {
  const [theme, setTheme] = useState("light");
  const { currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Estados das configurações
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('autoSave');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt';
  });

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleTheme = () => {
    // Force light mode; ignore dark mode
    setTheme("light");
    localStorage.setItem("theme", "light");
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Always enforce light
    localStorage.setItem("theme", "light");
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);

  const updateNotifications = (value) => {
    setNotifications(value);
    localStorage.setItem('notifications', JSON.stringify(value));
  };

  const updateAutoSave = (value) => {
    setAutoSave(value);
    localStorage.setItem('autoSave', JSON.stringify(value));
  };

  const updateLanguage = (value) => {
    setLanguage(value);
    localStorage.setItem('language', value);
    setIsLanguageDropdownOpen(false);
  };

  const languageOptions = [
    { value: 'pt', label: '🇧🇷 Português' },
    { value: 'en', label: '🇺🇸 English' },
    { value: 'es', label: '🇪🇸 Español' }
  ];

  const getCurrentLanguageLabel = () => {
    return languageOptions.find(option => option.value === language)?.label || '🇧🇷 Português';
  };

  const ToggleButton = ({ isActive, onClick, label, disabled = false }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input 
        type="checkbox" 
        checked={isActive}
        onChange={onClick}
        disabled={disabled}
        className="sr-only peer" 
      />
      <div className={`w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-600 ${disabled ? 'opacity-50' : ''}`}></div>
    </label>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500
      ${isMobile ? 'config-mobile-optimized overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800"
      >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div>
                <h1 className={`font-bold text-neutral-900 dark:text-neutral-100
                  ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  Configurações
                </h1>
                <p className={`text-neutral-600 dark:text-neutral-400
                  ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Configure a Clausy para máxima eficiência, precisão e proteção.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'pt-4 pb-4' : 'pt-12 pb-8'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-colors duration-500"
        >
          {/* Header Card */}
          <div className={`px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 ${isMobile ? 'px-4 py-3' : ''}`}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-r from-accent1 to-accent1 text-white shadow-lg ${isMobile ? 'p-2' : ''}`}>
                <FaCog className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
              <div>
                <h1 className={`font-bold text-neutral-900 dark:text-neutral-100
                  ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                  Configurações
                </h1>
                <p className={`text-neutral-600 dark:text-neutral-300 mt-1
                  ${isMobile ? 'text-xs' : ''}`}>
                  Configure a Clausy para máxima eficiência, precisão e proteção.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Settings Content */}
          <div className={`p-8 space-y-6 ${isMobile ? 'p-4 space-y-3' : ''}`}>
            
            {/* Dark Mode Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300
                ${isMobile ? 'p-3' : 'p-6'}`}
            >
              <div className={`flex items-center justify-between ${isMobile ? 'p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800' : ''}`}>
                <div className={`flex items-center ${isMobile ? '' : 'space-x-4'}`}>
                  <div className={`p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white ${isMobile ? 'hidden' : ''}`}>
                    {theme === "dark" ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      Modo Escuro
                    </h3>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Conforto visual para longas horas de leitura.
                    </p>
                  </div>
                </div>
                <ToggleButton 
                  isActive={theme === "dark"} 
                  onClick={toggleTheme}
                  label="Toggle dark mode"
                  disabled={!ENABLE_THEME_TOGGLE}
                />
              </div>
            </motion.div>

            {/* Notifications Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300
                ${isMobile ? 'p-3' : 'p-6'}`}
            >
              <div className={`flex items-center justify-between ${isMobile ? 'p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800' : ''}`}>
                <div className={`flex items-center ${isMobile ? '' : 'space-x-4'}`}>
                  <div className={`p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white ${isMobile ? 'hidden' : ''}`}>
                    <FaBell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      Notificações
                    </h3>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Alertas de prazos e tarefas, nunca mais perca um deadline.
                    </p>
                  </div>
                </div>
                <ToggleButton 
                  isActive={notifications} 
                  onClick={() => updateNotifications(!notifications)}
                  label="Toggle notifications"
                />
              </div>
            </motion.div>

            {/* Auto Save Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300
                ${isMobile ? 'p-3' : 'p-6'}`}
            >
              <div className={`flex items-center justify-between ${isMobile ? 'p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800' : ''}`}>
                <div className={`flex items-center ${isMobile ? '' : 'space-x-4'}`}>
                  <div className={`p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white ${isMobile ? 'hidden' : ''}`}>
                    <FaSave className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      Salvamento Automático
                    </h3>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Seus rascunhos e peças ficam salvos em tempo real, sem risco de perda
                    </p>
                  </div>
                </div>
                <ToggleButton 
                  isActive={autoSave} 
                  onClick={() => updateAutoSave(!autoSave)}
                  label="Toggle auto save"
                />
              </div>
            </motion.div>

            {/* Language Setting */}
            {/* Seção de configuração de idioma - Comentada temporariamente */}
      {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-accent1 to-accent1 text-white">
                    <FaLanguage className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Idioma da Interface
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                      Definir idioma preferido do sistema
                    </p>
                  </div>
                </div>
                <div className="relative language-dropdown">
                  <motion.button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-4 focus:ring-accent1/20 transition-all duration-300 shadow-sm flex items-center justify-between min-w-[140px]"
                    aria-label="Select language"
                  >
                    <span>{getCurrentLanguageLabel()}</span>
                    <motion.div
                      animate={{ rotate: isLanguageDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FaChevronDown className="w-3 h-3 ml-2" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isLanguageDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl backdrop-blur-lg z-[9999]"
                        style={{ 
                          marginTop: '8px',
                          minWidth: '140px'
                        }}
                      >
                        {languageOptions.map((option) => (
                          <motion.button
                            key={option.value}
                            onClick={() => updateLanguage(option.value)}
                            whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(64, 64, 64, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                            className={`w-full text-left px-4 py-3 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 first:rounded-t-lg last:rounded-b-lg ${
                              language === option.value ? 'bg-accent1/5 dark:bg-accent1/20 text-accent1 dark:text-accent1' : ''
                            }`}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div> */}

          </div>
        </motion.div>

        {/* User Info Card - comentado temporariamente */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 transition-colors duration-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent1 to-accent1 flex items-center justify-center text-white font-bold text-lg">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {currentUser?.name || 'Usuário'}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                {currentUser?.email || 'Email não informado'}
              </p>
            </div>
          </div>
        </motion.div> */}
      </div>
    </div>
  );
};

export default Config;