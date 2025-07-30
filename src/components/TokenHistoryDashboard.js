import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// CSS-in-JS para responsividade e hover
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    margin: 0,
    width: '100%',
    maxWidth: 900,
  },
  gridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    margin: 0,
    width: '100%',
    maxWidth: 900,
  },
  card: {
    background: 'white',
    padding: '1.2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    height: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minWidth: 0,
    transition: 'box-shadow 0.2s',
    overflow: 'hidden',
    cursor: 'default',
  },
  cardHover: {
    boxShadow: '0 4px 16px rgba(59,130,246,0.10)',
  },
  title: {
    margin: '0 0 0.8rem 0',
    color: '#334155',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto 2rem auto',
  },
  summaryCard: (bg) => ({
    background: bg,
    color: 'white',
    padding: '0.8rem',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 600,
    minWidth: 0,
  }),
  chartCard: {
    background: 'white',
    padding: '1.5rem 1.2rem 1.2rem 1.2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    marginBottom: '1.5rem',
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minWidth: 0,
    overflow: 'hidden',
  },
  chartTitle: {
    margin: '0 0 1rem 0',
    color: '#334155',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  grid2x2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
  },
  gridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
  },
  filterContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    color: '#334155',
    fontSize: '0.9rem',
    minWidth: '200px',
    cursor: 'pointer',
  },
  filterLabel: {
    fontSize: '0.9rem',
    color: '#64748b',
    fontWeight: 600,
    marginRight: '0.5rem',
  },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 800);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const TokenHistoryDashboard = ({ layout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedUser, setSelectedUser] = useState('all');
  const [hovered, setHovered] = useState(-1);
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("TokenHistoryDashboard montado");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://138.197.27.151:5000/api/report/token-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      console.log("Resposta do relatório:", response.data);
      if (response.data.success) {
        setData(response.data.data);
        // Selecionar primeira empresa por padrão
        const firstCompany = Object.keys(response.data.data.companies)[0];
        setSelectedCompany(firstCompany);
      }
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para processar dados e criar gráficos agregados
  const processAggregatedData = (rawData) => {
    if (!rawData || !rawData.companies) return null;
    
    console.log("----- Iniciando processamento de dados -----");
    console.log("Dados brutos recebidos:", rawData);
    console.log("Empresa selecionada:", selectedCompany);

    const allTokens = [];
    const companyData = rawData.companies[selectedCompany] || [];
    console.log("Dados da empresa:", companyData);
    
    // Coletar todos os dados de tokens com filtro por usuário
    companyData.forEach(user => {
      console.log(`Processando usuário: ${user.name} (ID: ${user.userId})`);
      if (selectedUser !== 'all' && user.userId !== parseInt(selectedUser)) {
        console.log("Usuário pulado pelo filtro.");
        return;
      }
      
      if (user.data && Array.isArray(user.data)) {
        console.log(`Encontrados ${user.data.length} registros para o usuário ${user.name}`);
        user.data.forEach(entry => {
          allTokens.push({
            tokens: entry.tokens,
            date: new Date(entry.date),
            user: user.name
          });
        });
      }
    });

    console.log(`Tamanho final de allTokens: ${allTokens.length}`);
    console.log("------------------------------------------");

    // Calcular totais ANTES de qualquer filtro de data
    const totalTokens = allTokens.reduce((sum, entry) => sum + entry.tokens, 0);
    const totalRequests = allTokens.length;
    const averagePerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

    // Calcular médias
    const calculateAverage = (values) => {
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

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

    // Agrupar por semana (últimas 4 semanas)
    const weeklyData = {};
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekKey = `Semana ${4-i}`;
      weeklyData[weekKey] = [];
      
      allTokens.forEach(entry => {
        if (entry.date >= weekStart && entry.date <= weekEnd) {
          weeklyData[weekKey].push(entry.tokens);
        }
      });
    }

    // Agrupar por mês (últimos 6 meses)
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = [];
      
      allTokens.forEach(entry => {
        if (entry.date.getMonth() === month.getMonth() && 
            entry.date.getFullYear() === month.getFullYear()) {
          monthlyData[monthKey].push(entry.tokens);
        }
      });
    }

    // Filtrar labels e dados para mostrar só onde há dados
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
    const weekly = filterNonZero(
      Object.keys(weeklyData),
      Object.values(weeklyData).map(values => calculateAverage(values))
    );
    const monthly = filterNonZero(
      Object.keys(monthlyData),
      Object.values(monthlyData).map(values => calculateAverage(values))
    );

    return {
      hourly,
      daily,
      weekly,
      monthly,
      totalTokens: totalTokens,
      totalRequests: totalRequests,
      averagePerRequest: averagePerRequest
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11 } }
      },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.07)' }
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.04)' }
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>Erro: {error}</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Nenhum dado disponível</div>;

  const aggregatedData = processAggregatedData(data);
  if (!aggregatedData) return <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Dados insuficientes</div>;

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
      label: 'Consumo Médio por Dia da Semana',
      data: aggregatedData.daily.data,
      backgroundColor: [
        '#60a5fa', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#a3e635'
      ],
      borderWidth: 1
    }]
  };

  const weeklyChartData = {
    labels: aggregatedData.weekly.labels,
    datasets: [{
      label: 'Consumo Médio Semanal',
      data: aggregatedData.weekly.data,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.12)',
      tension: 0.4,
      pointRadius: 3
    }]
  };

  const monthlyChartData = {
    labels: aggregatedData.monthly.labels,
    datasets: [{
      label: 'Consumo Médio Mensal',
      data: aggregatedData.monthly.data,
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168,85,247,0.12)',
      tension: 0.4,
      pointRadius: 3
    }]
  };

  // Layout dos gráficos
  if (layout === 'grid') {
    const gridStyle = isMobile ? styles.gridMobile : styles.grid2x2;
    
    // Obter lista de usuários da empresa selecionada
    const companyUsers = data?.companies?.[selectedCompany] || [];
    
    return (
      <div style={{ width: '100%' }}>
        {/* Filtros */}
        <div style={styles.filterContainer}>
          <div style={styles.filterLabel}>Filtrar por usuário:</div>
          <select 
            style={styles.filterSelect}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">Todos os usuários</option>
            {companyUsers.map(user => (
              <option key={user.userId} value={user.userId}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        
        {/* Resumo Estatístico */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard('linear-gradient(135deg, #3b82f6, #1d4ed8)')}>
            <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>Total de Tokens</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{aggregatedData.totalTokens.toLocaleString()}</div>
          </div>
          <div style={styles.summaryCard('linear-gradient(135deg, #10b981, #059669)')}>
            <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>Total de Requisições</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{aggregatedData.totalRequests.toLocaleString()}</div>
          </div>
          <div style={styles.summaryCard('linear-gradient(135deg, #f59e0b, #d97706)')}>
            <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>Média por Requisição</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(aggregatedData.averagePerRequest)}</div>
          </div>
        </div>
        {/* Gráficos em grid 2x2 */}
        <div style={gridStyle}>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Consumo Médio por Hora</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Line data={hourlyChartData} options={chartOptions} />
            </div>
          </div>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Consumo por Dia da Semana</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Bar data={dailyChartData} options={chartOptions} />
            </div>
          </div>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Consumo Médio Semanal</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Line data={weeklyChartData} options={chartOptions} />
            </div>
          </div>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Consumo Médio Mensal</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout padrão (grid 2x2)
  return (
    <div style={{ width: '100%' }}>
      {/* Filtros */}
      <div style={styles.filterContainer}>
        <div style={styles.filterLabel}>Filtrar por usuário:</div>
        <select 
          style={styles.filterSelect}
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="all">Todos os usuários</option>
          {(data?.companies?.[selectedCompany] || []).map(user => (
            <option key={user.userId} value={user.userId}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      
      {/* Resumo Estatístico */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard('linear-gradient(135deg, #3b82f6, #1d4ed8)')}>
          <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>Total de Tokens</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{aggregatedData.totalTokens.toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard('linear-gradient(135deg, #10b981, #059669)')}>
          <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>Total de Requisições</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{aggregatedData.totalRequests.toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard('linear-gradient(135deg, #f59e0b, #d97706)')}>
          <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>Média por Requisição</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{Math.round(aggregatedData.averagePerRequest)}</div>
        </div>
      </div>
      
      {/* Gráficos em grid 2x2 */}
      <div style={isMobile ? styles.gridMobile : styles.grid2x2}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Consumo Médio por Hora</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Line data={hourlyChartData} options={chartOptions} />
          </div>
        </div>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Consumo por Dia da Semana</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Consumo Médio Semanal</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Line data={weeklyChartData} options={chartOptions} />
          </div>
        </div>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Consumo Médio Mensal</div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Line data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenHistoryDashboard; 