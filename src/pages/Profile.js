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
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500
      bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      
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
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Meu Perfil
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Informações da conta e configurações
                </p>
              </div>
            </motion.div>


          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-8 px-6 pb-16 pt-12 lg:grid-cols-2">
        
        {/* Profile Info Card */}
        <section className="order-1">
          <motion.div
            className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-lg p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 transition-colors duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 text-center">
              {/* Avatar */}
              <div className="relative mx-auto mb-4 w-24 h-24">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent2 to-accent1 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-accent2/25">
                  {getInitials(getUserName())}
                </div>
                {/* Botão de adicionar foto - comentado temporariamente */}
                {/* <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg flex items-center justify-center text-orange-600 hover:text-orange-700 transition-colors duration-200 border-2 border-white dark:border-neutral-800"
                >
                  <FaCamera className="w-3 h-3" />
                </motion.button> */}
              </div>

              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {getUserName()}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {currentUser.email || 'Email não informado'}
              </p>
              
              {/* Role Badge */}
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-accent2 to-accent1 text-white text-xs font-medium shadow-lg shadow-accent2/25">
                <FaCrown className="w-3 h-3" />
                {getRoleDisplay(currentUser.role)}
              </div>
            </div>

            {/* Botão de editar perfil - comentado temporariamente */}
            {/* <button 
              onClick={handleEditProfile}
              className="w-full rounded-xl bg-gradient-to-br from-accent2 to-accent2 px-4 py-2.5 text-white shadow-lg hover:brightness-110 transition-all duration-300"
            >
              <FaEdit className="w-4 h-4 inline mr-2" />
              Editar Perfil
            </button> */}
          </motion.div>
        </section>

        {/* Profile Details */}
        <section className="order-2">
          <motion.div
            className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-lg p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 transition-colors duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Informações da Conta</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Detalhes do seu perfil e configurações
              </p>
            </div>

            <div className="space-y-4">
              {/* Personal Info */}
              <div className="rounded-xl border border-neutral-200 bg-white/40 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                <div className="flex items-center gap-3 mb-3">
                  <FaUser className="w-4 h-4 text-accent2" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Informações Pessoais</span>
                </div>
                <div className="space-y-2 text-sm">
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
              <div className="rounded-xl border border-neutral-200 bg-white/40 p-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                <div className="flex items-center gap-3 mb-3">
                  <FaBuilding className="w-4 h-4 text-accent2" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Empresa</span>
                </div>
                <div className="space-y-2 text-sm">
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
              <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:border-orange-700/50 dark:from-orange-900/20 dark:to-amber-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <FaCoins className="w-4 h-4 text-accent2" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Plano e Créditos</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Plano:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium">{currentUser?.plan_name || 'Plano não informado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Créditos:</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-accent2">{currentUser.credits || 0}</span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">disponíveis</p>
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