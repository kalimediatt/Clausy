import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaFilter, FaDownload } from 'react-icons/fa';



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
  debugData = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [tempFilter, setTempFilter] = useState(filter);
  const [tempSearch, setTempSearch] = useState('');

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
    if (!logs || logs.length === 0) {
      return {
        totalLogs: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        successRate: 0
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

    return {
      totalLogs: logs.length,
      successfulLogins,
      failedLogins,
      uniqueUsers,
      successRate
    };
  }, [logs]);

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
    const maxVisible = 7; // Máximo de botões visíveis
    
    if (totalPages <= maxVisible) {
      // Mostrar todas as páginas se couberem
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] ${
              i === page 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500' 
                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
            onClick={() => setPage(i)}
          >
            {i}
          </motion.button>
        );
      }
    } else {
      // Lógica para páginas com ellipsis
      if (page <= 4) {
        // Mostrar primeiras páginas + ellipsis + última
        for (let i = 1; i <= 5; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
              onClick={() => setPage(i)}
            >
              {i}
            </motion.button>
          );
        }
        buttons.push(<span key="ellipsis1" className="px-3 py-2 text-neutral-500 dark:text-neutral-400">...</span>);
        buttons.push(
          <motion.button
            key={totalPages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700"
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </motion.button>
        );
      } else if (page >= totalPages - 3) {
        // Mostrar primeira + ellipsis + últimas páginas
        buttons.push(
          <motion.button
            key={1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700"
            onClick={() => setPage(1)}
          >
            1
          </motion.button>
        );
        buttons.push(<span key="ellipsis2" className="px-3 py-2 text-neutral-500 dark:text-neutral-400">...</span>);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
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
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700"
            onClick={() => setPage(1)}
          >
            1
          </motion.button>
        );
        buttons.push(<span key="ellipsis3" className="px-3 py-2 text-neutral-500 dark:text-neutral-400">...</span>);
        for (let i = page - 1; i <= page + 1; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === page 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
              onClick={() => setPage(i)}
            >
              {i}
            </motion.button>
          );
        }
        buttons.push(<span key="ellipsis4" className="px-3 py-2 text-neutral-500 dark:text-neutral-400">...</span>);
        buttons.push(
          <motion.button
            key={totalPages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700"
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
    <div>
      <div className="space-y-8">
        


        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-blue-500"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2">
              Total de Logs
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {stats.totalLogs}
            </div>
            <div className="text-sm text-green-500 font-medium">
              +{stats.totalLogs} hoje
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-green-500"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2">
              Logins Bem-sucedidos
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {stats.successfulLogins}
            </div>
            <div className="text-sm text-green-500 font-medium">
              {stats.successRate}% taxa de sucesso
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-red-500"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2">
              Logins Falhados
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {stats.failedLogins}
            </div>
            <div className="text-sm text-red-500 font-medium">
              {(100 - stats.successRate).toFixed(1)}% taxa de falha
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 border-l-4 border-l-amber-500"
          >
            <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-2">
              Usuários Únicos
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {stats.uniqueUsers}
            </div>
            <div className="text-sm text-green-500 font-medium">
              Ativos no período
            </div>
          </motion.div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Status
              </label>
              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm min-w-[120px] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
              >
              <option value="all">Todos</option>
              <option value="success">Bem-sucedidos</option>
              <option value="failed">Falhados</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Buscar
              </label>
              <input
              type="text"
              placeholder="Usuário ou IP..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
                className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300"
            />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={handleApplyFilters}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
              <FaFilter className="w-4 h-4 mr-2" />
            Aplicar Filtros
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            onClick={handleResetFilters}
              className="flex items-center px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-300"
          >
            Limpar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <FaDownload className="w-4 h-4 mr-2" />
            Exportar CSV
            </motion.button>
          </div>
        </motion.div>

        {/* Tabela de Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Logs de Autenticação
            </h3>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {filteredLogs.length} registros encontrados
            </div>
          </div>

        {filteredLogs.length === 0 ? (
            <div className="text-center py-20">
              <FaShieldAlt className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-neutral-400 dark:text-neutral-500">
                Tente ajustar os filtros ou verificar se há dados disponíveis
              </p>
            </div>
        ) : (
          <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Endereço IP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      {showDetails && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
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
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getStatusColor(log)}`}>
                            {getInitials(log.username)}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {log.username}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  ID: {log.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
                              <FaMapMarkerAlt className="w-3 h-3 text-neutral-400" />
                              <span>{log.ip_address}</span>
                        </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                              isSuccess 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                              {isSuccess ? <FaCheckCircle className="w-3 h-3 mr-1" /> : <FaTimesCircle className="w-3 h-3 mr-1" />}
                          {getStatusText(log)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {date}
                              </div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                {time}
                              </div>
                            </div>
                          </td>
                      {showDetails && (
                            <td className="px-6 py-4">
                              <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
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
              <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Mostrando {filteredLogs.length} de {totalItems} registros
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                    className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Anterior
                  </motion.button>
                
                {renderPaginationButtons()}
                
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                    className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Próximo
                  </motion.button>
                </div>
              </div>
          </>
        )}
        </motion.div>
      </div>
    </div>
  );
} 