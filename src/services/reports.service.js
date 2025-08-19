import axios from 'axios';

// Configuração base para as requisições
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Função para obter o token de autenticação
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Configuração base do axios para relatórios
const reportsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para relatórios
});

// Interceptor para adicionar token automaticamente
reportsApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
reportsApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Serviços de Relatórios
 */
export const reportsService = {
  
  /**
   * Obter histórico de tokens
   */
  async getTokenHistory() {
    try {
      const response = await reportsApi.get('/report/token-history');
      return {
        success: true,
        data: response.data.success ? response.data.data : null
      };
    } catch (error) {
      console.error('Erro ao buscar histórico de tokens:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Obter estatísticas do dashboard
   */
  async getDashboardStats() {
    try {
      const response = await reportsApi.get('/report/dashboard-stats');
      return {
        success: true,
        data: response.data.success ? response.data.data : null
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Obter dados de uso por período
   * @param {string} period - daily, weekly, monthly, yearly
   */
  async getUsageByPeriod(period = 'monthly') {
    try {
      const response = await reportsApi.get(`/report/usage-by-period?period=${period}`);
      return {
        success: true,
        data: response.data.success ? response.data.data : null
      };
    } catch (error) {
      console.error('Erro ao buscar uso por período:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Obter top usuários
   * @param {number} limit - Limite de usuários a retornar
   */
  async getTopUsers(limit = 10) {
    try {
      const response = await reportsApi.get(`/report/top-users?limit=${limit}`);
      return {
        success: true,
        data: response.data.success ? response.data.data : null
      };
    } catch (error) {
      console.error('Erro ao buscar top usuários:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * Buscar todos os dados de relatório de uma vez
   * @param {string} period - Período para os dados de uso
   */
  async getAllReportsData(period = 'monthly') {
    try {
      const [tokenHistory, dashboardStats, usageByPeriod, topUsers] = await Promise.all([
        this.getTokenHistory(),
        this.getDashboardStats(),
        this.getUsageByPeriod(period),
        this.getTopUsers(10)
      ]);

      return {
        success: true,
        data: {
          tokenHistory: tokenHistory.data,
          dashboardStats: dashboardStats.data,
          usageByPeriod: usageByPeriod.data,
          topUsers: topUsers.data
        },
        errors: [
          !tokenHistory.success ? tokenHistory.error : null,
          !dashboardStats.success ? dashboardStats.error : null,
          !usageByPeriod.success ? usageByPeriod.error : null,
          !topUsers.success ? topUsers.error : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Erro ao buscar todos os dados de relatório:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

/**
 * Funções de Exportação
 */
export const exportService = {
  
  /**
   * Exportar dados para PDF
   * @param {Object} data - Dados dos relatórios
   * @param {string} selectedCompany - Empresa selecionada
   */
  async exportToPDF(data, selectedCompany) {
    if (!data) throw new Error('Nenhum dado disponível para exportar');
    
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Uso da Plataforma', 20, 30);
      
      // Subtítulo com empresa e data
      doc.setFontSize(12);
      doc.text(`Empresa: ${selectedCompany || 'Todas'}`, 20, 45);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 55);
      
      let yPosition = 70;
      
      // Estatísticas gerais
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          doc.setFontSize(16);
          doc.text('Estatísticas Gerais', 20, yPosition);
          yPosition += 10;
          
          const statsData = [
            ['Total de Consultas', stats.totalQueries || 0],
            ['Consultas Hoje', stats.queriesToday || 0],
            ['Consultas Esta Semana', stats.queriesThisWeek || 0],
            ['Consultas Este Mês', stats.queriesThisMonth || 0],
            ['Tokens Utilizados', stats.totalTokens || 0],
            ['Usuários Ativos', stats.activeUsers || 0]
          ];
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Métrica', 'Valor']],
            body: statsData,
            margin: { left: 20 }
          });
          
          yPosition = doc.lastAutoTable.finalY + 20;
        }
      }
      
      // Histórico de tokens por usuário
      if (data.tokenHistory && data.tokenHistory.users) {
        doc.setFontSize(16);
        doc.text('Histórico de Uso por Usuário', 20, yPosition);
        yPosition += 10;
        
        const usersData = Object.values(data.tokenHistory.users).map(user => [
          user.name || user.email,
          user.data ? user.data.reduce((sum, entry) => sum + (entry.tokens || 0), 0) : 0,
          user.data ? user.data.length : 0
        ]);
        
        if (usersData.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            head: [['Usuário', 'Total de Tokens', 'Consultas']],
            body: usersData,
            margin: { left: 20 }
          });
        }
      }
      
      const filename = `relatorio-${selectedCompany || 'geral'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error(`Erro ao exportar PDF: ${error.message}`);
    }
  },

  /**
   * Exportar dados para Excel
   * @param {Object} data - Dados dos relatórios
   * @param {string} selectedCompany - Empresa selecionada
   */
  async exportToExcel(data, selectedCompany) {
    if (!data) throw new Error('Nenhum dado disponível para exportar');
    
    try {
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.utils.book_new();
      
      // Planilha de estatísticas gerais
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          const statsData = [
            ['Métrica', 'Valor'],
            ['Total de Consultas', stats.totalQueries || 0],
            ['Consultas Hoje', stats.queriesToday || 0],
            ['Consultas Esta Semana', stats.queriesThisWeek || 0],
            ['Consultas Este Mês', stats.queriesThisMonth || 0],
            ['Tokens Utilizados', stats.totalTokens || 0],
            ['Usuários Ativos', stats.activeUsers || 0]
          ];
          
          const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
          XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
        }
      }
      
      // Planilha de usuários
      if (data.tokenHistory && data.tokenHistory.users) {
        const usersData = [['Usuário', 'Email', 'Total de Tokens', 'Consultas']];
        
        Object.values(data.tokenHistory.users).forEach(user => {
          usersData.push([
            user.name || 'N/A',
            user.email || 'N/A',
            user.data ? user.data.reduce((sum, entry) => sum + (entry.tokens || 0), 0) : 0,
            user.data ? user.data.length : 0
          ]);
        });
        
        const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
        XLSX.utils.book_append_sheet(workbook, usersSheet, 'Usuários');
      }
      
      // Planilha de uso por período
      if (data.usageByPeriod) {
        const periodData = [['Período', 'Consultas', 'Tokens']];
        
        Object.entries(data.usageByPeriod).forEach(([period, values]) => {
          if (typeof values === 'object' && values !== null) {
            periodData.push([
              period,
              values.queries || 0,
              values.tokens || 0
            ]);
          }
        });
        
        if (periodData.length > 1) {
          const usageSheet = XLSX.utils.aoa_to_sheet(periodData);
          XLSX.utils.book_append_sheet(workbook, usageSheet, 'Uso por Período');
        }
      }
      
      const filename = `relatorio-${selectedCompany || 'geral'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw new Error(`Erro ao exportar Excel: ${error.message}`);
    }
  },

  /**
   * Exportar dados para CSV
   * @param {Object} data - Dados dos relatórios
   * @param {string} selectedCompany - Empresa selecionada
   */
  async exportToCSV(data, selectedCompany) {
    if (!data) throw new Error('Nenhum dado disponível para exportar');
    
    try {
      const { saveAs } = await import('file-saver');
      
      let csvContent = 'Métrica,Valor\n';
      
      // Adicionar estatísticas gerais
      if (data.dashboardStats && selectedCompany) {
        const stats = data.dashboardStats[selectedCompany];
        if (stats) {
          csvContent += `Total de Consultas,${stats.totalQueries || 0}\n`;
          csvContent += `Consultas Hoje,${stats.queriesToday || 0}\n`;
          csvContent += `Consultas Esta Semana,${stats.queriesThisWeek || 0}\n`;
          csvContent += `Consultas Este Mês,${stats.queriesThisMonth || 0}\n`;
          csvContent += `Tokens Utilizados,${stats.totalTokens || 0}\n`;
          csvContent += `Usuários Ativos,${stats.activeUsers || 0}\n`;
        }
      }
      
      // Adicionar dados de usuários
      if (data.tokenHistory && data.tokenHistory.users) {
        csvContent += '\nUsuário,Email,Total de Tokens,Consultas\n';
        Object.values(data.tokenHistory.users).forEach(user => {
          const totalTokens = user.data ? user.data.reduce((sum, entry) => sum + (entry.tokens || 0), 0) : 0;
          const totalQueries = user.data ? user.data.length : 0;
          csvContent += `"${user.name || 'N/A'}","${user.email || 'N/A'}",${totalTokens},${totalQueries}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `relatorio-${selectedCompany || 'geral'}-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw new Error(`Erro ao exportar CSV: ${error.message}`);
    }
  }
};

export default { reportsService, exportService };
