import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSun, FaMoon, FaBell, FaSave, FaLanguage, FaCog, FaToggleOn, FaToggleOff } from "react-icons/fa";
import WhiteLogo from '../logos/white.png';
import BlackLogo from '../logos/black.png';
import { useAuth } from '../contexts/AuthContext';

const Config = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const { currentUser } = useAuth();

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

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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
  };

  const ToggleButton = ({ isActive, onClick, label }) => (
    <motion.button
      onClick={onClick}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-500/20
        ${isActive 
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30' 
          : 'bg-neutral-200 dark:bg-neutral-700'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      <motion.div
        className={`
          absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300
          ${isActive ? 'left-7' : 'left-0.5'}
        `}
        animate={{ x: isActive ? 0 : 0 }}
      />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <img 
                src={theme === "dark" ? WhiteLogo : BlackLogo}
                alt="Clausy" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Clausy
              </span>
            </motion.div>


          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors duration-500"
        >
          {/* Header Card */}
          <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
                <FaCog className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Configurações
                </h1>
                <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                  Personalize sua experiência no Clausy
                </p>
              </div>
            </motion.div>
          </div>

          {/* Settings Content */}
          <div className="p-8 space-y-6">
            
            {/* Dark Mode Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    {theme === "dark" ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Modo Escuro
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                      Alterna entre tema claro e escuro globalmente
                    </p>
                  </div>
                </div>
                <ToggleButton 
                  isActive={theme === "dark"} 
                  onClick={toggleTheme}
                  label="Toggle dark mode"
                />
              </div>
            </motion.div>

            {/* Notifications Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <FaBell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Notificações
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                      Receber notificações sobre prazos e tarefas
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
              className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <FaSave className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Salvamento Automático
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                      Salvar as consultas automaticamente
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
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
                <select 
                  value={language} 
                  onChange={(e) => updateLanguage(e.target.value)}
                  className="bg-white/70 dark:bg-neutral-950 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all duration-300"
                  aria-label="Select language"
                >
                  <option value="pt">🇧🇷 Português</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 transition-colors duration-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
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
        </motion.div>
      </div>
    </div>
  );
};

export default Config;