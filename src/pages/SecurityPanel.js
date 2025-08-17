import React, { useState } from 'react';
import styled from 'styled-components';
import { FaShieldAlt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaFilter, FaDownload, FaEye, FaEyeSlash } from 'react-icons/fa';

const SecurityContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const SecurityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const SecurityIcon = styled(FaShieldAlt)`
  font-size: 2.5rem;
  color: #ffd700;
`;

const HeaderText = styled.div`
  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
  }
  p {
    margin: 5px 0 0 0;
    opacity: 0.9;
    font-size: 0.95rem;
  }
`;

const SecurityStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3b82f6'};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const StatTitle = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
`;

const StatChange = styled.div`
  font-size: 0.85rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

const FiltersContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FilterLabel = styled.label`
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  height: 36px;

  &.primary {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }

  &.secondary {
    background: #f1f5f9;
    color: #64748b;

    &:hover {
      background: #e2e8f0;
    }
  }

  &.apply {
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LogsHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogsTitle = styled.h3`
  margin: 0;
  color: #1e293b;
  font-size: 1.2rem;
`;

const LogsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const LogsTableHeader = styled.thead`
  background: #f8fafc;
`;

const LogsTableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
`;

const LogsTableCell = styled.td`
  padding: 15px 20px;
  font-size: 0.9rem;
  color: #374151;
`;

const LogsTableHeaderCell = styled.th`
  padding: 15px 20px;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: #dcfce7;
    color: #166534;
  }

  &.failed {
    background: #fee2e2;
    color: #991b1b;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const Username = styled.span`
  font-weight: 500;
  color: #1e293b;
`;

const IpAddress = styled.span`
  font-size: 0.8rem;
  color: #64748b;
`;

const Timestamp = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DateText = styled.span`
  font-weight: 500;
  color: #1e293b;
`;

const TimeText = styled.span`
  font-size: 0.8rem;
  color: #64748b;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const PaginationInfo = styled.div`
  font-size: 0.9rem;
  color: #64748b;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;



