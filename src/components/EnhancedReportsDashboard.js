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
  FaFileCsv,
  FaUsers,
  FaChartLine,
  FaClock,
  FaTrophy,
  FaCalendarAlt,
  FaFilter,
  FaRedo
} from 'react-icons/fa';

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

// Função para gerar estilos dinâmicos baseados no tema
const getThemeStyles = (isDarkMode) => ({
  container: {
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  button: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: '#3b82f6',
    color: 'white',
  },
  secondaryButton: {
    background: isDarkMode ? '#374151' : '#f3f4f6',
    color: isDarkMode ? '#f9fafb' : '#374151',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
  },
  select: {
    padding: '0.5rem 1rem',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
    borderRadius: '8px',
    background: isDarkMode ? '#374151' : 'white',
    color: isDarkMode ? '#f9fafb' : '#374151',
    fontSize: '0.9rem',
    minWidth: '150px',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    background: isDarkMode ? '#374151' : 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
    transition: 'all 0.2s',
  },
  summaryCardHover: {
    boxShadow: '0 4px 16px rgba(59,130,246,0.15)',
    transform: 'translateY(-2px)',
  },
  summaryTitle: {
    fontSize: '0.9rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    fontWeight: 600,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    marginBottom: '0.25rem',
  },
  summarySubtitle: {
    fontSize: '0.8rem',
    color: isDarkMode ? '#6b7280' : '#9ca3af',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartCard: {
    background: isDarkMode ? '#374151' : 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  chartTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: isDarkMode ? '#f9fafb' : '#1f2937',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  tableCard: {
    background: isDarkMode ? '#374151' : 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
    marginBottom: '2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    background: isDarkMode ? '#4b5563' : '#f9fafb',
    borderBottom: isDarkMode ? '2px solid #6b7280' : '2px solid #e5e7eb',
  },
  tableHeaderCell: {
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    color: isDarkMode ? '#f9fafb' : '#374151',
  },
  tableCell: {
    padding: '0.75rem',
    borderBottom: isDarkMode ? '1px solid #4b5563' : '1px solid #f3f4f6',
    color: isDarkMode ? '#e5e7eb' : '#374151',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    fontSize: '1.1rem',
  },
  error: {
    textAlign: 'center',
    padding: '3rem',
    color: '#ef4444',
    fontSize: '1.1rem',
  },
  mobileGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
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

  const getChartOptions = (isDarkMode) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { 
          font: { size: 11 },
          color: isDarkMode ? '#f9fafb' : '#374151'
        }
      },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          font: { size: 10 },
          color: isDarkMode ? '#d1d5db' : '#6b7280'
        },
        grid: { 
          color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'
        }
      },
      x: {
        ticks: { 
          font: { size: 10 },
          color: isDarkMode ? '#d1d5db' : '#6b7280'
        },
        grid: { 
          color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
        }
      }
    }
  });

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
          
          Object.entries(periodData).forEach(([period, periodInfo]) => {
            usageData.push([
              period,
              periodInfo.tokens,
              periodInfo.requests,
              Math.round(periodInfo.tokens / periodInfo.requests)
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

  const exportToCSV = async () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const { saveAs } = await import('file-saver');
      
      let csvContent = 'Métrica,Valor\n';
      
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          csvContent += `Total de Usuários,${stats.totalUsers}\n`;
          csvContent += `Usuários Ativos,${stats.activeUsers}\n`;
          csvContent += `Total de Tokens,${stats.totalTokens}\n`;
          csvContent += `Total de Requisições,${stats.totalRequests}\n`;
          csvContent += `Média por Requisição,${Math.round(stats.averageTokensPerRequest)}\n`;
        }
      }
      
             csvContent += selectedCompany === 'Geral' 
         ? '\nUsuário,Empresa,Email,Total Tokens,Total Requisições,Média por Requisição\n'
         : '\nUsuário,Email,Total Tokens,Total Requisições,Média por Requisição\n';
       
       if (data.topUsers && selectedCompany) {
         const users = data.topUsers[selectedCompany] || [];
         users.forEach(user => {
           if (selectedCompany === 'Geral') {
             csvContent += `${user.name},${user.companyName},${user.email},${user.totalTokens},${user.totalRequests},${Math.round(user.averageTokensPerRequest)}\n`;
           } else {
             csvContent += `${user.name},${user.email},${user.totalTokens},${user.totalRequests},${Math.round(user.averageTokensPerRequest)}\n`;
           }
         });
       }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `relatorio-${selectedCompany}-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  // Definir estilos primeiro para usar nos returns de loading/error
  const styles = getThemeStyles(isDarkMode);
  const chartOptions = getChartOptions(isDarkMode);

  if (loading) return <div style={styles.loading}>Carregando dashboard...</div>;
  if (error) return <div style={styles.error}>Erro: {error}</div>;
  if (!data) return <div style={styles.loading}>Nenhum dado disponível</div>;

  const aggregatedData = processAggregatedData(data.tokenHistory);
  
  if (!aggregatedData) return <div style={styles.loading}>Dados insuficientes</div>;

  const stats = data.dashboardStats?.[selectedCompany];
  const topUsers = data.topUsers?.[selectedCompany] || [];

  // Função para cores dinâmicas de gráficos
  const getChartColors = (isDarkMode) => ({
    primary: isDarkMode ? '#60a5fa' : '#3b82f6',
    primaryBackground: isDarkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.12)',
    secondary: isDarkMode ? '#34d399' : '#10b981',
    secondaryBackground: isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    multiColor: isDarkMode 
      ? ['#60a5fa', '#a78bfa', '#fb7185', '#fbbf24', '#34d399', '#f87171', '#a3e635']
      : ['#60a5fa', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#a3e635'],
    userColors: isDarkMode
      ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  });

  const chartColors = getChartColors(isDarkMode);

  // Dados para os gráficos
  const hourlyChartData = {
    labels: aggregatedData.hourly.labels,
    datasets: [{
      label: 'Consumo Médio por Hora',
      data: aggregatedData.hourly.data,
      borderColor: chartColors.primary,
      backgroundColor: chartColors.primaryBackground,
      tension: 0.4,
      pointRadius: 3
    }]
  };

  const dailyChartData = {
    labels: aggregatedData.daily.labels,
    datasets: [{
      label: 'Consumo por Dia da Semana',
      data: aggregatedData.daily.data,
      backgroundColor: chartColors.multiColor,
      borderWidth: 1
    }]
  };

  const userDistributionData = {
    labels: topUsers.slice(0, 5).map(user => user.name),
    datasets: [{
      data: topUsers.slice(0, 5).map(user => user.totalTokens),
      backgroundColor: chartColors.userColors,
      borderWidth: 2,
      borderColor: isDarkMode ? '#374151' : '#ffffff'
    }]
  };

  // Dados de uso por período selecionado
  const periodData = data.usageByPeriod?.[selectedCompany];
  const periodChartData = periodData ? {
    labels: Object.keys(periodData).sort(),
    datasets: [{
      label: `Consumo por ${selectedPeriod === 'daily' ? 'Dia' : selectedPeriod === 'weekly' ? 'Semana' : 'Mês'}`,
      data: Object.keys(periodData).sort().map(key => periodData[key].tokens),
      borderColor: chartColors.secondary,
      backgroundColor: chartColors.secondaryBackground,
      tension: 0.4,
      pointRadius: 4
    }]
  } : null;

  const gridStyle = isMobile ? styles.mobileGrid : styles.chartsGrid;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard de Relatórios</h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: isDarkMode ? '#9ca3af' : '#6b7280', 
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaCalendarAlt />
            Período: {selectedPeriod === 'daily' ? 'Diário' : selectedPeriod === 'weekly' ? 'Semanal' : 'Mensal'}
          </p>
        </div>
        <div style={styles.controls}>
          <select
            className="px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 text-sm min-w-[150px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em',
              paddingRight: '2.5rem'
            }}
            value={selectedCompany || ''}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            {data.tokenHistory?.companies && Object.keys(data.tokenHistory.companies).map(company => {
              // Para superadmin, mostrar "Geral" primeiro, depois as empresas
              if (isSuperAdmin && company === 'Geral') {
                return <option key={company} value={company} className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">📊 {company}</option>;
              } else if (isSuperAdmin && company !== 'Geral') {
                return <option key={company} value={company} className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">🏢 {company}</option>;
              } else {
                return <option key={company} value={company} className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">{company}</option>;
              }
            })}
          </select>
          
          <select
            className="px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 text-sm min-w-[150px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em',
              paddingRight: '2.5rem'
            }}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="daily" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">Diário</option>
            <option value="weekly" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">Semanal</option>
            <option value="monthly" className="bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">Mensal</option>
          </select>
          
          <button
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-100 cursor-pointer flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={fetchData}
            disabled={loading}
          >
            <FaRedo />
            Atualizar
          </button>
          
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border-none rounded-lg bg-blue-500 text-white cursor-pointer flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={exportToPDF}
              disabled={exporting}
            >
              <FaFilePdf />
              PDF
            </button>
            <button
              className="px-4 py-2 border-none rounded-lg bg-blue-500 text-white cursor-pointer flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={exportToExcel}
              disabled={exporting}
            >
              <FaFileExcel />
              Excel
            </button>
            <button
              className="px-4 py-2 border-none rounded-lg bg-blue-500 text-white cursor-pointer flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={exportToCSV}
              disabled={exporting}
            >
              <FaFileCsv />
              CSV
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
            <FaUsers />
            Total de Usuários
          </div>
          <div style={styles.summaryValue}>
            {stats?.totalUsers?.toLocaleString() || '0'}
          </div>
          <div style={styles.summarySubtitle}>
            {stats?.activeUsers || '0'} usuários ativos
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
            <FaChartLine />
            Total de Tokens
          </div>
          <div style={styles.summaryValue}>
            {stats?.totalTokens?.toLocaleString() || '0'}
          </div>
          <div style={styles.summarySubtitle}>
            {stats?.totalRequests?.toLocaleString() || '0'} requisições
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
            <FaClock />
            Média por Requisição
          </div>
          <div style={styles.summaryValue}>
            {Math.round(stats?.averageTokensPerRequest || 0)}
          </div>
          <div style={styles.summarySubtitle}>
            tokens por requisição
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
            <FaTrophy />
            Usuário Top
          </div>
          <div style={styles.summaryValue}>
            {topUsers[0]?.name?.split(' ')[0] || 'N/A'}
          </div>
          <div style={styles.summarySubtitle}>
            {topUsers[0]?.totalTokens?.toLocaleString() || '0'} tokens
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={gridStyle}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            Consumo por {selectedPeriod === 'daily' ? 'Dia' : selectedPeriod === 'weekly' ? 'Semana' : 'Mês'}
            <FaCalendarAlt />
          </div>
          <div style={styles.chartContainer}>
            {periodChartData ? (
              <Line data={periodChartData} options={chartOptions} />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: '0.9rem'
              }}>
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            Consumo por Dia da Semana
            <FaCalendarAlt />
          </div>
          <div style={styles.chartContainer}>
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            Distribuição por Usuário
            <FaUsers />
          </div>
          <div style={styles.chartContainer}>
            <Doughnut data={userDistributionData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  position: 'bottom',
                  labels: { font: { size: 10 } }
                }
              }
            }} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            Top 5 Usuários
            <FaTrophy />
          </div>
          <div style={styles.chartContainer}>
            <Bar data={{
              labels: topUsers.slice(0, 5).map(user => user.name),
              datasets: [{
                label: 'Total de Tokens',
                data: topUsers.slice(0, 5).map(user => user.totalTokens),
                backgroundColor: chartColors.primary,
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
            Ranking de Usuários
            <FaTrophy />
          </div>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Posição</th>
                <th style={styles.tableHeaderCell}>Usuário</th>
                {selectedCompany === 'Geral' && (
                  <th style={styles.tableHeaderCell}>Empresa</th>
                )}
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Total Tokens</th>
                <th style={styles.tableHeaderCell}>Requisições</th>
                <th style={styles.tableHeaderCell}>Média/Req</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => (
                <tr key={user.userId}>
                  <td style={styles.tableCell}>#{index + 1}</td>
                  <td style={styles.tableCell}>{user.name}</td>
                  {selectedCompany === 'Geral' && (
                    <td style={styles.tableCell}>{user.companyName}</td>
                  )}
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.totalTokens.toLocaleString()}</td>
                  <td style={styles.tableCell}>{user.totalRequests.toLocaleString()}</td>
                  <td style={styles.tableCell}>{Math.round(user.averageTokensPerRequest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EnhancedReportsDashboard; 