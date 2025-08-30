import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { reportsService, exportService } from '../services/reports.service';
import { 
  FaDownload, 
  FaFilePdf, 
  FaFileExcel,
  FaUsers,
  FaChartLine,
  FaClock,
  FaTrophy,
  FaCalendarAlt,
  FaFilter,
  FaRedo,
  FaServer,
  FaUserCheck,
  FaPercentage
} from 'react-icons/fa';

// Estilos CSS para compatibilidade cross-browser
const selectStyles = `
  .enhanced-select {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
  }
  
  .enhanced-select::-ms-expand {
    display: none;
  }
  
  .enhanced-select:hover {
    border-color: var(--hover-border-color) !important;
    box-shadow: var(--hover-shadow) !important;
  }
  
  .enhanced-select:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    outline: none !important;
  }
  
  .enhanced-select option {
    background-color: var(--option-bg);
    color: var(--option-color);
    padding: 8px 12px;
  }
  
  /* Fallback para navegadores mais antigos */
  @supports not (backdrop-filter: blur(4px)) {
    .enhanced-select {
      background: var(--select-fallback-bg) !important;
    }
  }
`;

// Injetar estilos CSS
const injectStyles = () => {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = selectStyles;
  document.head.appendChild(styleSheet);
};

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Função para gerar estilos dinâmicos baseados no tema e tamanho da tela
const getThemeStyles = (isDarkMode, isMobile) => ({
  container: {
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    padding: isMobile ? '0 0.25rem' : '0 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '1rem' : '2rem',
    flexWrap: 'wrap',
    gap: isMobile ? '0.5rem' : '1rem',
    flexDirection: isMobile ? 'column' : 'row',
  },
  title: {
    fontSize: isMobile ? '1.2rem' : '1.8rem',
    fontWeight: 700,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    margin: 0,
    textAlign: isMobile ? 'center' : 'left',
    width: isMobile ? '100%' : 'auto',
  },
  controls: {
    display: 'flex',
    gap: isMobile ? '0.25rem' : '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'center' : 'flex-end',
    width: isMobile ? '100%' : 'auto',
  },
  button: {
    padding: isMobile ? '0.35rem 0.6rem' : '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.25rem' : '0.5rem',
    fontSize: isMobile ? '0.7rem' : '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    minHeight: isMobile ? '36px' : 'auto',
    minWidth: isMobile ? '60px' : 'auto',
  },
  primaryButton: {
    background: '#3b82f6',
    color: 'white',
  },
  secondaryButton: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    color: isDarkMode ? '#f9fafb' : '#374151',
    border: isDarkMode ? '1px solid #525252' : '1px solid #e5e7eb',
    backdropFilter: 'blur(4px)',
  },
  select: {
    padding: isMobile ? '0.35rem 0.6rem' : '0.5rem 1rem',
    border: isDarkMode ? '1px solid #525252' : '1px solid #e5e7eb',
    borderRadius: '8px',
    background: isDarkMode ? '#404040' : '#ffffff',
    // Fallback para navegadores que não suportam backdrop-filter
    backgroundColor: isDarkMode ? 'rgba(64, 64, 64, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)', // Safari support
    color: isDarkMode ? '#f9fafb' : '#374151',
    fontSize: isMobile ? '0.7rem' : '0.9rem',
    minWidth: isMobile ? '100px' : '150px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: isDarkMode 
      ? `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23f9fafb' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")` 
      : `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23374151' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7rem center',
    backgroundSize: '0.65rem auto',
    paddingRight: '2.5rem',
    transition: 'all 0.2s ease-in-out',
    boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    // CSS Variables para compatibilidade com pseudo-seletores
    '--hover-border-color': isDarkMode ? '#6b7280' : '#d1d5db',
    '--hover-shadow': isDarkMode ? '0 4px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.15)',
    '--option-bg': isDarkMode ? '#374151' : '#ffffff',
    '--option-color': isDarkMode ? '#f9fafb' : '#374151',
    '--select-fallback-bg': isDarkMode ? '#404040' : '#ffffff',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: isMobile ? '0.5rem' : '1.5rem',
    marginBottom: isMobile ? '1rem' : '2rem',
  },
  summaryCard: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(4px)',
    padding: isMobile ? '0.75rem' : '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #525252' : '1px solid #e5e7eb',
    transition: 'all 0.3s',
    minHeight: isMobile ? '80px' : '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  summaryCardHover: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    transform: 'translateY(-2px)',
  },
  summaryTitle: {
    fontSize: isMobile ? '0.65rem' : '0.9rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    fontWeight: 600,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    wordBreak: 'break-word',
  },
  summaryIcon: {
    fontSize: isMobile ? '0.8rem' : '1.1rem',
    minWidth: isMobile ? '0.8rem' : '1.1rem',
  },
  summaryValue: {
    fontSize: isMobile ? '1rem' : '2rem',
    fontWeight: 700,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    marginBottom: '0.25rem',
    lineHeight: '1.2',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  summarySubtitle: {
    fontSize: isMobile ? '0.6rem' : '0.8rem',
    color: isDarkMode ? '#6b7280' : '#9ca3af',
    lineHeight: '1.3',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: isMobile ? '0.5rem' : '1.5rem',
    marginBottom: isMobile ? '1rem' : '2rem',
  },
  chartCard: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(4px)',
    padding: isMobile ? '0.75rem' : '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #525252' : '1px solid #e5e7eb',
    minHeight: isMobile ? '200px' : '400px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s',
  },
  chartTitle: {
    fontSize: isMobile ? '0.8rem' : '1.1rem',
    fontWeight: 600,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    marginBottom: isMobile ? '0.5rem' : '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chartIcon: {
    fontSize: isMobile ? '0.9rem' : '1.2rem',
    minWidth: isMobile ? '0.9rem' : '1.2rem',
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
    minHeight: isMobile ? '150px' : '300px',
  },
  tableCard: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(4px)',
    padding: isMobile ? '0.75rem' : '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #525252' : '1px solid #e5e7eb',
    marginBottom: isMobile ? '1rem' : '2rem',
    transition: 'all 0.3s',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: isMobile ? '0.65rem' : '0.9rem',
    minWidth: isMobile ? '400px' : 'auto',
  },
  tableHeader: {
    background: isDarkMode ? 'rgba(64, 64, 64, 0.2)' : '#f9fafb',
    borderBottom: isDarkMode ? '2px solid #525252' : '2px solid #e5e7eb',
  },
  tableHeaderCell: {
    padding: isMobile ? '0.3rem 0.4rem' : '0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    color: isDarkMode ? '#f9fafb' : '#374151',
    whiteSpace: 'nowrap',
  },
  tableCell: {
    padding: isMobile ? '0.3rem 0.4rem' : '0.75rem',
    borderBottom: isDarkMode ? '1px solid rgba(64, 64, 64, 0.3)' : '1px solid #f3f4f6',
    color: isDarkMode ? '#d1d5db' : '#374151',
    whiteSpace: 'nowrap',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '2rem 1rem' : '4rem 2rem',
    fontSize: isMobile ? '0.9rem' : '1.1rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '2rem 1rem' : '4rem 2rem',
    fontSize: isMobile ? '0.9rem' : '1.1rem',
    color: '#ef4444',
    textAlign: 'center',
  },
  exportButtons: {
    display: 'flex',
    gap: isMobile ? '0.25rem' : '0.5rem',
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'center' : 'flex-end',
  },
});

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const EnhancedReportsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [hoveredCard, setHoveredCard] = useState(-1);
  const [exporting, setExporting] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMobile = useIsMobile();

  // Injetar estilos CSS para compatibilidade
  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  // Detectar mudanças no dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Verificar tema inicial
    checkDarkMode();
    
    // Observer para mudanças na classe dark
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tokenHistoryRes, dashboardStatsRes, usageByPeriodRes, topUsersRes] = await Promise.all([
        axios.get('/api/report/token-history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get('/api/report/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get(`/api/report/usage-by-period?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        axios.get('/api/report/top-users?limit=10', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);

      const combinedData = {
        tokenHistory: tokenHistoryRes.data.success ? tokenHistoryRes.data.data : null,
        dashboardStats: dashboardStatsRes.data.success ? dashboardStatsRes.data.data : null,
        usageByPeriod: usageByPeriodRes.data.success ? usageByPeriodRes.data.data : null,
        topUsers: topUsersRes.data.success ? topUsersRes.data.data : null,
      };

      setData(combinedData);
      
      // Verificar se é superadmin (tem acesso a múltiplas empresas)
      const companies = combinedData.tokenHistory?.companies;
      if (companies && Object.keys(companies).length > 1) {
        setIsSuperAdmin(true);
      }
      
      // Selecionar primeira empresa por padrão
      if (combinedData.tokenHistory?.companies) {
        const firstCompany = Object.keys(combinedData.tokenHistory.companies)[0];
        setSelectedCompany(firstCompany);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const processAggregatedData = (rawData) => {
    if (!rawData || !rawData.companies || !selectedCompany) return null;

    const companyData = rawData.companies[selectedCompany] || [];
    const allTokens = [];
    
    companyData.forEach(user => {
      if (user.data && Array.isArray(user.data)) {
        user.data.forEach(entry => {
          allTokens.push({
            tokens: entry.tokens,
            date: new Date(entry.date),
            user: selectedCompany === 'Geral' ? `${user.name} (${user.companyName})` : user.name
          });
        });
      }
    });

    const totalTokens = allTokens.reduce((sum, entry) => sum + entry.tokens, 0);
    const totalRequests = allTokens.length;
    const averagePerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

    // Agrupar por hora
    const hourlyData = {};
    allTokens.forEach(entry => {
      const hour = entry.date.getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(entry.tokens);
    });

    // Agrupar por dia da semana
    const dailyData = {};
    allTokens.forEach(entry => {
      const day = entry.date.getDay();
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[day];
      if (!dailyData[dayName]) dailyData[dayName] = [];
      dailyData[dayName].push(entry.tokens);
    });

    const calculateAverage = (values) => {
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const filterNonZero = (labels, data) => {
      const filtered = labels.map((l, i) => ({ l, v: data[i] })).filter(x => x.v && !isNaN(x.v));
      return {
        labels: filtered.map(x => x.l),
        data: filtered.map(x => x.v)
      };
    };

    const hourly = filterNonZero(
      Object.keys(hourlyData).map(h => `${h}h`).sort((a, b) => parseInt(a) - parseInt(b)),
      Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b)).map(h => calculateAverage(hourlyData[h]))
    );

    const daily = filterNonZero(
      ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => calculateAverage(dailyData[day] || []))
    );

    return {
      hourly,
      daily,
      totalTokens,
      totalRequests,
      averagePerRequest
    };
  };

  const getChartOptions = (isDarkMode, isMobile) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'top',
        labels: { 
          font: { size: isMobile ? 8 : 11 },
          color: isDarkMode ? '#f9fafb' : '#374151',
          padding: isMobile ? 8 : 12,
          usePointStyle: isMobile ? true : false,
          pointStyle: isMobile ? 'circle' : 'rect',
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#f9fafb' : '#1f2937',
        bodyColor: isDarkMode ? '#d1d5db' : '#374151',
        borderColor: isDarkMode ? '#525252' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { size: isMobile ? 10 : 12 },
        bodyFont: { size: isMobile ? 9 : 11 },
        padding: isMobile ? 8 : 12,
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          font: { size: isMobile ? 8 : 10 },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          font: { size: isMobile ? 8 : 10 },
          callback: function(value) {
            if (isMobile && value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        }
      }
    },
    interaction: {
      mode: isMobile ? 'nearest' : 'index',
      intersect: false,
    },
    elements: {
      point: {
        radius: isMobile ? 2 : 4,
        hoverRadius: isMobile ? 4 : 6,
      },
      line: {
        borderWidth: isMobile ? 1 : 2,
      },
      bar: {
        borderWidth: isMobile ? 0 : 1,
      }
    },
    animation: {
      duration: isMobile ? 500 : 1000,
    }
  });

  const chartOptions = getChartOptions(isDarkMode, isMobile);

  const exportToPDF = async () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Uso - Dashboard', 20, 20);
      
      // Estatísticas gerais
      doc.setFontSize(14);
      doc.text('Estatísticas Gerais', 20, 40);
      
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          const tableData = [
            ['Métrica', 'Valor'],
            ['Total de Usuários', stats.totalUsers.toString()],
            ['Usuários Ativos', stats.activeUsers.toString()],
            ['Total de Tokens', stats.totalTokens.toLocaleString()],
            ['Total de Requisições', stats.totalRequests.toLocaleString()],
            ['Média por Requisição', Math.round(stats.averageTokensPerRequest).toString()],
          ];
          
          autoTable.default(doc, {
            head: [['Métrica', 'Valor']],
            body: tableData.slice(1),
            startY: 50,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [59, 130, 246] }
          });
        }
      }
      
      // Top usuários
      if (data.topUsers && selectedCompany) {
        const users = data.topUsers[selectedCompany] || [];
        if (users.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text('Top Usuários por Consumo', 20, 20);
          
                     const userData = users.map(user => {
             if (selectedCompany === 'Geral') {
               return [
                 user.name,
                 user.companyName,
                 user.totalTokens.toLocaleString(),
                 user.totalRequests.toString(),
                 Math.round(user.averageTokensPerRequest).toString()
               ];
             } else {
               return [
                 user.name,
                 user.totalTokens.toLocaleString(),
                 user.totalRequests.toString(),
                 Math.round(user.averageTokensPerRequest).toString()
               ];
             }
           });
          
                      autoTable.default(doc, {
              head: selectedCompany === 'Geral' 
                ? [['Usuário', 'Empresa', 'Total Tokens', 'Requisições', 'Média/Req']]
                : [['Usuário', 'Total Tokens', 'Requisições', 'Média/Req']],
              body: userData,
              startY: 30,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [59, 130, 246] }
            });
        }
      }
      
      doc.save(`relatorio-${selectedCompany}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.utils.book_new();
      
      // Planilha de estatísticas gerais
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          const statsData = [
            ['Métrica', 'Valor'],
            ['Total de Usuários', stats.totalUsers],
            ['Usuários Ativos', stats.activeUsers],
            ['Total de Tokens', stats.totalTokens],
            ['Total de Requisições', stats.totalRequests],
            ['Média por Requisição', Math.round(stats.averageTokensPerRequest)],
          ];
          
          const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
          XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas Gerais');
        }
      }
      
      // Planilha de top usuários
      if (data.topUsers && selectedCompany) {
        const users = data.topUsers[selectedCompany] || [];
        if (users.length > 0) {
                     const userData = [
             selectedCompany === 'Geral' 
               ? ['Usuário', 'Empresa', 'Email', 'Total Tokens', 'Total Requisições', 'Média por Requisição']
               : ['Usuário', 'Email', 'Total Tokens', 'Total Requisições', 'Média por Requisição']
           ];
           
           users.forEach(user => {
             if (selectedCompany === 'Geral') {
               userData.push([
                 user.name,
                 user.companyName,
                 user.email,
                 user.totalTokens,
                 user.totalRequests,
                 Math.round(user.averageTokensPerRequest)
               ]);
             } else {
               userData.push([
                 user.name,
                 user.email,
                 user.totalTokens,
                 user.totalRequests,
                 Math.round(user.averageTokensPerRequest)
               ]);
             }
           });
          
          const usersSheet = XLSX.utils.aoa_to_sheet(userData);
          XLSX.utils.book_append_sheet(workbook, usersSheet, 'Top Usuários');
        }
      }
      
      // Planilha de uso por período
      if (data.usageByPeriod && selectedCompany) {
        const periodData = data.usageByPeriod[selectedCompany];
        if (periodData) {
          const usageData = [
            ['Período', 'Total Tokens', 'Total Requisições', 'Média por Requisição']
          ];
          
          Object.entries(periodData).forEach(([period, data]) => {
            usageData.push([
              period,
              data.tokens,
              data.requests,
              Math.round(data.tokens / data.requests)
            ]);
          });
          
          const usageSheet = XLSX.utils.aoa_to_sheet(usageData);
          XLSX.utils.book_append_sheet(workbook, usageSheet, 'Uso por Período');
        }
      }
      
      XLSX.writeFile(workbook, `relatorio-${selectedCompany}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    } finally {
      setExporting(false);
    }
  };



  // Definir estilos primeiro para usar nos returns de loading/error
  const styles = getThemeStyles(isDarkMode, isMobile);

  if (loading) return <div style={styles.loading}>Carregando dashboard...</div>;
  if (error) return <div style={styles.error}>Erro: {error}</div>;
  if (!data) return <div style={styles.loading}>Nenhum dado disponível</div>;

  const aggregatedData = processAggregatedData(data.tokenHistory);
  if (!aggregatedData) return <div style={styles.loading}>Dados insuficientes</div>;

  const stats = data.dashboardStats?.[selectedCompany];
  const topUsers = data.topUsers?.[selectedCompany] || [];

  // Dados para os gráficos
  const hourlyChartData = {
    labels: aggregatedData.hourly.labels,
    datasets: [{
      label: 'Consumo Médio por Hora',
      data: aggregatedData.hourly.data,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      tension: 0.4,
      pointRadius: 3
    }]
  };

  const dailyChartData = {
    labels: aggregatedData.daily.labels,
    datasets: [{
      label: 'Consumo por Dia da Semana',
      data: aggregatedData.daily.data,
      backgroundColor: [
        '#60a5fa', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#a3e635'
      ],
      borderWidth: 1
    }]
  };

  const userDistributionData = {
    labels: topUsers.slice(0, 5).map(user => user.name),
    datasets: [{
      data: topUsers.slice(0, 5).map(user => user.totalTokens),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Dados de uso por período selecionado
  const periodData = data.usageByPeriod?.[selectedCompany];
  const periodChartData = periodData ? {
    labels: Object.keys(periodData).sort(),
    datasets: [{
      label: `Consumo por ${selectedPeriod === 'daily' ? 'Dia' : selectedPeriod === 'weekly' ? 'Semana' : 'Mês'}`,
      data: Object.keys(periodData).sort().map(key => periodData[key].tokens),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      tension: 0.4,
      pointRadius: 4
    }]
  } : null;

  const gridStyle = isMobile ? styles.mobileGrid : styles.chartsGrid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/30 via-transparent to-indigo-50/30 dark:from-neutral-950/10 dark:via-transparent dark:to-neutral-950/10 transition-colors duration-500">
      <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard de Relatórios</h1>
        
        <div style={styles.controls}>
          <select
            style={styles.select}
            className="enhanced-select"
            value={selectedCompany || ''}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            {data.tokenHistory?.companies && Object.keys(data.tokenHistory.companies).map(company => {
              // Para superadmin, mostrar "Geral" primeiro, depois as empresas
              if (isSuperAdmin && company === 'Geral') {
                return <option key={company} value={company}>📊 {company}</option>;
              } else if (isSuperAdmin && company !== 'Geral') {
                return <option key={company} value={company}>🏢 {company}</option>;
              } else {
                return <option key={company} value={company}>{company}</option>;
              }
            })}
          </select>
          
          <select
            style={styles.select}
            className="enhanced-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
          
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={fetchData}
            disabled={loading}
          >
            <FaRedo />
            {isMobile ? 'Atualizar' : 'Atualizar'}
          </button>
          
          <div style={styles.exportButtons}>
            <button
              style={{ 
                ...styles.button, 
                background: '#8C4B35',
                color: 'white',
                border: 'none'
              }}
              onClick={exportToPDF}
              disabled={exporting}
            >
              <FaFilePdf />
              {isMobile ? 'PDF' : 'PDF'}
            </button>
            <button
              style={{ 
                ...styles.button, 
                background: '#8C4B35',
                color: 'white',
                border: 'none'
              }}
              onClick={exportToExcel}
              disabled={exporting}
            >
              <FaFileExcel />
              {isMobile ? 'Excel' : 'Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={styles.summaryGrid}>
        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 0 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaUsers style={styles.summaryIcon} />
            {isMobile ? 'Usuários' : 'Total de Usuários'}
          </div>
          <div style={styles.summaryValue}>
            {stats?.totalUsers?.toLocaleString() || '0'}
          </div>
          <div style={styles.summarySubtitle}>
            {stats?.activeUsers || '0'} {isMobile ? 'ativos' : 'usuários ativos'}
          </div>
        </div>

        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 1 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaChartLine style={styles.summaryIcon} />
            {isMobile ? 'Tokens' : 'Total de Tokens'}
          </div>
          <div style={styles.summaryValue}>
            {stats?.totalTokens?.toLocaleString() || '0'}
          </div>
          <div style={styles.summarySubtitle}>
            {stats?.totalRequests || '0'} {isMobile ? 'req.' : 'requisições'}
          </div>
        </div>

        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 2 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaClock style={styles.summaryIcon} />
            {isMobile ? 'Média/Req' : 'Média por Requisição'}
          </div>
          <div style={styles.summaryValue}>
            {Math.round(stats?.averageTokensPerRequest || 0)}
          </div>
          <div style={styles.summarySubtitle}>
            {isMobile ? 'tokens/req.' : 'tokens por requisição'}
          </div>
        </div>

        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 3 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaPercentage style={styles.summaryIcon} />
            {isMobile ? 'Eficiência' : 'Taxa de Eficiência'}
          </div>
          <div style={styles.summaryValue}>
            {stats?.efficiencyRate ? `${Math.round(stats.efficiencyRate)}%` : 'N/A'}
          </div>
          <div style={styles.summarySubtitle}>
            {isMobile ? 'otimização' : 'taxa de otimização'}
          </div>
        </div>

        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 4 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaServer style={styles.summaryIcon} />
            {isMobile ? 'Requisições' : 'Total de Requisições'}
          </div>
          <div style={styles.summaryValue}>
            {stats?.totalRequests?.toLocaleString() || '0'}
          </div>
          <div style={styles.summarySubtitle}>
            {stats?.totalRequests > 0 ? `${Math.round((stats.totalRequests / (stats.totalRequests + 1000)) * 100)}%` : '0%'} do período
          </div>
        </div>

        <div 
          style={{ 
            ...styles.summaryCard, 
            ...(hoveredCard === 5 ? styles.summaryCardHover : {})
          }}
          onMouseEnter={() => setHoveredCard(5)}
          onMouseLeave={() => setHoveredCard(-1)}
        >
          <div style={styles.summaryTitle}>
            <FaCalendarAlt style={styles.summaryIcon} />
            {isMobile ? 'Pico' : 'Pico de Consumo'}
          </div>
          <div style={styles.summaryValue}>
            {data?.usageByPeriod?.[selectedCompany] 
              ? Math.max(...Object.values(data.usageByPeriod[selectedCompany]).map(day => day.tokens || 0)).toLocaleString()
              : '0'
            }
          </div>
          <div style={styles.summarySubtitle}>
            {isMobile ? 'tokens/dia' : 'tokens em um dia'}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={gridStyle}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            {isMobile ? 'Consumo por Hora' : 'Consumo por Hora do Dia'}
            <FaClock style={styles.chartIcon} />
          </div>
          <div style={styles.chartContainer}>
            {hourlyChartData ? (
              <Line data={hourlyChartData} options={chartOptions} />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#6b7280',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                textAlign: 'center',
                padding: isMobile ? '1rem' : '2rem'
              }}>
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            {isMobile ? 'Consumo por Dia' : 'Consumo por Dia da Semana'}
            <FaCalendarAlt style={styles.chartIcon} />
          </div>
          <div style={styles.chartContainer}>
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            {isMobile ? 'Distribuição' : 'Distribuição por Usuário'}
            <FaUsers style={styles.chartIcon} />
          </div>
          <div style={styles.chartContainer}>
            <Doughnut data={userDistributionData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  position: isMobile ? 'bottom' : 'bottom',
                  labels: { font: { size: isMobile ? 8 : 10 } }
                }
              }
            }} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            {isMobile ? 'Top 5' : 'Top 5 Usuários'}
            <FaTrophy style={styles.chartIcon} />
          </div>
          <div style={styles.chartContainer}>
            <Bar data={{
              labels: topUsers.slice(0, 5).map(user => isMobile ? user.name.split(' ')[0] : user.name),
              datasets: [{
                label: 'Total de Tokens',
                data: topUsers.slice(0, 5).map(user => user.totalTokens),
                backgroundColor: '#3b82f6',
                borderWidth: 1
              }]
            }} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Tabela de Top Usuários */}
      {topUsers.length > 0 && (
        <div style={styles.tableCard}>
          <div style={styles.chartTitle}>
            {isMobile ? 'Ranking' : 'Ranking de Usuários'}
            <FaTrophy style={styles.chartIcon} />
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>#</th>
                  <th style={styles.tableHeaderCell}>{isMobile ? 'Usuário' : 'Usuário'}</th>
                  {selectedCompany === 'Geral' && !isMobile && (
                    <th style={styles.tableHeaderCell}>Empresa</th>
                  )}
                  {!isMobile && <th style={styles.tableHeaderCell}>Email</th>}
                  <th style={styles.tableHeaderCell}>{isMobile ? 'Tokens' : 'Total Tokens'}</th>
                  <th style={styles.tableHeaderCell}>{isMobile ? 'Req.' : 'Requisições'}</th>
                  <th style={styles.tableHeaderCell}>{isMobile ? 'Média' : 'Média/Req'}</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user, index) => (
                  <tr key={user.userId}>
                    <td style={styles.tableCell}>#{index + 1}</td>
                    <td style={styles.tableCell}>
                      {isMobile ? user.name.split(' ')[0] : user.name}
                    </td>
                    {selectedCompany === 'Geral' && !isMobile && (
                      <td style={styles.tableCell}>{user.companyName}</td>
                    )}
                    {!isMobile && <td style={styles.tableCell}>{user.email}</td>}
                    <td style={styles.tableCell}>
                      {isMobile ? 
                        (user.totalTokens >= 1000 ? 
                          (user.totalTokens / 1000).toFixed(1) + 'k' : 
                          user.totalTokens.toString()
                        ) : 
                        user.totalTokens.toLocaleString()
                      }
                    </td>
                    <td style={styles.tableCell}>
                      {isMobile ? 
                        (user.totalRequests >= 1000 ? 
                          (user.totalRequests / 1000).toFixed(1) + 'k' : 
                          user.totalRequests.toString()
                        ) : 
                        user.totalRequests.toLocaleString()
                      }
                    </td>
                    <td style={styles.tableCell}>{Math.round(user.averageTokensPerRequest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EnhancedReportsDashboard; 