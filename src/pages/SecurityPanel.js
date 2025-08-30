import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaFilter, FaDownload } from 'react-icons/fa';

// Estilos CSS para compatibilidade cross-browser dos selects
const securitySelectStyles = `
  .security-select {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23374151' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>") !important;
    background-repeat: no-repeat !important;
    background-position: right 0.7rem center !important;
    background-size: 0.65rem auto !important;
    padding-right: 2.5rem !important;
  }
  
  .security-select::-ms-expand {
    display: none;
  }
  
  .dark .security-select {
    background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23f9fafb' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>") !important;
  }
  
  .security-select:hover {
    border-color: #d1d5db !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
  }
  
  .dark .security-select:hover {
    border-color: #6b7280 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
  }
  
  .security-select:focus {
    border-color: #8C4B35 !important;
    box-shadow: 0 0 0 3px rgba(140, 75, 53, 0.1) !important;
    outline: none !important;
  }
  
  .security-select option {
    background-color: white;
    color: #374151;
    padding: 8px 12px;
  }
  
  .dark .security-select option {
    background-color: #1f2937;
    color: #f9fafb;
  }
  
  /* Fallback para navegadores mais antigos */
  @supports not (backdrop-filter: blur(4px)) {
    .security-select {
      background-color: white !important;
    }
    .dark .security-select {
      background-color: #1f2937 !important;
    }
  }
`;

// Injetar estilos CSS
const injectSecurityStyles = () => {
  // Verificar se já foi injetado para evitar duplicatas
  if (document.getElementById('security-select-styles')) return;
  
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.id = "security-select-styles";
  styleSheet.innerText = securitySelectStyles;
  document.head.appendChild(styleSheet);
};



