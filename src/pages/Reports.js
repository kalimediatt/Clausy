import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FaChartBar, 
  FaChartLine, 
  FaUsers, 
  FaTrophy, 
  FaCoins,
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBug,
  FaTachometerAlt,
  FaShieldAlt,
  FaCog
} from "react-icons/fa";
import EnhancedReportsDashboard from '../components/EnhancedReportsDashboard';

const Reports = () => {
  const [theme] = useState(localStorage.getItem("theme") || "light");
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para dados reais
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Dados da Visão Geral
  const [overviewData, setOverviewData] = useState({
    kpis: {
      timeSaved: { value: '47h 20min', change: '+15%', changeType: 'positive' },
      errorsAvoided: { value: '127', change: '+8', changeType: 'positive' },
      costSaved: { value: 'R$ 23.680', description: 'Estimativa baseada em horas' },
      riskAvoided: { value: '15', description: 'Nulidades processuais' }
    },
    legalAreas: [
      { rank: 1, name: 'Trabalhista', cases: 89, time: '18h 40min', usage: 42 },
      { rank: 2, name: 'Cível', cases: 56, time: '12h 30min', usage: 28 }
    ]
  });
  
  // Dados da Análise de Erros
  const [errorAnalysisData, setErrorAnalysisData] = useState({
    errorTypes: [
      { name: 'Fundamentação', count: 32, percentage: 35 },
      { name: 'Citação', count: 24, percentage: 26 },
      { name: 'Estrutura', count: 18, percentage: 20 },
      { name: 'Português', count: 17, percentage: 19 }
    ]
  });
  
  // Dados da Performance
  const [performanceData, setPerformanceData] = useState({
    lawyers: [
      { 
        initials: 'MS', 
        name: 'Maria Silva', 
        consultations: 47, 
        errorsAvoided: 23, 
        timeSaved: '12h 30min', 
        status: 'Baixo', 
        change: '+15%',
        changeType: 'positive'
      },
      { 
        initials: 'JS', 
        name: 'João Santos', 
        consultations: 32, 
        errorsAvoided: 18, 
        timeSaved: '8h 45min', 
        status: 'Médio', 
        change: '+8%',
        changeType: 'positive'
      },
      { 
        initials: 'AC', 
        name: 'Ana Costa', 
        consultations: 28, 
        errorsAvoided: 15, 
        timeSaved: '7h 20min', 
        status: 'Baixo', 
        change: '+12%',
        changeType: 'positive'
      },
      { 
        initials: 'CL', 
        name: 'Carlos Lima', 
        consultations: 19, 
        errorsAvoided: 9, 
        timeSaved: '4h 50min', 
        status: 'Alto', 
        change: '-3%',
        changeType: 'negative'
      }
    ]
  });
  
  // Dados da Gestão de Risco
  const [riskManagementData, setRiskManagementData] = useState({
    recentRisks: [
      {
        description: '4 citações incorretas que poderiam gerar nulidade processual',
        author: 'Carlos Lima',
        date: 'Ontem',
        level: 'Alta'
      },
      {
        description: '2 fundamentações incompletas detectadas',
        author: 'João Santos',
        date: '2 dias atrás',
        level: 'Média'
      },
      {
        description: '1 estrutura processual inadequada corrigida',
        author: 'Ana Costa',
        date: '3 dias atrás',
        level: 'Baixa'
      }
    ],
    riskSummary: {
      low: { percentage: 73, description: 'das peças processadas' },
      medium: { percentage: 19, description: 'requer atenção' },
      high: { percentage: 8, description: 'corrigido pela Clausy' }
    }
  });
  
  // Dados da Visão Técnica
  const [technicalData, setTechnicalData] = useState({
    stats: {
      totalQueries: 124,
      activeUsers: 45,
      successRate: 98.5,
      creditsUsed: 1247
    }
  });
  
  // Função para carregar dados reais
  const loadRealData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Aqui você pode adicionar as chamadas para suas APIs
      // const overviewResponse = await api.get('/reports/overview');
      // const errorAnalysisResponse = await api.get('/reports/error-analysis');
      // const performanceResponse = await api.get('/reports/performance');
      // const riskManagementResponse = await api.get('/reports/risk-management');
      // const technicalResponse = await api.get('/reports/technical');
      
      // setOverviewData(overviewResponse.data);
      // setErrorAnalysisData(errorAnalysisResponse.data);
      // setPerformanceData(performanceResponse.data);
      // setRiskManagementData(riskManagementResponse.data);
      // setTechnicalData(technicalResponse.data);
      
    } catch (err) {
      setError('Erro ao carregar dados dos relatórios');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    loadRealData();
  }, []);

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
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
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
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium self-start sm:self-auto"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema Online</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Visão Geral', shortLabel: 'Geral', icon: FaChartBar },
              { id: 'technical', label: 'Visão Técnica', shortLabel: 'Técnica', icon: FaCog },
              { id: 'productivity', label: 'Analise de Erros', shortLabel: 'Erros', icon: FaBug },
              { id: 'revisions', label: 'Performance', shortLabel: 'Performance', icon: FaTachometerAlt },
              { id: 'errors', label: 'Gestão de Risco', shortLabel: 'Risco', icon: FaShieldAlt },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={isMobile ? tab.label : undefined}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-600 to-amber-600 text-white shadow-lg'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {!isMobile && (isMobile ? tab.shortLabel : tab.label)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visão Geral */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4 lg:space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tempo Economizado */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Tempo Economizado
                  </h3>
                  <FaClock className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    47h 20min
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +15% vs mês anterior
                  </p>
                </div>
              </div>

              {/* Erros Evitados */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Erros Evitados
                  </h3>
                  <FaShieldAlt className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    127
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +8 vs mês anterior
                  </p>
                </div>
              </div>

              {/* Custo Poupado */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Custo Poupado
                  </h3>
                  <FaChartLine className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    R$ 23.680
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Estimativa baseada em horas
                  </p>
                </div>
              </div>

              {/* Risco Evitado */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Risco Evitado
                  </h3>
                  <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    15
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Nulidades processuais
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking por Área Jurídica */}
            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <FaClock className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Ranking por Área Jurídica
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Trabalhista */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        Trabalhista
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        89 casos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        18h 40min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        42% uso
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cível */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        Cível
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        56 casos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        12h 30min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        28% uso
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visão Técnica */}
        {activeTab === 'technical' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            </div>

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
          </motion.div>
        )}

        {/* Análise de Erros */}
        {activeTab === 'productivity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Tipos de Erros Mais Comuns */}
            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                Tipos de Erros Mais Comuns
              </h2>
              
              <div className="space-y-6">
                {/* Fundamentação */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Fundamentação
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        32 erros
                      </span>
                      <span className="px-3 py-1 bg-neutral-800 dark:bg-neutral-700 text-white rounded-full text-sm font-medium">
                        35%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '35%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-amber-700 dark:bg-amber-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Citação */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Citação
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        24 erros
                      </span>
                      <span className="px-3 py-1 bg-neutral-800 dark:bg-neutral-700 text-white rounded-full text-sm font-medium">
                        26%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '26%' }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full bg-amber-700 dark:bg-amber-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Estrutura */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Estrutura
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        18 erros
                      </span>
                      <span className="px-3 py-1 bg-neutral-800 dark:bg-neutral-700 text-white rounded-full text-sm font-medium">
                        20%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '20%' }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-amber-700 dark:bg-amber-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Português */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      Português
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        17 erros
                      </span>
                      <span className="px-3 py-1 bg-neutral-800 dark:bg-neutral-700 text-white rounded-full text-sm font-medium">
                        19%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '19%' }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-amber-700 dark:bg-amber-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Performance */}
        {activeTab === 'revisions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4 lg:space-y-6"
          >
            {/* Performance por Advogado */}
            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-4 lg:p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 lg:mb-6">
                Performance por Advogado
              </h2>
              
              <div className="space-y-3 lg:space-y-4">
                {/* Maria Silva */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm lg:text-base">MS</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm lg:text-base">
                        Maria Silva
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        47 consultas • 23 erros evitados
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <div className="text-left lg:text-right">
                      <p className="text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">
                        12h 30min
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        tempo economizado
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <span className="inline-block px-2 py-1 lg:px-3 lg:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs lg:text-sm font-medium">
                        Baixo
                      </span>
                      <p className="text-xs lg:text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                        +15%
                      </p>
                    </div>
                  </div>
                </div>

                {/* João Santos */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm lg:text-base">JS</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm lg:text-base">
                        João Santos
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        32 consultas • 18 erros evitados
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <div className="text-left lg:text-right">
                      <p className="text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">
                        8h 45min
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        tempo economizado
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <span className="inline-block px-2 py-1 lg:px-3 lg:py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-xs lg:text-sm font-medium">
                        Médio
                      </span>
                      <p className="text-xs lg:text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                        +8%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ana Costa */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm lg:text-base">AC</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm lg:text-base">
                        Ana Costa
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        28 consultas • 15 erros evitados
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <div className="text-left lg:text-right">
                      <p className="text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">
                        7h 20min
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        tempo economizado
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <span className="inline-block px-2 py-1 lg:px-3 lg:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs lg:text-sm font-medium">
                        Baixo
                      </span>
                      <p className="text-xs lg:text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                        +12%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Carlos Lima */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold text-sm lg:text-base">CL</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm lg:text-base">
                        Carlos Lima
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        19 consultas • 9 erros evitados
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <div className="text-left lg:text-right">
                      <p className="text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">
                        4h 50min
                      </p>
                      <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                        tempo economizado
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <span className="inline-block px-2 py-1 lg:px-3 lg:py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs lg:text-sm font-medium">
                        Alto
                      </span>
                      <p className="text-xs lg:text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                        -3%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gestão de Risco */}
        {activeTab === 'errors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Riscos Evitados Recentemente */}
            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <FaShieldAlt className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Riscos Evitados Recentemente
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Alto Risco */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        4 citações incorretas que poderiam gerar nulidade processual
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Carlos Lima • Ontem
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                    Alta
                  </span>
                </div>

                {/* Médio Risco */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        2 fundamentações incompletas detectadas
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        João Santos • 2 dias atrás
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                    Média
                  </span>
                </div>

                {/* Baixo Risco */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        1 estrutura processual inadequada corrigida
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Ana Costa • 3 dias atrás
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                    Baixa
                  </span>
                </div>
              </div>
            </div>

            {/* Cards de Resumo de Risco */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Baixo Risco */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3 mb-4">
                  <FaShieldAlt className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Baixo Risco
                  </h3>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    73%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    das peças processadas
                  </p>
                </div>
              </div>

              {/* Médio Risco */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3 mb-4">
                  <FaExclamationTriangle className="w-6 h-6 text-orange-500" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Médio Risco
                  </h3>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    19%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    requer atenção
                  </p>
                </div>
              </div>

              {/* Alto Risco */}
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3 mb-4">
                  <FaExclamationTriangle className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Alto Risco
                  </h3>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                    8%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    corrigido pela Clausy
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
};

export default Reports;
