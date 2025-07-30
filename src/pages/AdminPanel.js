import React, { useState, useEffect, useCallback } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSignOutAlt,
  FaCoins,
  FaUserShield,
  FaArrowLeft,
  FaCog,
  FaDatabase,
  FaServer,
  FaChartLine,
  FaUsers,
  FaLock,
  FaFileAlt,
  FaBell,
  FaSearch,
  FaUserPlus,
  FaExclamation,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Estilos globais para as fontes
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Componentes estilizados
const Container = styled.div`
  padding: 2rem;
  min-height: 100vh;
  background: #2B2B2B;
  color: #DFDFDF;
  width: 100%;
  font-family: 'Inter', sans-serif;
`;

const Card = styled.div`
  background: #DFDFDF;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #ADADAD;
  margin-bottom: 2rem;
  width: 100%;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop)
})`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${props => 
    props.variant === 'primary' ? '#8C4B35' : 
    props.variant === 'secondary' ? '#ADADAD' :
    props.variant === 'danger' ? '#ef4444' :
    'transparent'};
  color: ${props => 
    props.variant === 'primary' ? 'white' : 
    props.variant === 'secondary' ? '#2B2B2B' :
    props.variant === 'danger' ? 'white' :
    '#2B2B2B'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => 
      props.variant === 'primary' ? '#2B2B2B' : 
      props.variant === 'secondary' ? '#8C4B35' :
      props.variant === 'danger' ? '#dc2626' :
      '#ADADAD'};
    color: ${props => 
      props.variant === 'primary' ? 'white' : 
      props.variant === 'secondary' ? 'white' :
      props.variant === 'danger' ? 'white' :
      '#2B2B2B'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #DFDFDF;
  border-radius: 8px;
  overflow: hidden;
  table-layout: fixed;
  font-family: 'Roboto', sans-serif;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ADADAD;
    color: #2B2B2B;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    background: #2B2B2B;
    color: #DFDFDF;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
  }

  th:nth-child(1) { width: 20%; } /* Nome */
  th:nth-child(2) { width: 25%; } /* Email */
  th:nth-child(3) { width: 15%; } /* Função */
  th:nth-child(4) { width: 15%; } /* Plano */
  th:nth-child(5) { width: 10%; } /* Créditos */
  th:nth-child(6) { width: 15%; } /* Ações */

  tr:hover {
    background: rgba(140, 75, 53, 0.1);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const IconButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop)
})`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: ${props => props.variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 
               props.variant === 'primary' ? 'rgba(59, 130, 246, 0.1)' :
               props.variant === 'success' ? 'rgba(16, 185, 129, 0.1)' :
               'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.variant === 'danger' ? '#ef4444' : 
          props.variant === 'primary' ? '#3b82f6' :
          props.variant === 'success' ? '#10b981' :
          '#64748b'};
  border: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Inter', sans-serif;
  
  svg {
    color: #3b82f6;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  padding: 0 1rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  color: #64748b;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
  color: ${props => props.role === 'admin' ? '#3b82f6' : '#10b981'};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #64748b;
  font-weight: 500;
  font-family: 'Roboto', sans-serif;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  transition: border 0.2s ease;
  font-family: 'Roboto', sans-serif;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-family: 'Roboto', sans-serif;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;



const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

// Novos componentes para análise de dados
const StatContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
  padding: 0 1rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#334155'};
  font-family: 'Inter', sans-serif;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-family: 'Roboto', sans-serif;
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1rem;
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: ${props => props['data-active'] ? '#3b82f6' : '#64748b'};
  font-weight: ${props => props['data-active'] ? '600' : '400'};
  border-bottom: 2px solid ${props => props['data-active'] ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #3b82f6;
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
`;

const BarChart = styled.div`
  position: absolute;
  bottom: 0;
  width: ${props => props.width || '8%'};
  height: ${props => props.height || '50%'};
  background: ${props => props.color || '#3b82f6'};
  left: ${props => props.position || '0'};
  border-radius: 6px 6px 0 0;
  transition: height 1s ease;
  
  &::after {
    content: '${props => props.value || ''}';
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: #334155;
    font-weight: bold;
  }
`;

const AxisLabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 4%;
  margin-top: 0.5rem;
`;

const AxisLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  width: 8%;
`;

const SettingSection = styled.div`
  margin-bottom: 2rem;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #334155;
  font-family: 'Inter', sans-serif;
`;

const SettingDescription = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  font-family: 'Roboto', sans-serif;
`;

const ToggleSwitch = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  background: ${props => props['data-active'] ? '#3b82f6' : '#e2e8f0'};
  position: relative;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props['data-active'] ? '26px' : '2px'};
    transition: left 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const SelectInput = styled.select`
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: #334155;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const UserListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: ${props => props.style?.background || 'transparent'};
`;

const UserName = styled.span`
  font-size: ${props => props.style?.fontSize || 'inherit'};