export default function SecurityPanel({ 
  logs = [], 
  loading = false, 
  error = null, 
  filter = 'all', 
  setFilter, 
  page = 1, 
  setPage, 
  totalPages = 1, 
  totalItems = 0,
  debugData = [],
  todayStats = null,
  companyName = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [tempFilter, setTempFilter] = useState(filter);
  const [tempSearch, setTempSearch] = useState('');
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

  // Injetar estilos CSS para compatibilidade
  useEffect(() => {
    injectSecurityStyles();
  }, []);

  // Aplicar filtros quando mudar
  const handleApplyFilters = () => {
    setFilter(tempFilter);
    setSearchTerm(tempSearch);
    setPage(1); // Reset para primeira página
  };

  // Reset filtros
  const handleResetFilters = () => {
    setTempFilter('all');
    setTempSearch('');
    setFilter('all');
    setSearchTerm('');
    setPage(1);
  };

  // Calcular estatísticas dos logs
  const stats = React.useMemo(() => {
    console.log('DEBUG: Calculando estatísticas - logs:', logs?.length, 'todayStats:', todayStats);
    
    if (!logs || logs.length === 0) {
      return {
        totalLogs: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        successRate: 0,
        todayLogins: 0,
        todaySuccessfulLogins: 0,
        todayFailedLogins: 0
      };
    }

    const successfulLogins = logs.filter(log => {
      // Usar a mesma lógica de detecção de sucesso
      return log.success === 1 || log.success === true || log.status === 'success';
    }).length;
    
    const failedLogins = logs.filter(log => {
      // Usar a mesma lógica de detecção de falha
      return log.success === 0 || log.success === false || log.status === 'failed';
    }).length;
    
    const uniqueUsers = new Set(logs.map(log => log.username)).size;
    const successRate = logs.length > 0 ? ((successfulLogins / logs.length) * 100).toFixed(1) : 0;

    // Usar estatísticas do backend se disponíveis, senão calcular localmente
    // Calcular estatísticas de hoje
    let todayLogins = todayStats?.totalLogs || 0;
    let todaySuccessfulLogins = todayStats?.successfulLogins || 0;
    let todayFailedLogins = todayStats?.failedLogins || 0;
    
    // Se não temos estatísticas do backend, calcular localmente
    if (!todayStats || todayStats.totalLogs === 0) {
      console.log('DEBUG: Usando cálculo local de estatísticas do dia');
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfDay && logDate <= endOfDay;
      });
      
      todayLogins = todayLogs.length;
      todaySuccessfulLogins = todayLogs.filter(log => 
        log.success === 1 || log.success === true || log.status === 'success'
      ).length;
      todayFailedLogins = todayLogs.filter(log => 
        log.success === 0 || log.success === false || log.status === 'failed'
      ).length;
      
      console.log('DEBUG: Cálculo local - logs de hoje:', todayLogs.length);
    } else {
      console.log('DEBUG: Usando estatísticas do backend');
    }
    
    // Calcular estatísticas dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Início do dia
    
    const last7DaysLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= sevenDaysAgo;
    });
    
    const last7DaysLogins = last7DaysLogs.length;
    console.log('DEBUG: Cálculo local - logs dos últimos 7 dias:', last7DaysLogs.length);

    const finalStats = {
      totalLogs: logs.length,
      successfulLogins,
      failedLogins,
      uniqueUsers,
      successRate,
      todayLogins,
      todaySuccessfulLogins,
      todayFailedLogins,
      last7DaysLogins
    };
    
    console.log('DEBUG: Estatísticas finais:', finalStats);
    return finalStats;
  }, [logs, todayStats]);

  // Filtrar logs baseado no termo de busca e filtro
  const filteredLogs = React.useMemo(() => {
    let filtered = logs;
    
    // Aplicar filtro de status
    if (filter !== 'all') {
      filtered = filtered.filter(log => {
        // Verificar se é sucesso baseado no campo success ou status
        const isSuccess = log.success === 1 || log.success === true || log.status === 'success';
        return filter === 'success' ? isSuccess : !isSuccess;
      });
    }
    
    // Aplicar busca por usuário ou IP
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [logs, filter, searchTerm]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getInitials = (username) => {
    if (!username) return '?';
    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (log) => {
    const isSuccess = log.success === 1 || log.success === true || log.status === 'success';
    return isSuccess ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (log) => {
    const isSuccess = log.success === 1 || log.success === true || log.status === 'success';
    return isSuccess ? 'Sucesso' : 'Falha';
  };

  const handleExport = () => {
    const csvContent = [
      ['Usuário', 'IP', 'Status', 'Data/Hora'],
      ...filteredLogs.map(log => [
        log.username,
        log.ip_address,
        getStatusText(log),
        new Date(log.timestamp).toLocaleString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Gerar botões de paginação
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = isMobile ? 5 : 7; // Menos botões visíveis no mobile
    
    if (totalPages <= maxVisible) {
      // Mostrar todas as páginas se couberem
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] ${
              i === page 
                ? 'bg-gradient-to-r from-accent1 to-accent1 text-white border-accent1' 
                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
            } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setPage(i)}
          >
            {i}
          </motion.button>
        );
      }
    } else {
      // Lógica para páginas com ellipsis
      if (page <= 3) {
        // Mostrar primeiras páginas + ellipsis + última
        for (let i = 1; i <= 3; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-accent1 to-accent1 text-white border-accent1' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
              onClick={() => setPage(i)}
            >
              {i}
            </motion.button>
          );
        }
        buttons.push(<span key="ellipsis1" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        buttons.push(
          <motion.button
            key={totalPages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </motion.button>
        );
      } else if (page >= totalPages - 2) {
        // Mostrar primeira + ellipsis + últimas páginas
        buttons.push(
          <motion.button
            key={1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setPage(1)}
          >
            1
          </motion.button>
        );
        buttons.push(<span key="ellipsis2" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        for (let i = totalPages - 2; i <= totalPages; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-accent1 to-accent1 text-white border-accent1' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
              onClick={() => setPage(i)}
            >
              {i}
            </motion.button>
          );
        }
      } else {
        // Mostrar primeira + ellipsis + página atual + ellipsis + última
        buttons.push(
          <motion.button
            key={1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setPage(1)}
          >
            1
          </motion.button>
        );
        buttons.push(<span key="ellipsis3" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        for (let i = page - 1; i <= page + 1; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-accent1 to-accent1 text-white border-accent1' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
              onClick={() => setPage(i)}
            >
              {i}
            </motion.button>
          );
        }
        buttons.push(<span key="ellipsis4" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        buttons.push(
          <motion.button
            key={totalPages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </motion.button>
        );
      }
    }
    
    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="text-neutral-500 dark:text-neutral-400">
              Carregando logs de segurança...
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="text-red-500 dark:text-red-400">
          Erro ao carregar logs de segurança: {error}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'overflow-y-auto security-mobile-scroll' : ''}`}>
      <div className={`space-y-8 ${isMobile ? 'space-y-6 p-4' : ''}`}>
        


        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8
            ${isMobile ? 'grid-cols-2 gap-3 mb-6' : ''}`}
        >
          <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-blue-500
              ${isMobile ? 'p-4' : ''}`}
          >
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2
              ${isMobile ? 'text-xs' : ''}`}>
              Total de Logs
            </div>
            <div className={`font-bold text-neutral-900 dark:text-neutral-100 mb-1
              ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              {stats.last7DaysLogins}
            </div>
            <div className={`text-sm text-green-500 font-medium
              ${isMobile ? 'text-xs' : ''}`}>
              +{stats.todayLogins} hoje
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-green-500
              ${isMobile ? 'p-4' : ''}`}
          >
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2
              ${isMobile ? 'text-xs' : ''}`}>
              Logins Bem-sucedidos
            </div>
            <div className={`font-bold text-neutral-900 dark:text-neutral-100 mb-1
              ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              {stats.successfulLogins}
            </div>
            <div className={`text-sm text-green-500 font-medium
              ${isMobile ? 'text-xs' : ''}`}>
              +{stats.todaySuccessfulLogins} hoje
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-red-500
              ${isMobile ? 'p-4' : ''}`}
          >
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2
              ${isMobile ? 'text-xs' : ''}`}>
              Logins Falhados
            </div>
            <div className={`font-bold text-neutral-900 dark:text-neutral-100 mb-1
              ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              {stats.failedLogins}
            </div>
            <div className={`text-sm text-red-500 font-medium
              ${isMobile ? 'text-xs' : ''}`}>
              +{stats.todayFailedLogins} hoje
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-accent1
              ${isMobile ? 'p-4' : ''}`}
          >
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2
              ${isMobile ? 'text-xs' : ''}`}>
              Usuários {companyName || 'N/A'}
            </div>
            <div className={`font-bold text-neutral-900 dark:text-neutral-100 mb-1
              ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              {stats.uniqueUsers}
            </div>
            <div className={`text-sm text-green-500 font-medium
              ${isMobile ? 'text-xs' : ''}`}>
              Ativos no período
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-purple-500
              ${isMobile ? 'p-4 col-span-2' : ''}`}
          >
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2
              ${isMobile ? 'text-xs' : ''}`}>
              Taxa de Sucesso
            </div>
            <div className={`font-bold text-neutral-900 dark:text-neutral-100 mb-1
              ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              {stats.successRate}%
            </div>
            <div className={`text-sm text-purple-500 font-medium
              ${isMobile ? 'text-xs' : ''}`}>
              Geral
            </div>
          </motion.div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6
            ${isMobile ? 'p-4 mb-4' : ''}`}
        >
          <div className={`flex flex-wrap gap-4 items-end
            ${isMobile ? 'flex-col gap-3' : ''}`}>
            <div className={`flex flex-col ${isMobile ? 'w-full' : ''}`}>
              <label className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1
                ${isMobile ? 'text-xs' : ''}`}>
                Status
              </label>
              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className={`security-select px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent1 transition-all duration-300
                  ${isMobile ? 'w-full text-xs' : 'min-w-[120px]'}`}
              >
              <option value="all">Todos</option>
              <option value="success">Bem-sucedidos</option>
              <option value="failed">Falhados</option>
              </select>
            </div>
            
            <div className={`flex flex-col ${isMobile ? 'w-full' : ''}`}>
              <label className={`text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1
                ${isMobile ? 'text-xs' : ''}`}>
                Buscar
              </label>
              <input
              type="text"
              placeholder="Usuário ou IP..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
                className={`px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent1 transition-all duration-300
                  ${isMobile ? 'w-full text-xs' : 'min-w-[200px]'}`}
            />
            </div>

            <div className={`flex gap-2 ${isMobile ? 'w-full justify-between' : ''}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              onClick={handleApplyFilters}
                className={`flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300
                  ${isMobile ? 'px-3 py-2 text-xs flex-1' : ''}`}
            >
                <FaFilter className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
              {isMobile ? 'Aplicar' : 'Aplicar Filtros'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={handleResetFilters}
              className={`flex items-center px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300
                ${isMobile ? 'px-3 py-2 text-xs flex-1' : ''}`}
          >
            Limpar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className={`flex items-center px-4 py-2 text-white rounded-xl hover:shadow-lg transition-all duration-300
                ${isMobile ? 'px-3 py-2 text-xs flex-1' : ''}`}
              style={{ backgroundColor: '#E1663D' }}
            >
              <FaDownload className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
              {isMobile ? 'Exportar' : 'Exportar CSV'}
            </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabela de Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden
            ${isMobile ? 'rounded-xl' : ''}`}
        >
          <div className={`px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center
            ${isMobile ? 'px-4 py-3' : ''}`}>
            <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100
              ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Logs de Autenticação
            </h3>
            <div className={`text-neutral-500 dark:text-neutral-400
              ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {filteredLogs.length} registros encontrados
            </div>
          </div>

        {filteredLogs.length === 0 ? (
            <div className={`text-center py-20 ${isMobile ? 'py-12' : ''}`}>
              <FaShieldAlt className={`text-neutral-300 dark:text-neutral-600 mx-auto mb-4 opacity-50
                ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <h3 className={`font-medium text-neutral-500 dark:text-neutral-400 mb-2
                ${isMobile ? 'text-base' : 'text-lg'}`}>
                Nenhum log encontrado
              </h3>
              <p className={`text-neutral-400 dark:text-neutral-500
                ${isMobile ? 'text-xs' : ''}`}>
                Tente ajustar os filtros ou verificar se há dados disponíveis
              </p>
            </div>
        ) : (
          <>
              <div className={`overflow-x-auto ${isMobile ? 'overflow-x-scroll' : ''}`}>
                <table className={`w-full ${isMobile ? 'min-w-[600px]' : ''}`}>
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      <th className={`px-6 py-4 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider
                        ${isMobile ? 'px-4 py-3 text-xs' : 'px-6 py-4 text-xs'}`}>
                        Usuário
                      </th>
                      <th className={`px-6 py-4 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider
                        ${isMobile ? 'px-4 py-3 text-xs' : 'px-6 py-4 text-xs'}`}>
                        Endereço IP
                      </th>
                      <th className={`px-6 py-4 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider
                        ${isMobile ? 'px-4 py-3 text-xs' : 'px-6 py-4 text-xs'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-4 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider
                        ${isMobile ? 'px-4 py-3 text-xs' : 'px-6 py-4 text-xs'}`}>
                        Data/Hora
                      </th>
                      {showDetails && (
                        <th className={`px-6 py-4 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider
                          ${isMobile ? 'px-4 py-3 text-xs' : 'px-6 py-4 text-xs'}`}>
                          Detalhes
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredLogs.map((log, index) => {
                  const { date, time } = formatDate(log.timestamp);
                  const isSuccess = log.success === 1 || log.success === true || log.status === 'success';
                  return (
                        <motion.tr
                          key={log.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200"
                        >
                          <td className={`px-6 py-4 ${isMobile ? 'px-4 py-3' : ''}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`rounded-full flex items-center justify-center text-white font-semibold text-sm ${getStatusColor(log)}
                                ${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8'}`}>
                            {getInitials(log.username)}
                              </div>
                              <div>
                                <div className={`font-medium text-neutral-900 dark:text-neutral-100
                                  ${isMobile ? 'text-sm' : ''}`}>
                                  {log.username}
                                </div>
                                <div className={`text-neutral-500 dark:text-neutral-400
                                  ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  ID: {log.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${isMobile ? 'px-4 py-3' : ''}`}>
                            <div className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
                              <FaMapMarkerAlt className={`text-neutral-400 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                              <span className={`${isMobile ? 'text-xs' : ''}`}>{log.ip_address}</span>
                        </div>
                          </td>
                          <td className={`px-6 py-4 ${isMobile ? 'px-4 py-3' : ''}`}>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium uppercase tracking-wide ${
                              isSuccess 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            } ${isMobile ? 'text-xs px-2 py-0.5' : 'text-xs'}`}>
                              {isSuccess ? <FaCheckCircle className={`mr-1 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} /> : <FaTimesCircle className={`mr-1 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />}
                          {getStatusText(log)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${isMobile ? 'px-4 py-3' : ''}`}>
                            <div>
                              <div className={`font-medium text-neutral-900 dark:text-neutral-100
                                ${isMobile ? 'text-sm' : ''}`}>
                                {date}
                              </div>
                              <div className={`text-neutral-500 dark:text-neutral-400
                                ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {time}
                              </div>
                            </div>
                          </td>
                      {showDetails && (
                            <td className={`px-6 py-4 ${isMobile ? 'px-4 py-3' : ''}`}>
                              <div className={`text-neutral-500 dark:text-neutral-400 space-y-1
                                ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            <div>Success: {log.success ? 'Sim' : 'Não'}</div>
                            <div>Status: {log.status || 'N/A'}</div>
                            <div>ID: {log.id}</div>
                          </div>
                            </td>
                      )}
                        </motion.tr>
                  );
                })}
              </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className={`flex justify-between items-center px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50
                ${isMobile ? 'px-4 py-3 flex-col gap-3' : ''}`}>
                <div className={`text-neutral-500 dark:text-neutral-400
                  ${isMobile ? 'text-xs text-center' : 'text-sm'}`}>
                Mostrando {filteredLogs.length} de {totalItems} registros
                </div>
                <div className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                  {!isMobile && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                      className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    Anterior
                    </motion.button>
                  )}
                
                {renderPaginationButtons()}
                
                  {!isMobile && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                      className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    Próximo
                    </motion.button>
                  )}
                </div>
              </div>
          </>
        )}
        </motion.div>
      </div>
    </div>
  );
} 