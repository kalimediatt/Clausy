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

// Hook para detectar mobile e tablet
const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState('desktop');
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width >= 768 && width <= 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return deviceType;
};

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
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  // Estado para controlar o menu dropdown do perfil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom');
  const [menuHorizontalPosition, setMenuHorizontalPosition] = useState('center');
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

  const calculateMenuPosition = () => {
    if (!profileMenuRef.current) return { placement: 'right-start', offset: 8 };
    
    const rect = profileMenuRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const menuHeight = 320; // Altura aproximada do menu
    const menuWidth = 192; // Largura do menu (w-48 = 12rem = 192px)
    
    // Para tablet, calcular posicionamento inteligente
    if (isTablet) {
      // Verificar espaço disponível
      const spaceRight = windowWidth - rect.right;
      const spaceLeft = rect.left;
      const spaceAbove = rect.top;
      const spaceBelow = windowHeight - rect.bottom;
      
      // Determinar melhor posicionamento
      if (spaceRight >= menuWidth + 8) {
        // Cabe à direita
        if (spaceBelow >= menuHeight) {
          return { placement: 'right-start', offset: 8 };
        } else if (spaceAbove >= menuHeight) {
          return { placement: 'right-end', offset: 8 };
        } else {
          return { placement: 'right', offset: 8 };
        }
      } else if (spaceLeft >= menuWidth + 8) {
        // Cabe à esquerda
        if (spaceBelow >= menuHeight) {
          return { placement: 'left-start', offset: 8 };
        } else if (spaceAbove >= menuHeight) {
          return { placement: 'left-end', offset: 8 };
        } else {
          return { placement: 'left', offset: 8 };
        }
      } else {
        // Não cabe horizontalmente, usar vertical
        if (spaceBelow >= menuHeight) {
          return { placement: 'bottom-start', offset: 8 };
        } else {
          return { placement: 'top-start', offset: 8 };
        }
      }
    }
    
    // Para desktop, manter lógica original
    const spaceBelow = windowHeight - rect.top;
    const spaceAbove = rect.top;
    
    if (spaceBelow >= menuHeight || spaceBelow > spaceAbove) {
      return { placement: 'top-start', offset: 8 };
    } else {
      return { placement: 'bottom-start', offset: 8 };
    }
  };

  // Versão Desktop e Tablet - Sidebar Lateral
  if (!isMobile) {
    return (
      <div
        className={`
          ${isTablet ? 'w-24' : (isOpen ? 'w-64' : 'w-20')} 
          bg-[#3c1c54]
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
        {/* Toggle Button - Não aparece no tablet */}
        {!isTablet && (
          <button
            onClick={() => setIsOpen && setIsOpen(!isOpen)}
            className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-br from-accent1 to-accent1 hover:from-accent1/80 hover:to-accent1 border-none rounded-full flex items-center justify-center text-white cursor-pointer z-[9999] shadow-lg transition-all duration-300"
            aria-label="Alternar sidebar"
          >
            {isOpen ? <FaTimes className="w-3 h-3" /> : <FaBars className="w-3 h-3" />}
          </button>
        )}

        {/* Logo Section */}
        <div className={`${isTablet ? 'p-6' : (isOpen ? 'p-6' : 'p-5')} border-b border-neutral-700/50 transition-all duration-300`}>
                      <div 
              className="flex items-center"
              style={{ justifyContent: isTablet ? 'center' : (isOpen ? 'flex-start' : 'center') }}
            >
            <div 
              className="rounded-xl bg-gradient-to-br from-accent1 to-accent1 flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ 
                width: isTablet ? '36px' : (isOpen ? '40px' : '32px'),
                height: isTablet ? '36px' : (isOpen ? '40px' : '32px'),
                padding: isTablet ? '8px' : (isOpen ? '8px' : '6px')
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
                opacity: isTablet ? 0 : (isOpen ? 1 : 0),
                width: isTablet ? 0 : (isOpen ? 'auto' : 0),
                marginLeft: isTablet ? 0 : (isOpen ? '12px' : 0)
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
        <nav className={`flex-1 ${isTablet ? 'p-4' : 'p-4'} space-y-2`}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`
                flex items-center ${isTablet ? 'p-3' : 'p-3'} rounded-xl cursor-pointer transition-all duration-300 group
                ${activeItem === item.id 
                  ? 'bg-gradient-to-r from-accent1/20 to-accent1/20 text-accent1 shadow-lg border border-accent1/30' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }
              `}
              onClick={(e) => handleItemClick(item, e)}
            >
              <div className={`
                text-lg transition-all duration-300
                ${isTablet ? 'mx-auto' : (isOpen ? 'mr-4' : 'mx-auto')}
                ${activeItem === item.id ? 'text-accent1' : 'group-hover:text-accent1'}
              `}>
                {item.icon}
              </div>
              <span
                style={{ 
                  opacity: isTablet ? 0 : (isOpen ? 1 : 0),
                  width: isTablet ? 0 : (isOpen ? 'auto' : 0)
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
          {/* Barra de Progresso do Uso do Plano - Não aparece no tablet */}
          {currentUser && !isTablet && (
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
              
              {/* Botão de Upgrade - Aparece quando atinge 80% */}
              {(() => {
                const usagePercentage = Math.min(
                  Math.max(
                    ((usageStats?.queries_today || 0) / (currentUser.max_queries_per_hour || 100)) * 100,
                    ((usageStats?.tokens_today || 0) / (currentUser.max_tokens_per_hour || 20000)) * 100
                  ), 
                  100
                );
                
                return usagePercentage >= 80 ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    onClick={() => {
                      // Aqui você pode adicionar a lógica para abrir modal de upgrade
                      console.log('Upgrade button clicked');
                    }}
                    style={{ 
                      opacity: isOpen ? 1 : 0,
                      width: isOpen ? 'auto' : 0,
                      pointerEvents: isOpen ? 'auto' : 'none'
                    }}
                  >
                    {isOpen ? '🔄 Upgrade Plano' : '🔄'}
                  </motion.button>
                ) : null;
              })()}
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
                  ${isLongPressing ? 'scale-110 bg-accent1/20 border border-accent1/50' : ''}
                `}
                onClick={(e) => {
                  // Só executa se não foi um long press
                  if (!isProfileMenuOpen) {
                    handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e);
                  }
                }}
                onTouchStart={(e) => {
                  if (isTablet) {
                    e.preventDefault();
                    console.log('Tablet touch start detected');
                    
                    // Long press timer
                    const timer = setTimeout(() => {
                      console.log('Tablet long press triggered - Menu should open');
                      // Calcular posicionamento inteligente
                      const position = calculateMenuPosition();
                      setMenuPosition(position.placement.split('-')[0]);
                      setMenuHorizontalPosition(position.placement.split('-')[1] || 'start');
                      setIsProfileMenuOpen(true);
                      setIsLongPressing(false);
                      console.log('Tablet menu position:', position);
                    }, 800);
                    
                    // Store timer reference
                    e.currentTarget._longPressTimer = timer;
                    
                    // Feedback visual após 400ms
                    setTimeout(() => {
                      setIsLongPressing(true);
                    }, 400);
                  }
                }}
                onTouchEnd={(e) => {
                  if (isTablet) {
                    console.log('Tablet touch end detected');
                    // Clear timer if touch ends before long press
                    if (e.currentTarget._longPressTimer) {
                      clearTimeout(e.currentTarget._longPressTimer);
                      e.currentTarget._longPressTimer = null;
                    }
                    setIsLongPressing(false);
                  }
                }}
                onTouchMove={(e) => {
                  if (isTablet) {
                    // Cancel long press if finger moves
                    if (e.currentTarget._longPressTimer) {
                      clearTimeout(e.currentTarget._longPressTimer);
                      e.currentTarget._longPressTimer = null;
                    }
                    setIsLongPressing(false);
                  }
                }}
                onMouseDown={(e) => {
                  if (isTablet) {
                    // Para testar no desktop também
                    console.log('Tablet mouse down detected');
                    
                    const timer = setTimeout(() => {
                      console.log('Tablet mouse long press triggered');
                      // Para tablet, usar posicionamento fixo
                      setMenuPosition('top');
                      setMenuHorizontalPosition('left');
                      setIsProfileMenuOpen(true);
                      setIsLongPressing(false);
                    }, 800);
                    
                    e.currentTarget._mouseLongPressTimer = timer;
                    
                    setTimeout(() => {
                      setIsLongPressing(true);
                    }, 400);
                  }
                }}
                onMouseUp={(e) => {
                  if (isTablet) {
                    if (e.currentTarget._mouseLongPressTimer) {
                      clearTimeout(e.currentTarget._mouseLongPressTimer);
                      e.currentTarget._mouseLongPressTimer = null;
                    }
                    setIsLongPressing(false);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isTablet) {
                    if (e.currentTarget._mouseLongPressTimer) {
                      clearTimeout(e.currentTarget._mouseLongPressTimer);
                      e.currentTarget._mouseLongPressTimer = null;
                    }
                    setIsLongPressing(false);
                  }
                }}
              >
                {isTablet ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="text-lg relative">
                      <FaUser />
                      {/* Indicador de long press */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent1 rounded-full opacity-60"></div>
                    </div>
                  </div>
                ) : (
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
                )}
                {!isTablet && (
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
                )}
                
                {/* Botão de 3 pontinhos - Não aparece no tablet */}
                {!isTablet && (
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
                )}
              </div>

              {/* Menu Dropdown */}
              {console.log('Rendering menu dropdown:', { isProfileMenuOpen, isOpen, isTablet })}
              {isProfileMenuOpen && (
                <div 
                  className={`absolute w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 ${
                    isTablet 
                      ? `${menuPosition}-${menuHorizontalPosition}` 
                      : 'bottom-full left-0'
                  }`}
                  style={{
                    // Posicionamento baseado no placement calculado
                    top: isTablet && menuPosition === 'top' ? 'auto' : 
                         isTablet && menuPosition === 'bottom' ? '100%' : 
                         isTablet ? '0px' : 'auto',
                    bottom: isTablet && menuPosition === 'bottom' ? 'auto' : 
                           isTablet && menuPosition === 'top' ? '100%' : 
                           isTablet ? 'auto' : '100%',
                    left: isTablet && menuPosition === 'left' ? 'auto' : 
                          isTablet && menuPosition === 'right' ? '100%' : 
                          isTablet ? '100%' : '0px',
                    right: isTablet && menuPosition === 'right' ? 'auto' : 
                           isTablet && menuPosition === 'left' ? '100%' : 
                           isTablet ? 'auto' : 'auto',
                    marginLeft: isTablet && menuPosition === 'right' ? '8px' : '0px',
                    marginRight: isTablet && menuPosition === 'left' ? '8px' : '0px',
                    marginTop: isTablet && menuPosition === 'bottom' ? '8px' : '0px',
                    marginBottom: isTablet && menuPosition === 'top' ? '8px' : '0px',
                    // Fallback para diferentes posições se não couber
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    // Garantir que não saia da viewport
                    zIndex: 9999,
                  }}
                >
                  {/* Botão de fechar para tablet */}
                  {isTablet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileMenuOpen(false);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-lg hover:bg-neutral-700 transition-colors duration-200"
                    >
                      <FaTimes className="w-3 h-3 text-neutral-400 hover:text-neutral-200" />
                    </button>
                  )}
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
                        className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700 transition-colors duration-200 flex items-center space-x-3"
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
  }

  // Versão Mobile - Bottom Navigation
  return (
    <div
      className="
        fixed bottom-0 left-0 right-0
        bg-neutral-900
        backdrop-blur-lg
        border-t border-neutral-700/50
        shadow-2xl
        z-50
        px-2 py-2
      "
    >
      {/* Menu Items - Bottom Navigation */}
      <nav className="flex justify-around items-center">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-300
              ${activeItem === item.id 
                ? 'text-accent1' 
                : 'text-neutral-400 hover:text-neutral-200'
              }
            `}
            onClick={(e) => handleItemClick(item, e)}
          >
            <div className="text-lg mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">
              {item.text}
            </span>
          </div>
        ))}
        
        {/* Botão de Upgrade Mobile - Aparece quando atinge 80% */}
        {currentUser && (() => {
          const usagePercentage = Math.min(
            Math.max(
              ((usageStats?.queries_today || 0) / (currentUser.max_queries_per_hour || 100)) * 100,
              ((usageStats?.tokens_today || 0) / (currentUser.max_tokens_per_hour || 20000)) * 100
            ), 
            100
          );
          
          return usagePercentage >= 80 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-300"
              onClick={() => {
                // Aqui você pode adicionar a lógica para abrir modal de upgrade
                console.log('Mobile upgrade button clicked');
              }}
            >
              <div className="text-lg mb-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                🔄
              </div>
              <span className="text-xs font-medium text-amber-400">
                Upgrade
              </span>
            </motion.div>
          ) : null;
        })()}
        
        {/* Profile Button */}
        {currentUser && (
          <div className="relative" ref={profileMenuRef}>
            <div
              className={`
                flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-300
                ${activeItem === 'profile' 
                  ? 'text-accent1' 
                  : 'text-neutral-400 hover:text-neutral-200'
                }
                ${isLongPressing ? 'scale-110 bg-accent1/20 border border-accent1/50' : ''}
              `}
              onClick={(e) => {
                // Só executa se não foi um long press
                if (!isProfileMenuOpen) {
                  handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                console.log('Touch start detected');
                
                // Long press timer
                const timer = setTimeout(() => {
                  console.log('Long press triggered');
                  const position = calculateMenuPosition();
                  setMenuPosition(position.vertical);
                  setMenuHorizontalPosition(position.horizontal);
                  setIsProfileMenuOpen(true);
                  setIsLongPressing(false);
                }, 800); // 800ms para ser mais fácil de testar
                
                // Store timer reference
                e.currentTarget._longPressTimer = timer;
                
                // Feedback visual após 400ms
                setTimeout(() => {
                  setIsLongPressing(true);
                }, 400);
              }}
              onTouchEnd={(e) => {
                console.log('Touch end detected');
                // Clear timer if touch ends before long press
                if (e.currentTarget._longPressTimer) {
                  clearTimeout(e.currentTarget._longPressTimer);
                  e.currentTarget._longPressTimer = null;
                }
                setIsLongPressing(false);
              }}
              onTouchMove={(e) => {
                // Cancel long press if finger moves
                if (e.currentTarget._longPressTimer) {
                  clearTimeout(e.currentTarget._longPressTimer);
                  e.currentTarget._longPressTimer = null;
                }
                setIsLongPressing(false);
              }}
              onMouseDown={(e) => {
                // Para testar no desktop também
                console.log('Mouse down detected');
                
                const timer = setTimeout(() => {
                  console.log('Mouse long press triggered');
                  const position = calculateMenuPosition();
                  setMenuPosition(position.vertical);
                  setMenuHorizontalPosition(position.horizontal);
                  setIsProfileMenuOpen(true);
                  setIsLongPressing(false);
                }, 800);
                
                e.currentTarget._mouseLongPressTimer = timer;
                
                setTimeout(() => {
                  setIsLongPressing(true);
                }, 400);
              }}
              onMouseUp={(e) => {
                if (e.currentTarget._mouseLongPressTimer) {
                  clearTimeout(e.currentTarget._mouseLongPressTimer);
                  e.currentTarget._mouseLongPressTimer = null;
                }
                setIsLongPressing(false);
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget._mouseLongPressTimer) {
                  clearTimeout(e.currentTarget._mouseLongPressTimer);
                  e.currentTarget._mouseLongPressTimer = null;
                }
                setIsLongPressing(false);
              }}
            >
              <div className="text-lg mb-1 relative">
                <FaUser />
                {/* Indicador de long press */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent1 rounded-full opacity-60"></div>
              </div>
              <span className="text-xs font-medium">
                Perfil
              </span>
            </div>


            
            {/* Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className={`
                fixed bottom-[100%] left-1/2 transform -translate-x-1/2 bg-neutral-800 border border-neutral-600 rounded-2xl shadow-lg z-[9999]
                ${window.innerWidth < 320 ? 'w-64' : 'w-72'}
                max-h-[80vh] overflow-y-auto
              `}>

                

                
                {/* Header do Menu */}
                                   <div className="px-5 py-4 border-b border-neutral-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent1 via-accent1 to-accent1/80 flex items-center justify-center shadow-lg ring-2 ring-accent1/20">
                      <span className="text-white text-lg font-bold">
                        {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-neutral-100">
                        {currentUser.name || 'Usuário'}
                      </p>
                      <p className="text-sm text-neutral-400 mt-1">
                        {currentUser.email || 'usuario@exemplo.com'}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-xs text-green-400 font-medium">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      handleItemClick({ id: 'profile', text: 'Perfil', icon: <FaUser /> }, e);
                    }}
                    className="w-full px-5 py-4 text-left text-sm text-neutral-200 hover:bg-neutral-700 transition-all duration-200 flex items-center space-x-4 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center group-hover:bg-accent1/20 transition-colors duration-200">
                      <FaUser className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium">Ver Perfil</span>
                      <p className="text-xs text-neutral-500 mt-1">Gerenciar conta</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      handleItemClick({ id: 'settings', text: 'Configurações', icon: <FaCog /> }, e);
                    }}
                    className="w-full px-5 py-4 text-left text-sm text-neutral-200 hover:bg-neutral-700 transition-all duration-200 flex items-center space-x-4 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center group-hover:bg-accent1/20 transition-colors duration-200">
                      <FaCog className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium">Configurações</span>
                      <p className="text-xs text-neutral-500 mt-1">Preferências</p>
                    </div>
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
                      className="w-full px-5 py-4 text-left text-sm text-green-400 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-transparent transition-all duration-200 flex items-center space-x-4 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-200">
                        <FaLock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium">Segurança</span>
                        <p className="text-xs text-green-400/70 mt-1">Configurações de segurança</p>
                      </div>
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
                      className="w-full px-5 py-4 text-left text-sm text-neutral-200 hover:bg-gradient-to-r hover:from-neutral-700 hover:to-transparent transition-all duration-200 flex items-center space-x-4 group"
                    >
                                              <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center group-hover:bg-neutral-600 transition-colors duration-200">
                        <FaUserShield className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium">Painel Admin</span>
                        <p className="text-xs text-neutral-500 mt-1">Administração</p>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-neutral-700/50 my-3 mx-5"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-5 py-4 text-left text-sm text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent transition-all duration-200 flex items-center space-x-4 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors duration-200">
                      <FaSignOutAlt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium">Sair</span>
                      <p className="text-xs text-red-400/70 mt-1">Fazer logout</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;