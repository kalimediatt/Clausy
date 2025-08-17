import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaHome, 
  FaRobot, 
  FaFlask,
  FaLock, 
  FaUser, 
  FaCog, 
  FaChartBar,
  FaUserShield, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes
} from 'react-icons/fa';

const defaultMenuItems = [
  { id: 'dashboard', text: 'Home', icon: <FaHome /> },
  { id: 'ai', text: 'Inteligência Artificial', icon: <FaRobot /> },
  { id: 'laboratory', text: 'Laboratório', icon: <FaFlask /> },
  { id: 'security', text: 'Segurança', icon: <FaLock /> },
  { id: 'settings', text: 'Configurações', icon: <FaCog /> },
  { id: 'reports', text: 'Relatórios', icon: <FaChartBar /> },
];

const Sidebar = ({ 
  isOpen = true, 
  setIsOpen, 
  activeItem = 'dashboard', 
  setActiveItem, 
  menuItems,
  onItemClick 
}) => {
  const navigate = useNavigate();
  const { currentUser, logout, hasAdminAccess } = useAuth();
  const items = Array.isArray(menuItems) && menuItems.length ? menuItems : defaultMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const handleItemClick = (item, event) => {
    console.log('Sidebar: Item clicked:', item.id, 'Current activeItem:', activeItem);
    
    // Força o preventDefault para evitar comportamentos padrão
    event?.preventDefault?.();
    event?.stopPropagation?.();
    
    // Sempre atualiza o activeItem se a função foi passada
    if (setActiveItem && typeof setActiveItem === 'function') {
      console.log('Sidebar: Calling setActiveItem with:', item.id);
      setActiveItem(item.id);
    } else {
      console.log('Sidebar: setActiveItem not provided or not a function!', typeof setActiveItem);
    }
    
    // Se há um callback customizado, usa ele
    if (onItemClick && typeof onItemClick === 'function') {
      onItemClick(item);
      return;
    }
    
    // Se tem path definido, navega para a página
    if (item.path) {
      console.log('Sidebar: Navigating to:', item.path);
      navigate(item.path);
    }
  };

  return (
    <motion.div
      className={`
        ${isOpen ? 'w-64' : 'w-20'} 
        bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900
        backdrop-blur-lg
        transition-all duration-500 ease-in-out
        flex flex-col
        relative
        shadow-2xl
        border-r border-neutral-700/50
        min-h-screen
        z-50
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen && setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-none rounded-full flex items-center justify-center text-white cursor-pointer z-[9999] shadow-lg transition-all duration-300"
        aria-label="Alternar sidebar"
      >
        {isOpen ? <FaTimes className="w-3 h-3" /> : <FaBars className="w-3 h-3" />}
      </motion.button>

      {/* Logo Section */}
      <div className="p-6 border-b border-neutral-700/50">
        <motion.div 
          className="flex items-center space-x-3"
          animate={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
            C
          </div>
          <motion.div
            initial={false}
            animate={{ 
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <h1 className="text-xl font-bold text-neutral-100 whitespace-nowrap">
              Clausy
            </h1>
            <p className="text-xs text-neutral-400 whitespace-nowrap">
              IA Jurídico
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
              ${activeItem === item.id 
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg border border-amber-500/30' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }
            `}
            onClick={(e) => handleItemClick(item, e)}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`
              text-lg transition-all duration-300
              ${isOpen ? 'mr-4' : 'mx-auto'}
              ${activeItem === item.id ? 'text-amber-400' : 'group-hover:text-amber-400'}
            `}>
              {item.icon}
            </div>
            <motion.span
              initial={false}
              animate={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
              className="whitespace-nowrap overflow-hidden font-medium"
            >
              {item.text}
            </motion.span>
          </motion.div>
        ))}

        {/* Admin Panel - Only for admins */}
        {hasAdminAccess() && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: items.length * 0.05 }}
            className={`
              flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
              ${activeItem === 'admin' 
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 shadow-lg border border-blue-500/30' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (setActiveItem) setActiveItem('admin');
              navigate('/admin');
            }}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`
              text-lg transition-all duration-300
              ${isOpen ? 'mr-4' : 'mx-auto'}
              ${activeItem === 'admin' ? 'text-blue-400' : 'group-hover:text-blue-400'}
            `}>
              <FaUserShield />
            </div>
            <motion.span
              initial={false}
              animate={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
              className="whitespace-nowrap overflow-hidden font-medium"
            >
              Painel Admin
            </motion.span>
          </motion.div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-neutral-700/50 space-y-3">
        {/* User Profile Button */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`
              flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
              ${activeItem === 'profile' 
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg border border-amber-500/30' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }
            `}
            onClick={(e) => handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e)}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`
              w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold transition-all duration-300
              ${isOpen ? 'mr-3' : 'mx-auto'}
              ${activeItem === 'profile' ? 'text-amber-400' : 'group-hover:text-amber-400'}
            `}>
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <motion.div
              initial={false}
              animate={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-medium text-inherit whitespace-nowrap">
                {currentUser.name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-400 whitespace-nowrap">
                Ver Perfil
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full flex items-center p-3 rounded-xl transition-all duration-300 group
            text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30
          `}
        >
          <div className={`
            text-lg transition-all duration-300
            ${isOpen ? 'mr-4' : 'mx-auto'}
            group-hover:text-red-300
          `}>
            <FaSignOutAlt />
          </div>
          <motion.span
            initial={false}
            animate={{ 
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0
            }}
            transition={{ duration: 0.3 }}
            className="whitespace-nowrap overflow-hidden font-medium"
          >
            Sair
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;