import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaChartBar, FaChartLine, FaFileExport, FaCalendarAlt } from "react-icons/fa";
import WhiteLogo from '../logos/white.png';
import BlackLogo from '../logos/black.png';
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
                alt="Clausy Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Relatórios e Analytics
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Análise detalhada do uso da plataforma
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaFileExport className="w-4 h-4 mr-2" />
                Exportar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-200 dark:border-neutral-700"
              >
                <FaCalendarAlt className="w-4 h-4 mr-2" />
                Período
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Quick Stats */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Consultas Hoje
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  124
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FaChartBar className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  45
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Taxa de Sucesso
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  98.5%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <FaChartBar className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Créditos Usados
                </p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  1,247
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <EnhancedReportsDashboard />
        </motion.div>
      </main>
    </div>
  );
};

export default Reports;
