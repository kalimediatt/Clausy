import React, { useState, useEffect, useCallback } from 'react';
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
  FaChartLine,
  FaUsers,
  FaLock,
  FaSearch
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Animation variants for framer-motion
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
    hasAdminAccess
  } = useAuth();
  
  // Estado para tema
  const [theme] = useState(localStorage.getItem("theme") || "light");
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados do componente
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

  // Estados para formulários
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    plan_name: 'free',
    credits: 0,
    role: 'user'
  });

  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Aplicar tema
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Inicialização
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        if (!hasAdminAccess) {
          toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
          navigate('/');
          return;
        }

        await loadUsers();
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar painel admin:', error);
        toast.error('Erro ao carregar dados do painel admin');
      }
    };

    if (currentUser) {
      initializeAdmin();
    }
  }, [currentUser, hasAdminAccess, loadUsers, navigate]);

  // Funções para filtragem, ordenação e paginação
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const filterAndSortUsers = useCallback(() => {
    if (!users || users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.company_name && user.company_name.toLowerCase().includes(searchLower)) ||
        (user.plan_name && user.plan_name.toLowerCase().includes(searchLower)) ||
        (user.role && user.role.toLowerCase().includes(searchLower))
      );
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    filterAndSortUsers();
  }, [filterAndSortUsers]);

  // Funções do modal
  const openAddModal = () => {
    setModalType('add');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      company_name: '',
      plan_name: 'free',
      credits: 0,
      role: 'user'
    });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Deixar vazio para não mostrar senha atual
      company_name: user.company_name || '',
      plan_name: user.plan_name || 'free',
      credits: user.credits || 0,
      role: user.role || 'user'
    });
    setModalOpen(true);
  };

  const openCreditsModal = (user) => {
    setModalType('credits');
    setSelectedUser(user);
    setFormData({
      ...formData,
      credits: 0
    });
    setModalOpen(true);
  };

  const openPlanModal = (user) => {
    setModalType('plan');
    setSelectedUser(user);
    setFormData({
      ...formData,
      plan_name: user.plan_name || 'free'
    });
    setModalOpen(true);
  };

  // Validação
  const validateForm = () => {
    if (modalType === 'add') {
      if (!formData.name?.trim()) {
        toast.error('Nome é obrigatório');
        return false;
      }
      if (!formData.email?.trim()) {
        toast.error('Email é obrigatório');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Email inválido');
        return false;
      }
      if (!formData.password?.trim()) {
        toast.error('Senha é obrigatória');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Senha deve ter pelo menos 6 caracteres');
        return false;
      }
    } else if (modalType === 'edit') {
      if (!selectedUser?.email) {
        toast.error('Usuário selecionado inválido');
        return false;
      }
      if (!formData.name?.trim()) {
        toast.error('Nome é obrigatório');
        return false;
      }
      if (!formData.email?.trim()) {
        toast.error('Email é obrigatório');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Email inválido');
        return false;
      }
    } else if (modalType === 'credits') {
      if (!selectedUser?.email) {
        toast.error('Usuário selecionado inválido');
        return false;
      }
      if (!formData.credits || formData.credits <= 0) {
        toast.error('Quantidade de créditos deve ser maior que 0');
        return false;
      }
      if (formData.credits > 10000) {
        toast.error('Quantidade máxima é 10.000 créditos');
        return false;
      }
    } else if (modalType === 'plan') {
      if (!selectedUser?.email) {
        toast.error('Usuário selecionado inválido');
        return false;
      }
      if (!formData.plan_name) {
        toast.error('Plano é obrigatório');
        return false;
      }
      const validPlans = ['free', 'premium', 'business', 'enterprise'];
      if (!validPlans.includes(formData.plan_name)) {
        toast.error('Plano selecionado é inválido');
        return false;
      }
    }
    return true;
  };

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (modalType === 'add') {
        // Mapear plan_name para plan_id para o backend
        const planMap = {
          'free': 'FREE_TRIAL',
          'premium': 'STANDARD', 
          'business': 'PRO',
          'enterprise': 'ENTERPRISE'
        };
        
        const userData = {
          ...formData,
          plan: planMap[formData.plan_name] || 'FREE_TRIAL'
        };
        
        const result = await addUser(userData);
        if (result.success) {
          toast.success('Usuário adicionado com sucesso!');
          setModalOpen(false);
          await loadUsers();
        } else {
          toast.error(result.message || 'Erro ao adicionar usuário');
        }
      } else if (modalType === 'edit') {
        const result = await updateUser(selectedUser.email, formData);
        if (result.success) {
          toast.success('Usuário atualizado com sucesso!');
          setModalOpen(false);
          await loadUsers(true); // Força refresh
        } else {
          toast.error(result.message || 'Erro ao atualizar usuário');
        }
      } else if (modalType === 'credits') {
        const result = await addCredits(selectedUser.email, parseInt(formData.credits));
        if (result.success) {
          toast.success('Créditos adicionados com sucesso!');
          setModalOpen(false);
          await loadUsers(true); // Força refresh
        } else {
          toast.error(result.message || 'Erro ao adicionar créditos');
        }
      } else if (modalType === 'plan') {
        // Mapear plan_name para plan_id para o backend
        const planMap = {
          'free': 'FREE_TRIAL',
          'premium': 'STANDARD', 
          'business': 'PRO',
          'enterprise': 'ENTERPRISE'
        };
        
        const planId = planMap[formData.plan_name] || 'FREE_TRIAL';
        console.log('AdminPanel - Changing plan:', {
          userEmail: selectedUser.email,
          formPlanName: formData.plan_name,
          mappedPlanId: planId
        });
        
        const result = await changePlan(selectedUser.email, planId);
        console.log('AdminPanel - Change plan result:', result);
        
        if (result.success) {
          toast.success('Plano alterado com sucesso!');
          setModalOpen(false);
          await loadUsers(true); // Força refresh
        } else {
          toast.error(result.message || 'Erro ao alterar plano');
        }
      }
    } catch (error) {
      console.error('Erro ao processar:', error);
      toast.error(error.message || 'Erro ao processar operação');
    }
  };

  const handleDelete = async (userEmail) => {
    if (!userEmail) {
      toast.error('Email do usuário não encontrado');
      return;
    }

    if (userEmail === currentUser?.email) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      try {
        const result = await removeUser(userEmail);
        
        if (result.success) {
          toast.success('Usuário removido com sucesso!');
          await loadUsers(true); // Força refresh
        } else {
          toast.error(result.message || 'Erro ao remover usuário');
        }
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        toast.error(error.message || 'Erro ao remover usuário');
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      navigate('/login');
    }
  };

  // Paginação
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Estatísticas
  const stats = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter(u => u.status === 'active')?.length || 0,
    totalCredits: users?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0,
    adminUsers: users?.filter(u => u.role === 'admin' || u.role === 'superadmin')?.length || 0
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
              i === currentPage 
                ? 'bg-gradient-to-r from-amber-600 to-amber-600 text-white border-amber-600' 
                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
            } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </motion.button>
        );
      }
    } else {
      // Lógica para páginas com ellipsis
      if (currentPage <= 3) {
        // Mostrar primeiras páginas + ellipsis + última
        for (let i = 1; i <= 3; i++) {
          buttons.push(
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] ${
                i === currentPage 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-600 text-white border-amber-600' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
              onClick={() => setCurrentPage(i)}
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
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </motion.button>
        );
      } else if (currentPage >= totalPages - 2) {
        // Mostrar primeira + ellipsis + últimas páginas
        buttons.push(
          <motion.button
            key={1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setCurrentPage(1)}
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
                i === currentPage 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-600 text-white border-amber-600' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
              onClick={() => setCurrentPage(i)}
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
            onClick={() => setCurrentPage(1)}
          >
            1
          </motion.button>
        );
        buttons.push(<span key="ellipsis3" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        buttons.push(
          <motion.button
            key={currentPage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-amber-600 to-amber-600 text-white border-amber-600 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px]
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setCurrentPage(currentPage)}
          >
            {currentPage}
          </motion.button>
        );
        buttons.push(<span key="ellipsis4" className={`text-neutral-500 dark:text-neutral-400 ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'}`}>...</span>);
        buttons.push(
          <motion.button
            key={totalPages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg cursor-pointer transition-all duration-300 min-w-[40px] hover:bg-neutral-50 dark:hover:bg-neutral-700
              ${isMobile ? 'px-2 py-1 text-xs min-w-[32px]' : 'px-3 py-2 text-sm'}`}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </motion.button>
        );
      }
    }
    
    return buttons;
  };

  // Render do modal
  const renderModal = () => {
    if (!modalOpen) return null;

    const modalTitles = {
      add: 'Adicionar Usuário',
      edit: 'Editar Usuário',
      credits: 'Adicionar Créditos',
      plan: 'Alterar Plano'
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
            ${isMobile ? 'admin-modal-mobile max-w-md w-full' : 'max-w-md w-full p-6'}`}
        >
          <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100 mb-6
            ${isMobile ? 'text-lg' : 'text-xl'}`}>
            {modalTitles[modalType]}
          </h3>

          <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'space-y-4' : ''}`}>
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                    required={modalType === 'add'}
                    minLength="6"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                  />
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Plano
                  </label>
                  <select
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                    ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Créditos
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                    min="0"
                  />
                </div>
              </>
            )}

            {modalType === 'credits' && (
              <div>
                <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                  ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Quantidade de créditos para adicionar
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.credits || ''}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent2 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                      ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                    placeholder="Digite a quantidade (ex: 100)"
                    required
                  />
                  <div className={`text-neutral-500 dark:text-neutral-400 mt-1
                    ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    Mínimo: 1 crédito • Máximo: 10.000 créditos
                  </div>
                </div>
              </div>
            )}

            {modalType === 'plan' && (
              <div>
                <label className={`block font-medium text-neutral-700 dark:text-neutral-300 mb-2
                  ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  Novo Plano
                </label>
                <select
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  className={`w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                    ${isMobile ? 'px-3 py-3 text-base' : 'px-3 py-2'}`}
                  required
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="business">Business</option>
                </select>
              </div>
            )}

            <div className={`flex space-x-3 pt-4 ${isMobile ? 'flex-col space-x-0 space-y-3' : ''}`}>
              <button
                type="submit"
                className={`bg-gradient-to-r from-amber-600 to-amber-600 text-white rounded-xl hover:brightness-110 transition-all duration-300 font-medium
                  ${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'}`}
              >
                {modalType === 'add' ? 'Adicionar' : modalType === 'edit' ? 'Salvar' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={`bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-300 font-medium
                  ${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'}`}
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  if (!currentUser || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Carregando Painel Admin...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500
      ${isMobile ? 'admin-mobile-scroll' : ''}`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800
          ${isMobile ? 'admin-header-mobile' : ''}`}
      >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div>
                <h1 className={`font-bold text-neutral-900 dark:text-neutral-100
                  ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  Painel de Administração
                </h1>
                <p className={`text-neutral-600 dark:text-neutral-400
                  ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Gestão completa de usuários e sistema
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`flex items-center space-x-3 ${isMobile ? 'w-full justify-between' : ''}`}
            >
              <button
                onClick={openAddModal}
                className={`inline-flex items-center gap-2 bg-gradient-to-r from-accent2 to-accent1 text-white rounded-xl hover:brightness-110 transition-all duration-300 font-medium shadow-lg
                  ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'}`}
              >
                <FaPlus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {isMobile ? 'Adicionar' : 'Adicionar Usuário'}
              </button>

              <button
                onClick={() => navigate('/')}
                className={`inline-flex items-center gap-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-300 font-medium
                  ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'}`}
              >
                <FaArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {isMobile ? 'Voltar' : 'Voltar'}
              </button>

              <button
                onClick={handleLogout}
                className={`inline-flex items-center gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 font-medium shadow-lg
                  ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'}`}
              >
                <FaSignOutAlt className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {isMobile ? 'Sair' : 'Sair'}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-4' : 'py-6'}`}
      >
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1">
          <div className="flex space-x-1">
            {[
              { id: 'users', label: 'Usuários', icon: FaUsers },
              { id: 'stats', label: 'Análise de Dados', icon: FaChartLine },
              { id: 'settings', label: 'Configurações', icon: FaCog },
              { id: 'plans', label: 'Planos', icon: FaDatabase }
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
                {!isMobile && tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 ${isMobile ? 'pb-8' : ''}`}>
        {activeTab === 'users' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}
          >
            {/* Estatísticas */}
            <motion.div variants={fadeInUp} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
              ${isMobile ? 'grid-cols-2 gap-3' : ''}`}>
              <div className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
                ${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>Total de Usuários</p>
                    <p className={`font-bold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.totalUsers}</p>
                  </div>
                  <FaUsers className={`text-blue-500 ${isMobile ? 'text-2xl' : 'text-3xl'}`} />
                </div>
              </div>
              
              <div className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
                ${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>Usuários Ativos</p>
                    <p className={`font-bold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.activeUsers}</p>
                  </div>
                  <FaUserShield className={`text-green-500 ${isMobile ? 'text-2xl' : 'text-3xl'}`} />
                </div>
              </div>
              
              <div className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
                ${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Créditos</p>
                    <p className={`font-bold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.totalCredits}</p>
                  </div>
                  <FaCoins className={`text-yellow-500 ${isMobile ? 'text-2xl' : 'text-3xl'}`} />
                </div>
              </div>
              
              <div className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
                ${isMobile ? 'p-4 col-span-2' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-sm'}`}>Administradores</p>
                    <p className={`font-bold text-neutral-900 dark:text-neutral-100
                      ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.adminUsers}</p>
                  </div>
                  <FaLock className={`text-red-500 ${isMobile ? 'text-2xl' : 'text-3xl'}`} />
                </div>
              </div>
            </motion.div>

            {/* Controles de busca e filtros */}
            <motion.div variants={fadeInUp} className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800
              ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`flex flex-col md:flex-row gap-4 items-center justify-between
                ${isMobile ? 'gap-3' : ''}`}>
                <div className={`flex items-center gap-4 flex-1 ${isMobile ? 'w-full' : ''}`}>
                  <div className={`relative flex-1 ${isMobile ? 'w-full' : 'max-w-md'}`}>
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400
                      ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className={`w-full pl-10 pr-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                        ${isMobile ? 'py-2 text-sm' : 'py-2'}`}
                    />
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 ${isMobile ? 'w-full justify-between' : ''}`}>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300
                      ${isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-2'}`}
                    style={{
                      colorScheme: theme === 'dark' ? 'dark' : 'light'
                    }}
                  >
                    <option value={5} style={{
                      backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                      color: theme === 'dark' ? '#f5f5f5' : '#171717'
                    }}>{isMobile ? '5/página' : '5 por página'}</option>
                    <option value={10} style={{
                      backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                      color: theme === 'dark' ? '#f5f5f5' : '#171717'
                    }}>{isMobile ? '10/página' : '10 por página'}</option>
                    <option value={25} style={{
                      backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                      color: theme === 'dark' ? '#f5f5f5' : '#171717'
                    }}>{isMobile ? '25/página' : '25 por página'}</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Tabela de usuários */}
            <motion.div variants={fadeInUp} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
                        onClick={() => handleSort('name')}
                      >
                        Nome {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
                        onClick={() => handleSort('role')}
                      >
                        Função {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
                        onClick={() => handleSort('plan_name')}
                      >
                        Plano {sortField === 'plan_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
                        onClick={() => handleSort('credits')}
                      >
                        Créditos {sortField === 'credits' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {paginatedUsers.map((user, index) => (
                      <motion.tr
                        key={user.user_id || user.email || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-300"
                      >
                        <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                          {user.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {user.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'superadmin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : user.role === 'admin' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.plan_name === 'premium' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                              : user.plan_name === 'business' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {user.plan_name || 'free'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                          {user.credits || 0}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Editar usuário"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openCreditsModal(user)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Adicionar créditos"
                            >
                              <FaCoins className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPlanModal(user)}
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Alterar plano"
                            >
                              <FaCog className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.email)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 hover:scale-110"
                              title="Excluir usuário"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação com cores corretas para dark mode */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between
                  ${isMobile ? 'px-4 py-3 flex-col gap-3' : ''}`}>
                  <div className={`text-neutral-600 dark:text-neutral-400
                    ${isMobile ? 'text-xs text-center' : 'text-sm'}`}>
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuários
                  </div>
                  <div className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                    {!isMobile && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
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
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg text-sm cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      >
                        Próximo
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Estatísticas Avançadas */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Logins por Dia</h3>
                  <FaChartLine className="text-2xl text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
                <p className="text-sm text-green-600">+15% desde ontem</p>
              </div>
              
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Créditos Usados</h3>
                  <FaCoins className="text-2xl text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">2,543</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Esta semana</p>
              </div>
              
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Taxa de Conversão</h3>
                  <FaUsers className="text-2xl text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">8.4%</div>
                <p className="text-sm text-green-600">+2.1% este mês</p>
              </div>
            </motion.div>

            {/* Gráficos */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Usuários por Plano</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Free</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Premium</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: '30%'}}></div>
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">30%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Business</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '10%'}}></div>
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">Novo usuário registrado</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">há 5 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">Upgrade para Premium</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">há 12 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">Sistema atualizado</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">há 1 hora</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Configurações Gerais */}
            <motion.div variants={fadeInUp} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Configurações Gerais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Nome da Aplicação
                  </label>
                  <input
                    type="text"
                    defaultValue="Clausy IA Jurídico"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Email de Suporte
                  </label>
                  <input
                    type="email"
                    defaultValue="suporte@clausy.com"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Limite de Tentativas de Login
                  </label>
                  <select className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value={3}>3 tentativas</option>
                    <option value={5}>5 tentativas</option>
                    <option value={10}>10 tentativas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Sessão Expira em (horas)
                  </label>
                  <input
                    type="number"
                    defaultValue="24"
                    min="1"
                    max="168"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="bg-gradient-to-r from-amber-600 to-amber-600 text-white px-6 py-2 rounded-xl hover:brightness-110 transition-all duration-300 font-medium">
                  Salvar Configurações
                </button>
                <button className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-6 py-2 rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-300 font-medium">
                  Resetar
                </button>
              </div>
            </motion.div>

            {/* Configurações de Segurança */}
            <motion.div variants={fadeInUp} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Configurações de Segurança</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Autenticação de Dois Fatores</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Requer verificação adicional no login</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Log de Auditoria</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Registra todas as ações administrativas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Backup Automático</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Backup diário dos dados do sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Cards de Planos */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Free</h3>
                  <div className="text-3xl font-bold text-green-600 mt-2">R$ 0</div>
                  <p className="text-neutral-600 dark:text-neutral-400">por mês</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">100 créditos/mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Suporte básico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">1 usuário</span>
                  </li>
                </ul>

                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{stats.totalUsers}</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">usuários ativos</p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-amber-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">Mais Popular</span>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Premium</h3>
                  <div className="text-3xl font-bold text-amber-600 mt-2">R$ 99</div>
                  <p className="text-neutral-600 dark:text-neutral-400">por mês</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">1.000 créditos/mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">5 usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Relatórios avançados</span>
                  </li>
                </ul>

                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {users?.filter(u => u.plan_name === 'premium')?.length || 0}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">usuários ativos</p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Business</h3>
                  <div className="text-3xl font-bold text-purple-600 mt-2">R$ 299</div>
                  <p className="text-neutral-600 dark:text-neutral-400">por mês</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Créditos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Suporte 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Usuários ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">API personalizada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">White-label</span>
                  </li>
                </ul>

                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {users?.filter(u => u.plan_name === 'business')?.length || 0}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">usuários ativos</p>
                </div>
              </div>
            </motion.div>

            {/* Configurações de Planos */}
            <motion.div variants={fadeInUp} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Configuração de Preços</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Preço Premium (R$)
                  </label>
                  <input
                    type="number"
                    defaultValue="99"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Preço Business (R$)
                  </label>
                  <input
                    type="number"
                    defaultValue="299"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Créditos Free
                  </label>
                  <input
                    type="number"
                    defaultValue="100"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button className="bg-gradient-to-r from-amber-600 to-amber-600 text-white px-6 py-2 rounded-xl hover:brightness-110 transition-all duration-300 font-medium">
                  Atualizar Preços
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Modal */}
      {renderModal()}

      {/* Toast Container */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
};

export default AdminPanel;
