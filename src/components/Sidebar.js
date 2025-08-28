import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
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
  FaTimes,
  FaEllipsisV
} from 'react-icons/fa';
import WhiteLogo from '../logos/white.png';

const defaultMenuItems = [
  { id: 'dashboard', text: 'Home', icon: <FaHome /> },
  { id: 'laboratory', text: 'Central Jurídica', icon: <FaFlask /> },
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
  const { currentUser, logout, hasAdminAccess, usageStats } = useAuth();
  const items = Array.isArray(menuItems) && menuItems.length ? menuItems : defaultMenuItems;
  
  // Estado para controlar o menu dropdown do perfil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div
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
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen && setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-br from-accent1 to-accent1 hover:from-accent1/80 hover:to-accent1 border-none rounded-full flex items-center justify-center text-white cursor-pointer z-[9999] shadow-lg transition-all duration-300"
        aria-label="Alternar sidebar"
      >
        {isOpen ? <FaTimes className="w-3 h-3" /> : <FaBars className="w-3 h-3" />}
      </button>

      {/* Logo Section */}
      <div className={`${isOpen ? 'p-5' : 'p-5'} border-b border-neutral-700/50 transition-all duration-300`}>
        <div 
          className="flex items-center"
          style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
        >
          <div 
            className="rounded-xl bg-gradient-to-br from-accent1 to-accent1 flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ 
              width: isOpen ? '40px' : '32px',
              height: isOpen ? '40px' : '32px',
              padding: isOpen ? '8px' : '6px'
            }}
          >
            <img 
              src={WhiteLogo} 
              alt="Clausy Logo" 
              className="w-full h-full object-contain filter brightness-0 invert"
            />
          </div>
          
          <div
            style={{ 
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0,
              marginLeft: isOpen ? '12px' : 0
            }}
            className="overflow-hidden transition-all duration-300"
          >
            <h1 className="text-xl font-bold text-neutral-100 whitespace-nowrap">
              Clausy
            </h1>
           
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`
              flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
              ${activeItem === item.id 
                ? 'bg-gradient-to-r from-accent1/20 to-accent1/20 text-accent1 shadow-lg border border-accent1/30' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }
            `}
            onClick={(e) => handleItemClick(item, e)}
          >
            <div className={`
              text-lg transition-all duration-300
              ${isOpen ? 'mr-4' : 'mx-auto'}
              ${activeItem === item.id ? 'text-accent1' : 'group-hover:text-accent1'}
            `}>
              {item.icon}
            </div>
            <span
              style={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              className="whitespace-nowrap overflow-hidden font-medium transition-all duration-300"
            >
              {item.text}
            </span>
          </div>
        ))}




      </nav>

                      {/* User Info & Plan Usage */}
        <div className="p-4 border-t border-neutral-700/50 space-y-3">
          {/* Barra de Progresso do Uso do Plano */}
          {currentUser && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span 
                  className="text-xs font-medium text-neutral-400"
                  style={{ 
                    opacity: isOpen ? 1 : 0,
                    width: isOpen ? 'auto' : 0
                  }}
                >
                  Uso do Plano
                </span>
                <span 
                  className="text-xs font-bold text-neutral-200"
                  style={{ 
                    opacity: isOpen ? 1 : 0,
                    width: isOpen ? 'auto' : 0
                  }}
                >
                  {Math.min(
                    Math.max(
                      ((usageStats?.queries_today || 0) / (currentUser.max_queries_per_hour || 100)) * 100,
                      ((usageStats?.tokens_today || 0) / (currentUser.max_tokens_per_hour || 20000)) * 100
                    ), 
                    100
                  ).toFixed(1)}%
                </span>
              </div>
              <div 
                className="bg-neutral-700 rounded-full h-2 overflow-hidden"
                style={{ 
                  width: isOpen ? '100%' : '16px',
                  margin: isOpen ? '0' : '0 auto'
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(
                      Math.max(
                        ((usageStats?.queries_today || 0) / (currentUser.max_queries_per_hour || 100)) * 100,
                        ((usageStats?.tokens_today || 0) / (currentUser.max_tokens_per_hour || 20000)) * 100
                      ), 
                      100
                    )}%`
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-accent1 to-accent1 rounded-full"
                />
              </div>
              <div 
                className="text-xs text-neutral-400 text-center"
                style={{ 
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? 'auto' : 0
                }}
              >
                {currentUser.plan_id || 'Free Trial'}
              </div>
            </div>
          )}

          {/* User Profile Button */}
          {currentUser && (
            <div className="relative" ref={profileMenuRef}>
            <div
              className={`
                flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
                ${activeItem === 'profile' 
                  ? 'bg-gradient-to-r from-accent1/20 to-accent1/20 text-accent1 shadow-lg border border-accent1/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }
              `}
              onClick={(e) => handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e)}
            >
              <div 
                className="rounded-lg bg-gradient-to-br from-accent1 to-accent1 flex items-center justify-center text-white font-bold transition-all duration-300 flex-shrink-0"
                style={{ 
                  width: isOpen ? '32px' : '28px',
                  height: isOpen ? '32px' : '28px',
                  fontSize: isOpen ? '14px' : '12px',
                  marginRight: isOpen ? '12px' : (!isOpen ? 'auto' : 0),
                  marginLeft: isOpen ? 0 : 'auto'
                }}
              >
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div
                style={{ 
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? 'auto' : 0
                }}
                className="overflow-hidden transition-all duration-300 flex-1"
              >
                <p className="text-sm font-medium text-inherit whitespace-nowrap">
                  {currentUser.name || 'Usuário'}
                </p>
                <p className="text-xs text-neutral-400 whitespace-nowrap">
                  Ver Perfil
                </p>
              </div>
              
              {/* Botão de 3 pontinhos */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className={`
                  p-1 rounded-lg transition-all duration-300 hover:bg-neutral-700/50
                  ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                style={{ 
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? 'auto' : 0
                }}
              >
                <FaEllipsisV className="w-3 h-3 text-neutral-400 hover:text-neutral-200" />
              </button>
            </div>

            {/* Menu Dropdown */}
            {isProfileMenuOpen && isOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors duration-200 flex items-center space-x-3"
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Ver Perfil</span>
                  </button>
                  
                                     <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setIsProfileMenuOpen(false);
                       handleItemClick({ id: 'settings', text: 'Configurações', icon: <FaCog /> }, e);
                     }}
                     className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 transition-colors duration-200 flex items-center space-x-3"
                   >
                     <FaCog className="w-4 h-4" />
                     <span>Configurações</span>
                   </button>
                   
                   {/* Segurança - Apenas para admins */}
                   {hasAdminAccess() && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setIsProfileMenuOpen(false);
                         if (setActiveItem) setActiveItem('security');
                         navigate('/');
                       }}
                       className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-green-500/10 transition-colors duration-200 flex items-center space-x-3"
                     >
                       <FaLock className="w-4 h-4" />
                       <span>Segurança</span>
                     </button>
                   )}
                   
                   {/* Painel Admin - Apenas para admins */}
                   {hasAdminAccess() && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setIsProfileMenuOpen(false);
                         if (setActiveItem) setActiveItem('admin');
                         navigate('/admin');
                       }}
                       className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 transition-colors duration-200 flex items-center space-x-3"
                     >
                       <FaUserShield className="w-4 h-4" />
                       <span>Painel Admin</span>
                     </button>
                   )}
                   
                   <div className="border-t border-neutral-700 my-1"></div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-3"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;