const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
`;

const EmptyIcon = styled(FaShieldAlt)`
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
`;

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
    return isSuccess ? '#10b981' : '#ef4444';
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
          <PaginationButton
            key={i}
            className={i === page ? 'active' : ''}
            onClick={() => setPage(i)}
          >
            {i}
          </PaginationButton>
        );
      }
    } else {
      // Lógica para páginas com ellipsis
      if (page <= 4) {
        // Mostrar primeiras páginas + ellipsis + última
        for (let i = 1; i <= 5; i++) {
          buttons.push(
            <PaginationButton
              key={i}
              className={i === page ? 'active' : ''}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationButton>
          );
        }
        buttons.push(<span key="ellipsis1" style={{ padding: '8px 12px', color: '#64748b' }}>...</span>);
        buttons.push(
          <PaginationButton
            key={totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationButton>
        );
      } else if (page >= totalPages - 3) {
        // Mostrar primeira + ellipsis + últimas páginas
        buttons.push(
          <PaginationButton
            key={1}
            onClick={() => setPage(1)}
          >
            1
          </PaginationButton>
        );
        buttons.push(<span key="ellipsis2" style={{ padding: '8px 12px', color: '#64748b' }}>...</span>);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          buttons.push(
            <PaginationButton
              key={i}
              className={i === page ? 'active' : ''}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationButton>
          );
        }
      } else {
        // Mostrar primeira + ellipsis + página atual + ellipsis + última
        buttons.push(
          <PaginationButton
            key={1}
            onClick={() => setPage(1)}
          >
            1
          </PaginationButton>
        );
        buttons.push(<span key="ellipsis3" style={{ padding: '8px 12px', color: '#64748b' }}>...</span>);
        for (let i = page - 1; i <= page + 1; i++) {
          buttons.push(
            <PaginationButton
              key={i}
              className={i === page ? 'active' : ''}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationButton>
          );
        }
        buttons.push(<span key="ellipsis4" style={{ padding: '8px 12px', color: '#64748b' }}>...</span>);
        buttons.push(
          <PaginationButton
            key={totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationButton>
        );
      }
    }
    
    return buttons;
  };

  if (loading) {
    return (
      <SecurityContainer>
        <LoadingState>
          <div>Carregando logs de segurança...</div>
        </LoadingState>
      </SecurityContainer>
    );
  }

  if (error) {
    return (
      <SecurityContainer>
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>
          Erro ao carregar logs de segurança: {error}
        </div>
      </SecurityContainer>
    );
  }

  return (
    <SecurityContainer>
      <SecurityHeader>
        <HeaderContent>
          <SecurityIcon />
          <HeaderText>
            <h1>Painel de Segurança</h1>
            <p>Monitoramento de acessos e atividades de autenticação</p>
          </HeaderText>
        </HeaderContent>
        <ActionButton 
          className="secondary" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <FaEyeSlash /> : <FaEye />}
          {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
        </ActionButton>
      </SecurityHeader>

      <SecurityStats>
        <StatCard color="#3b82f6">
          <StatTitle>Total de Logs</StatTitle>
          <StatValue>{stats.totalLogs}</StatValue>
          <StatChange positive={true}>+{stats.totalLogs} hoje</StatChange>
        </StatCard>
        <StatCard color="#10b981">
          <StatTitle>Logins Bem-sucedidos</StatTitle>
          <StatValue>{stats.successfulLogins}</StatValue>
          <StatChange positive={true}>{stats.successRate}% taxa de sucesso</StatChange>
        </StatCard>
        <StatCard color="#ef4444">
          <StatTitle>Logins Falhados</StatTitle>
          <StatValue>{stats.failedLogins}</StatValue>
          <StatChange positive={false}>{(100 - stats.successRate).toFixed(1)}% taxa de falha</StatChange>
        </StatCard>
        <StatCard color="#f59e0b">
          <StatTitle>Usuários Únicos</StatTitle>
          <StatValue>{stats.uniqueUsers}</StatValue>
          <StatChange positive={true}>Ativos no período</StatChange>
        </StatCard>
      </SecurityStats>

      <FiltersContainer>
        <FiltersRow>
          <FilterGroup>
            <FilterLabel>Status</FilterLabel>
            <FilterSelect value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="success">Bem-sucedidos</option>
              <option value="failed">Falhados</option>
            </FilterSelect>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel>Buscar</FilterLabel>
            <SearchInput
              type="text"
              placeholder="Usuário ou IP..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
            />
          </FilterGroup>

          <ActionButton 
            style={{ background: '#10b981', color: 'white' }}
            onClick={handleApplyFilters}
          >
            <FaFilter />
            Aplicar Filtros
          </ActionButton>

          <ActionButton 
            className="secondary" 
            onClick={handleResetFilters}
          >
            Limpar
          </ActionButton>

          <ActionButton className="primary" onClick={handleExport}>
            <FaDownload />
            Exportar CSV
          </ActionButton>
        </FiltersRow>
      </FiltersContainer>

      <LogsContainer>
        <LogsHeader>
          <LogsTitle>Logs de Autenticação</LogsTitle>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {filteredLogs.length} registros encontrados
          </div>
        </LogsHeader>

        {filteredLogs.length === 0 ? (
          <EmptyState>
            <EmptyIcon />
            <h3>Nenhum log encontrado</h3>
            <p>Tente ajustar os filtros ou verificar se há dados disponíveis</p>
          </EmptyState>
        ) : (
          <>
            <LogsTable>
              <LogsTableHeader>
                <LogsTableRow>
                  <LogsTableHeaderCell>Usuário</LogsTableHeaderCell>
                  <LogsTableHeaderCell>Endereço IP</LogsTableHeaderCell>
                  <LogsTableHeaderCell>Status</LogsTableHeaderCell>
                  <LogsTableHeaderCell>Data/Hora</LogsTableHeaderCell>
                  {showDetails && <LogsTableHeaderCell>Detalhes</LogsTableHeaderCell>}
                </LogsTableRow>
              </LogsTableHeader>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const { date, time } = formatDate(log.timestamp);
                  const isSuccess = log.success === 1 || log.success === true || log.status === 'success';
                  return (
                    <LogsTableRow key={log.id || index}>
                      <LogsTableCell>
                        <UserInfo>
                          <UserAvatar color={getStatusColor(log)}>
                            {getInitials(log.username)}
                          </UserAvatar>
                          <UserDetails>
                            <Username>{log.username}</Username>
                            <IpAddress>ID: {log.id}</IpAddress>
                          </UserDetails>
                        </UserInfo>
                      </LogsTableCell>
                      <LogsTableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaMapMarkerAlt style={{ color: '#64748b', fontSize: '0.8rem' }} />
                          {log.ip_address}
                        </div>
                      </LogsTableCell>
                      <LogsTableCell>
                        <StatusBadge className={isSuccess ? 'success' : 'failed'}>
                          {isSuccess ? <FaCheckCircle /> : <FaTimesCircle />}
                          {getStatusText(log)}
                        </StatusBadge>
                      </LogsTableCell>
                      <LogsTableCell>
                        <Timestamp>
                          <DateText>{date}</DateText>
                          <TimeText>{time}</TimeText>
                        </Timestamp>
                      </LogsTableCell>
                      {showDetails && (
                        <LogsTableCell>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            <div>Success: {log.success ? 'Sim' : 'Não'}</div>
                            <div>Status: {log.status || 'N/A'}</div>
                            <div>ID: {log.id}</div>
                          </div>
                        </LogsTableCell>
                      )}
                    </LogsTableRow>
                  );
                })}
              </tbody>
            </LogsTable>

            <PaginationContainer>
              <PaginationInfo>
                Mostrando {filteredLogs.length} de {totalItems} registros
              </PaginationInfo>
              <PaginationControls>
                <PaginationButton
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </PaginationButton>
                
                {renderPaginationButtons()}
                
                <PaginationButton
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Próximo
                </PaginationButton>
              </PaginationControls>
            </PaginationContainer>
          </>
        )}
      </LogsContainer>
    </SecurityContainer>
  );
} 