import React, { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaBuilding, FaCrown, FaCoins } from "react-icons/fa";

import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { 
    currentUser, 
    isAuthenticated,
    isLoading,
    checkAuth,
    getDashboardStats,
    getUserTasks,
    getTeamMembers,
    getQueryDistribution,
    getCurrentPlanData
  } = useAuth();

  // Estado local
  const [theme] = useState(localStorage.getItem("theme") || "light");
  const [isMobile, setIsMobile] = useState(false);

  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Efeito para verificar autenticação na montagem se necessário
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('current_user');
    
    // Se há token mas não está autenticado ou não há dados do usuário, verificar
    if (token && (!isAuthenticated || !currentUser) && !isLoading) {
      if (checkAuth) {
        checkAuth();
      }
    }
  }, []); // Executa apenas na montagem

  // Função para obter o nome do usuário exatamente como no samples.js
  const getUserName = () => {
    return currentUser?.name || 'Nome não informado';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = (role) => {
    const roles = {
      'admin': 'Administrador',
      'superadmin': 'Super Administrador',
      'user': 'Usuário'
    };
    return roles[role] || 'Usuário';
  };



  // Loading - apenas quando realmente carregando
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500
        bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">Carregando...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Não autenticado - redirecionar para login
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500
        bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-neutral-600 dark:text-neutral-400">Você precisa estar logado para ver esta página.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Se não há dados do usuário (fallback de segurança)
  if (!currentUser) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500
        bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">Carregando dados do usuário...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  console.log('✅ Profile - TODOS os dados do currentUser:', currentUser);
  console.log('✅ Profile - Campos específicos:', {
    id: currentUser?.user_id,
    name: currentUser?.name,
    email: currentUser?.email,
    company_id: currentUser?.company_id,
    company_name: currentUser?.company_name,
    plan_id: currentUser?.plan_id,
    plan_name: currentUser?.plan_name,
    credits: currentUser?.credits,
    role: currentUser?.role
  });

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-500
      bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950
      ${isMobile ? 'overflow-y-auto profile-mobile-scroll' : 'overflow-hidden'}`}>
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800
          ${isMobile ? 'profile-header-mobile' : ''}`}
      >
        <div className={`max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div>
                <h1 className={`text-2xl font-bold text-neutral-900 dark:text-neutral-100
                  ${isMobile ? 'profile-title-header-mobile text-lg' : ''}`}>
                  Meu Perfil
                </h1>
                <p className={`text-sm text-neutral-600 dark:text-neutral-400
                  ${isMobile ? 'profile-subtitle-header-mobile text-xs' : ''}`}>
                  Informações da conta e configurações
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className={`relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-8 px-6 pb-16 pt-12 lg:grid-cols-2
        ${isMobile ? 'min-h-auto profile-main-mobile gap-6 px-4 pb-8 pt-8' : 'min-h-screen'}`}>
        
        {/* Profile Info Card */}
        <section className="order-1">
          <motion.div
            className={`mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-lg p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 transition-colors duration-500
              ${isMobile ? 'profile-card-mobile p-4' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`${isMobile ? 'mb-4' : 'mb-6'} text-center`}>
              {/* Avatar */}
              <div className={`relative mx-auto mb-4 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'}`}>
                <div className={`${isMobile ? 'w-16 h-16 text-lg' : 'w-24 h-24 text-2xl'} rounded-2xl bg-gradient-to-br from-accent2 to-accent1 flex items-center justify-center font-bold text-white shadow-lg shadow-accent2/25`}>
                  {getInitials(getUserName())}
                </div>
              </div>

              <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-semibold text-neutral-900 dark:text-neutral-100`}>
                {getUserName()}
              </h3>
              <p className={`mt-1 text-sm text-neutral-600 dark:text-neutral-400
                ${isMobile ? 'profile-info-mobile text-xs' : ''}`}>
                {currentUser.email || 'Email não informado'}
              </p>
              
              {/* Role Badge */}
              <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-accent2 to-accent1 text-white text-xs font-medium shadow-lg shadow-accent2/25
                ${isMobile ? 'px-2 py-0.5 text-xs' : ''}`}>
                <FaCrown className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                {getRoleDisplay(currentUser.role)}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Profile Details */}
        <section className="order-2">
          <motion.div
            className={`mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-lg p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 transition-colors duration-500
              ${isMobile ? 'profile-card-mobile p-4' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-neutral-900 dark:text-neutral-100`}>Informações da Conta</h3>
              <p className={`mt-1 text-sm text-neutral-600 dark:text-neutral-400
                ${isMobile ? 'profile-info-mobile text-xs' : ''}`}>
                Detalhes do seu perfil e configurações
              </p>
            </div>

            <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              {/* Personal Info */}
              <div className={`rounded-xl border border-neutral-200 bg-white/40 p-4 dark:border-neutral-700 dark:bg-neutral-800/40
                ${isMobile ? 'p-3' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <FaUser className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-accent2`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-neutral-700 dark:text-neutral-300`}>Informações Pessoais</span>
                </div>
                <div className={`${isMobile ? 'space-y-1.5 text-xs' : 'space-y-2 text-sm'}`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Nome:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{getUserName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Email:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{currentUser.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className={`rounded-xl border border-neutral-200 bg-white/40 p-4 dark:border-neutral-700 dark:bg-neutral-800/40
                ${isMobile ? 'p-3' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <FaBuilding className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-accent2`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-neutral-700 dark:text-neutral-300`}>Empresa</span>
                </div>
                <div className={`${isMobile ? 'space-y-1.5 text-xs' : 'space-y-2 text-sm'}`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Empresa:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{currentUser?.company_name || 'Empresa não informada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">ID:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-mono text-xs">#{currentUser.user_id || currentUser.id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Plan & Credits */}
              <div className={`rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:border-orange-700/50 dark:from-orange-900/20 dark:to-amber-900/20
                ${isMobile ? 'p-3' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <FaCoins className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-accent2`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-neutral-700 dark:text-neutral-300`}>Plano e Créditos</span>
                </div>
                <div className={`${isMobile ? 'space-y-1.5 text-xs' : 'space-y-2 text-sm'}`}>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Plano:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium">{currentUser?.plan_name || 'Plano não informado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Créditos:</span>
                    <div className="text-right">
                      <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-accent2`}>{currentUser.credits || 0}</span>
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-neutral-500 dark:text-neutral-400`}>disponíveis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
};

export default Profile;