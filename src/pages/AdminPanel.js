import React, { useState, useEffect } from 'react';
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

const Sidebar = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen'
})`
  width: ${({ isOpen }) => (isOpen ? '250px' : '80px')};
  background: #2B2B2B;
  padding: 1rem;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  border-right: 1px solid #ADADAD;
`;

const MenuItem = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: ${({ active }) => (active ? '#8C4B35' : '#ADADAD')};

  &:hover {
    background: rgba(140, 75, 53, 0.1);
    color: #8C4B35;
  }
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #334155;
`;

const CloseButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active', 'color'].includes(prop)
})`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  
  &:hover {
    color: #ef4444;
  }
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

// Novos componentes para gerenciamento de planos de assinatura
const PlanCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid ${props => props.color || '#3b82f6'};
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const PlanTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: ${props => props.color || '#3b82f6'};
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PlanFeatures = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #64748b;
  font-size: 0.875rem;
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const PlanPrice = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
  color: ${props => props.color || '#3b82f6'};
  margin: 1rem 0;
`;

const UsageStatsSection = styled.div`
  margin-top: 2rem;
`;

const UsageBarContainer = styled.div`
  background: #e2e8f0;
  height: 8px;
  border-radius: 4px;
  margin: 0.5rem 0 1rem;
  position: relative;
  overflow: hidden;
`;

const UsageBar = styled.div`
  position: absolute;
  height: 100%;
  width: ${props => `${props.percentage || 0}%`};
  background: ${props => 
    props.percentage > 90 ? '#ef4444' : 
    props.percentage > 70 ? '#f59e0b' : 
    '#3b82f6'};
  border-radius: 4px;
  transition: width 0.5s ease;
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

const IconAction = styled(IconButton)`
  width: 24px;
  height: 24px;
  padding: 0;
  margin-left: 0.5rem;
`;

const Content = styled.div`
  margin-top: 2rem;
  padding: 0 1rem;
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
    getCurrentPlanData
  } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load users only once when component mounts or when tab changes to users
  useEffect(() => {
    const initializeAdmin = async () => {
      if (!isInitialized && currentUser) {
        await loadUsers(false); // Usa cache se disponível
        setIsInitialized(true);
      }
    };
    
    initializeAdmin();
  }, [currentUser, isInitialized, loadUsers]);

  // Recarregar usuários quando mudar para a aba de usuários
  useEffect(() => {
    if (activeTab === 'users' && isInitialized) {
      loadUsers(false); // Usa cache se disponível
    }
  }, [activeTab, isInitialized, loadUsers]);
  
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
    plan: 'FREE_TRIAL'
  });
  
  const [creditsAmount, setCreditsAmount] = useState(100);
  const [selectedPlan, setSelectedPlan] = useState('');

  // Configurações do sistema (simuladas)
  const [systemSettings, setSystemSettings] = useState({
    newUserNotifications: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    defaultCredits: 100,
    maintenanceMode: false,
    backupFrequency: 'daily',
    dataPurgePolicy: '90days'
  });
  
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
  
  const openAddModal = () => {
    setModalType('add');
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user',
      credits: 0,
      plan: 'FREE_TRIAL'
    });
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
      plan: user.plan_id || user.plan || 'FREE_TRIAL'
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
  };
  
  const handleSubmit = async () => {
    if (modalType === 'add') {
      // Validações básicas
      if (!formData.email || !formData.password || !formData.name) {
        toast.error('Todos os campos são obrigatórios');
        return;
      }
      
      const result = await addUser({
        ...formData,
        credits: Number(formData.credits)
      });
      
      if (result.success) {
        toast.success('Usuário adicionado com sucesso');
        setModalOpen(false);
        loadUsers(); // Recarregar a lista após adicionar
      } else {
        toast.error(result.message || 'Não foi possível adicionar o usuário');
      }
    } else if (modalType === 'edit') {
      // Tratamos o caso da senha vazia (não modificar)
      const updates = { ...formData };
      if (!updates.password) delete updates.password;
      
      const result = await updateUser(selectedUser.email, {
        ...updates,
        credits: Number(updates.credits)
      });
      
      if (result.success) {
        toast.success('Usuário atualizado com sucesso');
        setModalOpen(false);
        loadUsers(); // Recarregar a lista após atualizar
      } else {
        toast.error(result.message || 'Não foi possível atualizar o usuário');
      }
    } else if (modalType === 'credits') {
      const result = await addCredits(selectedUser.email, Number(creditsAmount));
      
      if (result.success) {
        toast.success(`${creditsAmount} créditos adicionados com sucesso para ${selectedUser.name}`);
        setModalOpen(false);
        loadUsers(); // Recarregar a lista após adicionar créditos
      } else {
        toast.error(result.message || 'Não foi possível adicionar créditos');
      }
    }
  };
  
  const handleChangePlan = async () => {
    if (selectedUser && selectedPlan) {
      const result = await changePlan(selectedUser.email, selectedPlan);
      
      if (result.success) {
        toast.success(`Plano alterado para ${subscriptionPlans[selectedPlan]?.name || selectedPlan}`);
        setModalOpen(false);
        loadUsers(); // Recarregar a lista após alterar o plano
      } else {
        toast.error(result.message || 'Não foi possível alterar o plano');
      }
    }
  };
  
  const handleDeleteUser = async (email) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      const result = await removeUser(email);
      
      if (result.success) {
        toast.success('Usuário removido com sucesso');
        loadUsers(); // Recarregar a lista após remover
      } else {
        toast.error(result.message || 'Não foi possível remover o usuário');
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSettingToggle = (setting) => {
    setSystemSettings({
      ...systemSettings,
      [setting]: !systemSettings[setting]
    });
  };
  
  const handleSettingChange = (setting, value) => {
    setSystemSettings({
      ...systemSettings,
      [setting]: value
    });
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
                />
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
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="name">Nome</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
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
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button 
              variant="primary" 
              onClick={
                modalType === 'plan' 
                  ? handleChangePlan 
                  : handleSubmit
              }
            >
              {modalType === 'add' ? 'Adicionar' : 
               modalType === 'edit' ? 'Salvar' : 
               modalType === 'credits' ? 'Adicionar Créditos' :
               'Alterar Plano'}
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
            
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Função</Th>
                  <Th>Plano</Th>
                  <Th>Créditos</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {!users || users.length === 0 ? (
                  <tr>
                    <Td colSpan="6" style={{ textAlign: 'center' }}>Nenhum usuário encontrado</Td>
                  </tr>
                ) : (
                  users.map(user => (
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
                          <IconButton 
                            variant="danger"
                            onClick={() => handleDeleteUser(user.email)}
                          >
                            <FaTrash />
                          </IconButton>
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
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
            <SettingSection>
              <h2>Configurações de Usuários</h2>
              
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
            
            <SettingSection>
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
            </SettingSection>
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