`;

const Content = styled.div`
  margin-top: 2rem;
  padding: 0 1rem;
`;

// Componentes para paginação e filtragem
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SortableTh = styled.th`
  text-align: left;
  padding: 1rem;
  color: #64748b;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  user-select: none;
  position: relative;
  
  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }
  
  &::after {
    content: '↕';
    position: absolute;
    right: 0.5rem;
    opacity: 0.5;
    font-size: 0.75rem;
  }
  
  &.sorted-asc::after {
    content: '↑';
    opacity: 1;
    color: #3b82f6;
  }
  
  &.sorted-desc::after {
    content: '↓';
    opacity: 1;
    color: #3b82f6;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const PaginationInfo = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
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

const ItemsPerPageSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ItemsPerPageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { 
    logout, 
    currentUser, 
    users, 
    addUser, 
    updateUser, 
    removeUser, 
    addCredits, 
    changePlan, 
    loadUsers,
    hasAdminAccess,
    getCurrentPlanData,
    getSystemSettings,
    saveSystemSettings,
    resetSystemSettings,
    getSettingsHistory,
    api
  } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estados para paginação, ordenação e filtragem
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Funções para filtragem, ordenação e paginação
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset para primeira página ao ordenar
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao pesquisar
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset para primeira página ao mudar itens por página
  };

  const filterAndSortUsers = useCallback(() => {
    if (!users || users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.role && user.role.toLowerCase().includes(term)) ||
        (user.plan_id && subscriptionPlans[user.plan_id]?.name.toLowerCase().includes(term)) ||
        (user.plan && subscriptionPlans[user.plan]?.name.toLowerCase().includes(term)) ||
        (user.credits && user.credits.toString().includes(term))
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'role':
          aValue = (a.role || '').toLowerCase();
          bValue = (b.role || '').toLowerCase();
          break;
        case 'plan':
          aValue = (subscriptionPlans[a.plan_id || a.plan]?.name || '').toLowerCase();
          bValue = (subscriptionPlans[b.plan_id || b.plan]?.name || '').toLowerCase();
          break;
        case 'credits':
          aValue = parseInt(a.credits || 0);
          bValue = parseInt(b.credits || 0);
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortField, sortDirection]);

  // Calcular dados de paginação
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Atualizar usuários filtrados quando mudar os filtros
  useEffect(() => {
    filterAndSortUsers();
  }, [filterAndSortUsers]);

  // Reset para primeira página quando mudar de aba
  useEffect(() => {
    if (activeTab === 'users') {
      setCurrentPage(1);
      setSearchTerm('');
      // Não resetar a ordenação aqui para manter a consistência
    }
  }, [activeTab]);

  // Load users only once when component mounts or when tab changes to users
  useEffect(() => {
    const initializeAdmin = async () => {
      if (!isInitialized && currentUser) {
        await loadUsers(true); // Força refresh na inicialização
        setIsInitialized(true);
        // Reset ordenação apenas na primeira carga
        if (isFirstLoad) {
          setSortField('name');
          setSortDirection('asc');
          setIsFirstLoad(false);
        }
      }
    };
    
    initializeAdmin();
  }, [currentUser, isInitialized, loadUsers, isFirstLoad]);

  // Recarregar usuários quando mudar para a aba de usuários
  useEffect(() => {
    if (activeTab === 'users' && isInitialized && (!users || users.length === 0)) {
      loadUsers(true); // Força refresh para garantir dados corretos
    }
  }, [activeTab, isInitialized, loadUsers, users]);
  
  // Monitorar mudanças no estado users
  useEffect(() => {
    console.log('DEBUG: Estado users mudou:', users.length, 'usuários');
  }, [users]);
  
  // Carregar configurações quando mudar para a aba de configurações
  useEffect(() => {
    if (activeTab === 'settings' && isInitialized) {
      loadSystemSettings();
    }
  }, [activeTab, isInitialized]);
  
  // Check admin access after initialization
  useEffect(() => {
    if (isInitialized && currentUser && !hasAdminAccess()) {
      toast.error("Você não tem permissão para acessar o painel de administração");
      navigate('/');
    }
  }, [currentUser, hasAdminAccess, isInitialized, navigate]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user',
    credits: 0,
    plan: 'FREE_TRIAL',
    company_id: ''
  });
  
  const [creditsAmount, setCreditsAmount] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState('');
  
  // Estados de validação
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para empresas (apenas para superadmin)
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    newUserNotifications: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    defaultCredits: 100,
    maintenanceMode: false,
    backupFrequency: 'daily',
    dataPurgePolicy: '90days',
    auditLogs: true,
    loginAttempts: 5,
    sessionTimeout: 30
  });
  
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  
  // Dados simulados para gráficos
  const usageData = {
    totalUsers: users?.length || 0,
    activeUsers: users?.length ? Math.round(users.length * 0.8) : 0,
    usersWithAdminAccess: users?.filter(u => u.role === 'admin')?.length || 0,
    totalCreditsIssued: users?.reduce((sum, user) => sum + (user.credits || 0), 0) || 0,
    
    weeklyActiveUsers: [24, 28, 32, 36, 42, 38, 45],
    creditUsageByDay: [120, 85, 140, 95, 170, 80, 110],
    
    // Distribuição por tipo de consulta
    queryTypes: {
      'Consultas Jurídicas': 48,
      'Análise Documental': 22,
      'Modelagem de Contratos': 15,
      'Pesquisa de Jurisprudência': 10,
      'Outros': 5
    }
  };
  
  // Definir subscriptionPlans com cores e nomes
  const subscriptionPlans = {
    FREE_TRIAL: { 
      name: 'Free Trial',
      color: '#64748b'
    },
    STANDARD: { 
      name: 'Standard',
      color: '#3b82f6'
    },
    PRO: { 
      name: 'Profissional',
      color: '#10b981'
    }
  };
  
  // Função para carregar empresas (apenas para superadmin)
  const loadCompanies = async () => {
    if (currentUser?.role !== 'superadmin') return;
    
    setIsLoadingCompanies(true);
    try {
      const response = await api.get('/companies');
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar lista de empresas');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  // Carregar empresas quando o componente inicializar (apenas para superadmin)
  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      loadCompanies();
    }
  }, [currentUser?.role]);

  // Função para verificar se o usuário pode editar/excluir outro usuário
  const canEditUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    // Superadmin pode editar qualquer usuário
    if (currentUser.role === 'superadmin') return true;
    
    // Admin pode editar usuários da mesma empresa
    if (currentUser.role === 'admin' && targetUser.company_id === currentUser.company_id) return true;
    
    return false;
  };

  // Função para verificar se o usuário pode excluir outro usuário
  const canDeleteUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    // Não pode deletar a si mesmo
    if (currentUser.email === targetUser.email) return false;
    
    // Superadmin pode deletar qualquer usuário (exceto a si mesmo)
    if (currentUser.role === 'superadmin') return true;
    
    // Admin pode deletar usuários da mesma empresa (exceto a si mesmo)
    if (currentUser.role === 'admin' && targetUser.company_id === currentUser.company_id) return true;
    
    return false;
  };

  const openAddModal = () => {
    setModalType('add');
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user',
      credits: 0,
      plan: 'FREE_TRIAL',
      company_id: currentUser?.role === 'superadmin' ? '' : currentUser?.company_id || ''
    });
    setValidationErrors({});
    setIsSubmitting(false);
    setModalOpen(true);
  };
  
  const openEditModal = (user) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Por questões de segurança, não preenchemos a senha
      name: user.name,
      role: user.role || 'user',
      credits: user.credits || 0,
      plan: user.plan_id || user.plan || 'FREE_TRIAL',
      company_id: user.company_id || ''
    });
    setModalOpen(true);
  };
  
  const openCreditsModal = (user) => {
    setModalType('credits');
    setSelectedUser(user);
    setCreditsAmount(100);
    setModalOpen(true);
  };
  
  const openPlanModal = (user) => {
    setModalType('plan');
    setSelectedUser(user);
    setSelectedPlan(user.plan_id || user.plan || 'FREE_TRIAL');
    setModalOpen(true);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro de validação quando o usuário começar a digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleSubmit = async () => {
    if (modalType === 'add') {
      // Limpar erros anteriores
      setValidationErrors({});
      
      // Validações básicas
      const errors = {};
      
      if (!formData.email) {
        errors.email = 'Email é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.email = 'Formato de email inválido';
        }
      }
      
      if (!formData.password) {
        errors.password = 'Senha é obrigatória';
      } else if (formData.password.length < (systemSettings.minPasswordLength || 6)) {
        errors.password = `A senha deve ter pelo menos ${systemSettings.minPasswordLength || 6} caracteres`;
      }
      
      if (!formData.name) {
        errors.name = 'Nome é obrigatório';
      } else if (formData.name.trim().length < 2) {
        errors.name = 'O nome deve ter pelo menos 2 caracteres';
      }
      
      // Validação para empresa (apenas para superadmin)
      if (currentUser?.role === 'superadmin' && !formData.company_id) {
        errors.company_id = 'Empresa é obrigatória';
      }
      
      // Se há erros de validação, exibir e parar
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const result = await addUser({
          ...formData,
          credits: Number(formData.credits)
        });
        
        if (result.success) {
          toast.success('Usuário adicionado com sucesso!');
          setModalOpen(false);
          // Limpar o formulário e erros
          setFormData({
            email: '',
            password: '',
            name: '',
            role: 'user',
            credits: 0,
            plan: 'FREE_TRIAL',
            company_id: ''
          });
          setValidationErrors({});
          console.log('DEBUG: Chamando loadUsers após adicionar usuário');
          await loadUsers(true); // Recarregar a lista após adicionar
          console.log('DEBUG: loadUsers concluído');
        } else {
          toast.error(result.message || 'Não foi possível adicionar o usuário');
        }
      } catch (error) {
        toast.error('Erro inesperado ao adicionar usuário');
      } finally {
        setIsSubmitting(false);
      }
    } else if (modalType === 'edit') {
      setIsSubmitting(true);
      
      try {
        // Tratamos o caso da senha vazia (não modificar)
        const updates = { ...formData };
        if (!updates.password) delete updates.password;
        
        // Mapear 'plan' para 'plan_id' para compatibilidade com o backend
        if (updates.plan) {
          updates.plan_id = updates.plan;
          delete updates.plan;
        }
        

        
        console.log('DEBUG: Enviando atualização do usuário:', {
          ...updates,
          credits: Number(updates.credits)
        });
        
        const result = await updateUser(selectedUser.email, {
          ...updates,
          credits: Number(updates.credits)
        });
        
        if (result.success) {
          toast.success('Usuário atualizado com sucesso');
          setModalOpen(false);
          loadUsers(true); // Recarregar a lista após atualizar
        } else {
          toast.error(result.message || 'Não foi possível atualizar o usuário');
        }
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast.error('Erro inesperado ao atualizar usuário');
      } finally {
        setIsSubmitting(false);
      }
    } else if (modalType === 'credits') {
      setIsSubmitting(true);
      
      try {
        const result = await addCredits(selectedUser.email, Number(creditsAmount));
        
        if (result.success) {
          toast.success(`${creditsAmount} créditos adicionados com sucesso para ${selectedUser.name}`);
          setModalOpen(false);
          loadUsers(true); // Recarregar a lista após adicionar créditos
        } else {
          toast.error(result.message || 'Não foi possível adicionar créditos');
        }
      } catch (error) {
        console.error('Erro ao adicionar créditos:', error);
        toast.error('Erro inesperado ao adicionar créditos');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleChangePlan = async () => {
    if (selectedUser && selectedPlan) {
      setIsSubmitting(true);
      
      try {
        const result = await changePlan(selectedUser.email, selectedPlan);
        
        if (result.success) {
          toast.success(`Plano alterado para ${subscriptionPlans[selectedPlan]?.name || selectedPlan}`);
          setModalOpen(false);
          loadUsers(true); // Recarregar a lista após alterar o plano
        } else {
          toast.error(result.message || 'Não foi possível alterar o plano');
        }
      } catch (error) {
        console.error('Erro ao alterar plano:', error);
        toast.error('Erro inesperado ao alterar plano');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleDeleteUser = async (email) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      const result = await removeUser(email);
      
      if (result.success) {
        toast.success('Usuário removido com sucesso');
        loadUsers(true); // Recarregar a lista após remover
      } else {
        toast.error(result.message || 'Não foi possível remover o usuário');
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSettingToggle = async (setting) => {
    const newValue = !systemSettings[setting];
    
    try {
      const result = await saveSystemSettings({ [setting]: newValue });
      
      if (result.success) {
        setSystemSettings(prev => ({
          ...prev,
          [setting]: newValue
        }));
        
        // Mostrar feedback ao usuário
        const settingNames = {
          newUserNotifications: 'Notificações de novos usuários',
          requireEmailVerification: 'Verificação de email',
          maintenanceMode: 'Modo de manutenção',
          backupFrequency: 'Frequência de backup',
          auditLogs: 'Logs de auditoria'
        };
        
        toast.success(`${settingNames[setting] || setting} ${newValue ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        toast.error(result.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error('Error saving setting:', error);
    }
  };
  
  const loadSystemSettings = async () => {
    if (isLoadingSettings) return;
    
    setIsLoadingSettings(true);
    try {
      const result = await getSystemSettings();
      if (result.success) {
        setSystemSettings(result.data);
      } else {
        toast.error('Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      const result = await saveSystemSettings({ [setting]: value });
      
      if (result.success) {
        setSystemSettings(prev => ({
          ...prev,
          [setting]: value
        }));
        
        // Mostrar feedback ao usuário
        const settingNames = {
          minPasswordLength: 'Comprimento mínimo de senha',
          backupFrequency: 'Frequência de backup',
          dataPurgePolicy: 'Política de limpeza de dados',
          loginAttempts: 'Limite de tentativas de login',
          sessionTimeout: 'Timeout de sessão'
        };
        
        toast.success(`${settingNames[setting] || setting} atualizado para: ${value}`);
      } else {
        toast.error(result.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error('Error saving setting:', error);
    }
  };
  
  const renderModal = () => {
    if (!modalOpen) return null;
    
    return (
      <Modal>
        <ModalContent>
          <h2>
            {modalType === 'add' ? 'Adicionar Usuário' :
             modalType === 'edit' ? 'Editar Usuário' :
             modalType === 'credits' ? 'Adicionar Créditos' :
             'Alterar Plano'}
          </h2>
          
          {modalType === 'plan' ? (
            <FormGroup>
              <Label htmlFor="plan">Plano</Label>
              <Select
                id="plan"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                {Object.keys(subscriptionPlans).map(planKey => (
                  <option key={planKey} value={planKey}>
                    {subscriptionPlans[planKey].name}
                  </option>
                ))}
              </Select>
            </FormGroup>
          ) : modalType === 'credits' ? (
            <FormGroup>
              <Label htmlFor="creditsAmount">Quantidade de Créditos</Label>
              <Input
                type="number"
                id="creditsAmount"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                min="1"
              />
            </FormGroup>
          ) : (
            <>
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={modalType === 'edit'}
                  style={{ 
                    borderColor: validationErrors.email ? '#ef4444' : undefined 
                  }}
                />
                {validationErrors.email && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {validationErrors.email}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="password">
                  Senha{modalType === 'edit' ? ' (deixe em branco para não alterar)' : ''}
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={modalType === 'add'}
                  style={{ 
                    borderColor: validationErrors.password ? '#ef4444' : undefined 
                  }}
                />
                {validationErrors.password && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {validationErrors.password}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="name">Nome</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ 
                    borderColor: validationErrors.name ? '#ef4444' : undefined 
                  }}
                />
                {validationErrors.name && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {validationErrors.name}
                  </div>
                )}
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="role">Papel</Label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </Select>
              </FormGroup>
              
              {/* Campo de empresa - apenas para superadmin ou editável para admin */}
              {currentUser?.role === 'superadmin' ? (
                <FormGroup>
                  <Label htmlFor="company_id">Empresa</Label>
                  <Select
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    required
                    disabled={isLoadingCompanies}
                    style={{ 
                      borderColor: validationErrors.company_id ? '#ef4444' : undefined 
                    }}
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map(company => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.name}
                      </option>
                    ))}
                  </Select>
                  {validationErrors.company_id && (
                    <div style={{ 
                      color: '#ef4444', 
                      fontSize: '0.875rem', 
                      marginTop: '0.25rem' 
                    }}>
                      {validationErrors.company_id}
                    </div>
                  )}
                  {isLoadingCompanies && (
                    <div style={{ 
                      color: '#64748b', 
                      fontSize: '0.875rem', 
                      marginTop: '0.25rem' 
                    }}>
                      Carregando empresas...
                    </div>
                  )}
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label htmlFor="company_id">Empresa</Label>
                  <Input
                    type="text"
                    id="company_id"
                    name="company_id"
                    value={currentUser?.company_name || 'Sua empresa'}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                  />
                </FormGroup>
              )}
              
              <FormGroup>
                <Label htmlFor="plan">Plano</Label>
                <Select
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                >
                  {Object.keys(subscriptionPlans).map(planKey => (
                    <option key={planKey} value={planKey}>
                      {subscriptionPlans[planKey].name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="credits">Créditos Iniciais</Label>
                <Input
                  type="number"
                  id="credits"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="0"
                />
              </FormGroup>
            </>
          )}
          
          <ModalActions>
            <Button 
              onClick={() => setModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={
                modalType === 'plan' 
                  ? handleChangePlan 
                  : handleSubmit
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div style={{ 
                    display: 'inline-block', 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid transparent', 
                    borderTop: '2px solid currentColor', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }} />
                  {modalType === 'add' ? 'Adicionando...' : 
                   modalType === 'edit' ? 'Salvando...' : 
                   modalType === 'credits' ? 'Adicionando...' :
                   'Alterando...'}
                </>
              ) : (
                modalType === 'add' ? 'Adicionar' : 
                modalType === 'edit' ? 'Salvar' : 
                modalType === 'credits' ? 'Adicionar Créditos' :
                'Alterar Plano'
              )}
            </Button>
          </ModalActions>
        </ModalContent>
      </Modal>
    );
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <Card>
            <CardTitle>
              <FaUsers />
              Lista de Usuários
            </CardTitle>
            
            <SearchContainer>
              <FaSearch style={{ color: '#64748b' }} />
              <SearchInput
                type="text"
                placeholder="Pesquisar usuários por nome, email, função, plano ou créditos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </SearchContainer>
            
            <Table>
              <thead>
                <tr>
                  <SortableTh 
                    onClick={() => handleSort('name')}
                    className={sortField === 'name' ? `sorted-${sortDirection}` : ''}
                  >
                    Nome
                  </SortableTh>
                  <SortableTh 
                    onClick={() => handleSort('email')}
                    className={sortField === 'email' ? `sorted-${sortDirection}` : ''}
                  >
                    Email
                  </SortableTh>
                  <SortableTh 
                    onClick={() => handleSort('role')}
                    className={sortField === 'role' ? `sorted-${sortDirection}` : ''}
                  >
                    Função
                  </SortableTh>
                  <SortableTh 
                    onClick={() => handleSort('plan')}
                    className={sortField === 'plan' ? `sorted-${sortDirection}` : ''}
                  >
                    Plano
                  </SortableTh>
                  <SortableTh 
                    onClick={() => handleSort('credits')}
                    className={sortField === 'credits' ? `sorted-${sortDirection}` : ''}
                  >
                    Créditos
                  </SortableTh>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {!currentUsers || currentUsers.length === 0 ? (
                  <tr>
                    <Td colSpan="6" style={{ textAlign: 'center' }}>
                      {searchTerm ? 'Nenhum usuário encontrado com os critérios de pesquisa' : 'Nenhum usuário encontrado'}
                    </Td>
                  </tr>
                ) : (
                  currentUsers.map(user => (
                    <Tr key={user.email || user.user_id}>
                      <Td>{user.name || 'N/A'}</Td>
                      <Td>{user.email || 'N/A'}</Td>
                      <Td>
                        <Badge role={user.role}>
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          style={{ 
                            background: `${subscriptionPlans[user.plan_id || user.plan]?.color || '#64748b'}20`, 
                            color: subscriptionPlans[user.plan_id || user.plan]?.color || '#64748b'
                          }}
                        >
                          {subscriptionPlans[user.plan_id || user.plan]?.name || 'Free Trial'}
                        </Badge>
                      </Td>
                      <Td>{user.credits || 0}</Td>
                      <Td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {canEditUser(user) && (
                            <>
                              <IconButton 
                                variant="primary"
                                onClick={() => openEditModal(user)}
                              >
                                <FaEdit />
                              </IconButton>
                              <IconButton 
                                variant="primary"
                                onClick={() => openCreditsModal(user)}
                              >
                                <FaCoins />
                              </IconButton>
                              <IconButton 
                                variant="primary"
                                onClick={() => openPlanModal(user)}
                              >
                                <FaUserShield />
                              </IconButton>
                            </>
                          )}
                          {canDeleteUser(user) && (
                            <IconButton 
                              variant="danger"
                              onClick={() => handleDeleteUser(user.email)}
                            >
                              <FaTrash />
                            </IconButton>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>

            <PaginationContainer>
              <PaginationInfo>
                {totalItems > 0 ? `${startIndex + 1} - ${Math.min(endIndex, totalItems)} de ${totalItems} usuários` : 'Nenhum usuário encontrado'}
              </PaginationInfo>
              {totalPages > 1 && (
                <PaginationButtons>
                  <PaginationButton 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </PaginationButton>
                  
                  {/* Botões de página numerados */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationButton
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? 'active' : ''}
                      >
                        {pageNum}
                      </PaginationButton>
                    );
                  })}
                  
                  <PaginationButton 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </PaginationButton>
                </PaginationButtons>
              )}
              <ItemsPerPageContainer>
                <span>Mostrar:</span>
                <ItemsPerPageSelect 
                  value={itemsPerPage} 
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                >
                  <option value="10">10 por página</option>
                  <option value="20">20 por página</option>
                  <option value="30">30 por página</option>
                  <option value="40">40 por página</option>
                  <option value="50">50 por página</option>
                </ItemsPerPageSelect>
              </ItemsPerPageContainer>
            </PaginationContainer>
          </Card>
        );
      case 'stats':
        return (
          <>
            <StatContainer>
              <StatCard color="#3b82f6">
                <FaUsers style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
                <StatValue>{usageData.totalUsers}</StatValue>
                <StatLabel>Total de Usuários</StatLabel>
              </StatCard>
              
              <StatCard color="#10b981">
                <FaChartLine style={{ color: '#10b981', fontSize: '1.5rem' }} />
                <StatValue>{usageData.activeUsers}</StatValue>
                <StatLabel>Usuários Ativos</StatLabel>
              </StatCard>
              
              <StatCard color="#f59e0b">
                <FaCoins style={{ color: '#f59e0b', fontSize: '1.5rem' }} />
                <StatValue>{usageData.totalCreditsIssued}</StatValue>
                <StatLabel>Créditos Emitidos</StatLabel>
              </StatCard>
              
              <StatCard color="#ef4444">
                <FaLock style={{ color: '#ef4444', fontSize: '1.5rem' }} />
                <StatValue>{usageData.usersWithAdminAccess}</StatValue>
                <StatLabel>Administradores</StatLabel>
              </StatCard>
            </StatContainer>
            
            <Card>
              <CardTitle>
                <FaChartLine />
                Distribuição por Tipo de Consulta
              </CardTitle>
              
              <ChartContainer>
                {Object.entries(usageData.queryTypes).map(([type, value], index) => {
                  const percentage = (value / 100) * 100;
                  const position = `${(index * 20) + 10}%`;
                  
                  return (
                    <BarChart
                      key={type}
                      width="15%"
                      height={`${percentage}%`}
                      position={position}
                      color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                      value={value}
                    />
                  );
                })}
              </ChartContainer>
              
              <AxisLabels>
                {Object.keys(usageData.queryTypes).map((type, index) => (
                  <AxisLabel key={type} style={{ width: '15%' }}>
                    {type}
                  </AxisLabel>
                ))}
              </AxisLabels>
            </Card>
          </>
        );
      case 'settings':
        return (
          <>
            {isLoadingSettings ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#64748b'
              }}>
                Carregando configurações...
              </div>
            ) : (
              <>
                <SettingSection>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h2>Configurações de Usuários</h2>
                    {currentUser?.role === 'superadmin' && (
                      <Button 
                        variant="danger" 
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão?')) {
                            try {
                              const result = await resetSystemSettings();
                              if (result.success) {
                                toast.success('Configurações resetadas com sucesso');
                                loadSystemSettings();
                              } else {
                                toast.error(result.message || 'Erro ao resetar configurações');
                              }
                            } catch (error) {
                              toast.error('Erro ao resetar configurações');
                            }
                          }
                        }}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        Resetar Configurações
                      </Button>
                    )}
                  </div>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Notificações de Novos Usuários</SettingTitle>
                  <SettingDescription>Enviar notificação para administradores quando novos usuários são criados</SettingDescription>
                </SettingInfo>
                <ToggleSwitch 
                  data-active={systemSettings.newUserNotifications}
                  onClick={() => handleSettingToggle('newUserNotifications')}
                />
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Verificação de Email</SettingTitle>
                  <SettingDescription>Exigir verificação de email para novos usuários</SettingDescription>
                </SettingInfo>
                <ToggleSwitch 
                  data-active={systemSettings.requireEmailVerification}
                  onClick={() => handleSettingToggle('requireEmailVerification')}
                />
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Comprimento Mínimo de Senha</SettingTitle>
                  <SettingDescription>Número mínimo de caracteres para senhas</SettingDescription>
                </SettingInfo>
                <SelectInput 
                  value={systemSettings.minPasswordLength}
                  onChange={(e) => handleSettingChange('minPasswordLength', parseInt(e.target.value))}
                >
                  <option value="6">6 caracteres</option>
                  <option value="8">8 caracteres</option>
                  <option value="10">10 caracteres</option>
                  <option value="12">12 caracteres</option>
                </SelectInput>
              </SettingRow>
            </SettingSection>
            
            {/* <SettingSection>
              <h2>Configurações do Sistema</h2>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Modo de Manutenção</SettingTitle>
                  <SettingDescription>Desabilitar acesso para todos exceto administradores</SettingDescription>
                </SettingInfo>
                <ToggleSwitch 
                  data-active={systemSettings.maintenanceMode}
                  onClick={() => handleSettingToggle('maintenanceMode')}
                />
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Frequência de Backup</SettingTitle>
                  <SettingDescription>Frequência dos backups automáticos</SettingDescription>
                </SettingInfo>
                <SelectInput 
                  value={systemSettings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </SelectInput>
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Política de Limpeza de Dados</SettingTitle>
                  <SettingDescription>Período para limpeza automática de dados antigos</SettingDescription>
                </SettingInfo>
                <SelectInput 
                  value={systemSettings.dataPurgePolicy}
                  onChange={(e) => handleSettingChange('dataPurgePolicy', e.target.value)}
                >
                  <option value="30days">30 dias</option>
                  <option value="60days">60 dias</option>
                  <option value="90days">90 dias</option>
                  <option value="180days">180 dias</option>
                  <option value="never">Nunca</option>
                </SelectInput>
              </SettingRow>
            </SettingSection> */}
            
            <SettingSection>
              <h2>Configurações de Segurança</h2>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Logs de Auditoria</SettingTitle>
                  <SettingDescription>Manter logs detalhados de todas as ações dos usuários</SettingDescription>
                </SettingInfo>
                <ToggleSwitch 
                  data-active={systemSettings.auditLogs || true}
                  onClick={() => handleSettingToggle('auditLogs')}
                />
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Limite de Tentativas de Login</SettingTitle>
                  <SettingDescription>Número máximo de tentativas de login antes do bloqueio</SettingDescription>
                </SettingInfo>
                <SelectInput 
                  value={systemSettings.loginAttempts || 5}
                  onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
                >
                  <option value="3">3 tentativas</option>
                  <option value="5">5 tentativas</option>
                  <option value="10">10 tentativas</option>
                  <option value="unlimited">Ilimitado</option>
                </SelectInput>
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Timeout de Sessão</SettingTitle>
                  <SettingDescription>Tempo de inatividade antes do logout automático</SettingDescription>
                </SettingInfo>
                <SelectInput 
                  value={systemSettings.sessionTimeout || 30}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                  <option value="never">Nunca</option>
                </SelectInput>
              </SettingRow>
            </SettingSection>
            
            <SettingSection>
              <h2>Informações do Sistema</h2>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Versão do Sistema</SettingTitle>
                  <SettingDescription>Versão atual da aplicação</SettingDescription>
                </SettingInfo>
                <div style={{ color: '#64748b', fontWeight: '500' }}>v1.0.0</div>
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Última Atualização</SettingTitle>
                  <SettingDescription>Data da última atualização do sistema</SettingDescription>
                </SettingInfo>
                <div style={{ color: '#64748b', fontWeight: '500' }}>15/01/2024</div>
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Status do Servidor</SettingTitle>
                  <SettingDescription>Status atual do servidor</SettingDescription>
                </SettingInfo>
                <div style={{ 
                  color: '#10b981', 
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }} />
                  Online
                </div>
              </SettingRow>
              
              {/* <SettingRow>
                <SettingInfo>
                  <SettingTitle>Uso de Memória</SettingTitle>
                  <SettingDescription>Uso atual de memória do servidor</SettingDescription>
                </SettingInfo>
                <div style={{ color: '#64748b', fontWeight: '500' }}>45%</div>
              </SettingRow>
              
              <SettingRow>
                <SettingInfo>
                  <SettingTitle>Uso de CPU</SettingTitle>
                  <SettingDescription>Uso atual de CPU do servidor</SettingDescription>
                </SettingInfo>
                <div style={{ color: '#64748b', fontWeight: '500' }}>23%</div>
              </SettingRow> */}
                </SettingSection>
              </>
            )}
          </>
        );
      case 'plans':
        return (
          <>
            <CardGrid>
              {Object.entries(subscriptionPlans).map(([planKey, plan]) => {
                const usersWithPlan = users?.filter(u => (u.plan_id || u.plan) === planKey) || [];
                
                return (
                  <Card key={planKey}>
                    <CardTitle>
                      <FaUserShield style={{ color: plan.color }} />
                      {plan.name}
                    </CardTitle>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                        {usersWithPlan.length} usuário{usersWithPlan.length !== 1 ? 's' : ''}
                      </p>
                      
                      {usersWithPlan.length > 0 && (
                        <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {usersWithPlan.slice(0, 5).map(user => (
                            <UserListItem key={user.email || user.user_id} style={{ padding: '0.5rem', background: `${plan.color}08` }}>
                              <UserName style={{ fontSize: '0.875rem' }}>{user.name || 'Usuário'}</UserName>
                              <Badge
                                style={{ 
                                  background: `${plan.color}20`, 
                                  color: plan.color
                                }}
                              >
                                {plan.name}
                              </Badge>
                            </UserListItem>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </CardGrid>
          </>
        );
      default:
        return null;
    }
  };

  if (!currentUser || !isInitialized) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Carregando Painel Admin...</h2>
        </div>
      </Container>
    );
  }

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Title>Painel de Administração</Title>
          <ButtonGroup>
            <Button variant="primary" onClick={openAddModal}>
              <FaPlus />
              Adicionar Usuário
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              <FaArrowLeft />
              Voltar
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              <FaSignOutAlt />
              Sair
            </Button>
          </ButtonGroup>
        </Header>
        
        <Tabs>
          <Tab data-active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            Usuários
          </Tab>
          <Tab data-active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
            Análise de Dados
          </Tab>
          <Tab data-active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            Configurações
          </Tab>
          <Tab data-active={activeTab === 'plans'} onClick={() => setActiveTab('plans')}>
            Planos
          </Tab>
        </Tabs>
        
        <Content>
          {renderContent()}
        </Content>
        
        {renderModal()}
        
        <ToastContainer />
      </Container>
    </>
  );
};

export default AdminPanel;