import React from 'react';
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
import WhiteLogo from '../logos/white.png';

const defaultMenuItems = [
  { id: 'dashboard', text: 'Home', icon: <FaHome /> },
  { id: 'laboratory', text: 'Laboratório', icon: <FaFlask /> },
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
            <p className="text-xs text-neutral-400 whitespace-nowrap">
              IA Jurídico
            </p>
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

        {/* Security Panel - Only for admins */}
        {hasAdminAccess() && (
          <div
            className={`
              flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group
              ${activeItem === 'security' 
                ? 'bg-gradient-to-r from-accent1/20 to-accent1/20 text-accent1 shadow-lg border border-accent1/30' 
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (setActiveItem) setActiveItem('security');
              navigate('/');
            }}
          >
            <div className={`
              text-lg transition-all duration-300
              ${isOpen ? 'mr-4' : 'mx-auto'}
              ${activeItem === 'security' ? 'text-accent1' : 'group-hover:text-accent1'}
            `}>
              <FaLock />
            </div>
            <span
              style={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              className="whitespace-nowrap overflow-hidden font-medium transition-all duration-300"
            >
              Segurança
            </span>
          </div>
        )}

        {/* Admin Panel - Only for admins */}
        {hasAdminAccess() && (
          <div
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
          >
            <div className={`
              text-lg transition-all duration-300
              ${isOpen ? 'mr-4' : 'mx-auto'}
              ${activeItem === 'admin' ? 'text-blue-400' : 'group-hover:text-blue-400'}
            `}>
              <FaUserShield />
            </div>
            <span
              style={{ 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0
              }}
              className="whitespace-nowrap overflow-hidden font-medium transition-all duration-300"
            >
              Painel Admin
            </span>
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-neutral-700/50 space-y-3">
        {/* User Profile Button */}
        {currentUser && (
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
              className="overflow-hidden transition-all duration-300"
            >
              <p className="text-sm font-medium text-inherit whitespace-nowrap">
                {currentUser.name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-400 whitespace-nowrap">
                Ver Perfil
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
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
          <span
            style={{ 
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0
            }}
            className="whitespace-nowrap overflow-hidden font-medium transition-all duration-300"
          >
            Sair
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;