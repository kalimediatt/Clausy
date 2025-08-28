import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaChartBar, FaChartLine, FaUsers, FaTrophy, FaCoins } from "react-icons/fa";
import EnhancedReportsDashboard from '../components/EnhancedReportsDashboard';

const Reports = () => {
  const [theme] = useState(localStorage.getItem("theme") || "light");

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-lg"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-50/30 to-transparent dark:via-neutral-800/30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                Relatórios e Analytics
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Veja onde sua equipe erra, quanto tempo já economizou e quais peças têm mais risco — tudo em um dashboard jurídico em tempo real.
              </p>
            </div>
            
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema Online</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Quick Stats */}
          <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Consultas Hoje
                  </p>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  124
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  vs 110 ontem
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaChartBar className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Usuários Ativos
                  </p>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  45
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  vs 42 ontem
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaUsers className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Taxa de Sucesso
                  </p>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  98.5%
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  vs 98.2% ontem
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaTrophy className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Créditos Usados
                  </p>
                </div>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  1,247
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  vs 1,312 ontem
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaCoins className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          {/* Dashboard Container with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-transparent to-indigo-50/30 dark:from-neutral-950/10 dark:via-transparent dark:to-neutral-950/10"></div>
            
            {/* Content */}
            <div className="relative p-6">
              <EnhancedReportsDashboard />
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
