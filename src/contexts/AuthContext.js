import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// API base URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Token and user data management with secure storage
const getStoredToken = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    // Basic token validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      removeStoredToken();
      return null;
    }
    
    // Check expiration
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp * 1000 < Date.now()) {
      removeStoredToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error reading token:', error);
    removeStoredToken();
    return null;
  }
};

const getStoredUser = () => {
  try {
    const userData = localStorage.getItem('current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error reading stored user:', error);
    return null;
  }
};

const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

const setStoredToken = (token) => {
  try {
    // Basic token validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Check expiration
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }
    
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

const removeStoredToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  sessionStorage.removeItem('csrf_token');
};

// Definição dos planos de acesso com seus limites
const SUBSCRIPTION_PLANS = {
  FREE_TRIAL: {
    name: 'Free Trial',
    maxQueriesPerHour: 50,
    maxTokensPerHour: 3000,
    historyRetention: 24, // 24 horas
    price: 'Gratuito',
    color: '#64748b', // Cinza
    features: [
      'Até 50 consultas por hora',
      'Limite de 3.000 tokens por hora',
      'Histórico de 24 horas',
      'Acesso às funcionalidades básicas'
    ]
  },
  STANDARD: {
    name: 'Standard',
    maxQueriesPerHour: 150,
    maxTokensPerHour: 15000,
    historyRetention: 168, // 7 dias
    price: 'R$ 99,90/mês',
    color: '#3b82f6', // Azul
    features: [
      'Até 150 consultas por hora',
      'Limite de 15.000 tokens por hora',
      'Histórico de 7 dias',
      'Acesso a modelos avançados',
      'Suporte por email'
    ]
  },
  PRO: {
    name: 'Pro',
    maxQueriesPerHour: 1000,
    maxTokensPerHour: 50000,
    historyRetention: 720, // 30 dias
    price: 'R$ 249,90/mês',
    color: '#10b981', // Verde
    features: [
      'Até 1.000 consultas por hora',
      'Limite de 50.000 tokens por hora',
      'Histórico de 30 dias',
      'Acesso prioritário a novos recursos',
      'Atendimento prioritário',
      'Personalização da interface'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxQueriesPerHour: 10000,
    maxTokensPerHour: 200000,
    historyRetention: 2160, // 90 dias
    price: 'R$ 499,90/mês',
    color: '#f59e0b', // Laranja
    features: [
      'Até 10.000 consultas por hora',
      'Limite de 200.000 tokens por hora',
      'Histórico de 90 dias',
      'Acesso prioritário a novos recursos',
      'Atendimento prioritário',
      'Personalização da interface',
      'Recursos exclusivos'
    ]
  }
};

// API calls with enhanced security
const api = {
  get: async (endpoint, requireAuth = true) => {
    try {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (requireAuth) {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const csrfToken = sessionStorage.getItem('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, { 
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        removeStoredToken();
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();
        return data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint, data, requireAuth = true) => {
    try {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (requireAuth) {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const csrfToken = sessionStorage.getItem('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (response.status === 401) {
        removeStoredToken();
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const responseData = await response.json();
        
        // Se a resposta não foi bem-sucedida (status 2xx), tratar como erro
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return responseData;
      }
      
      // Se não for JSON, verificar se houve erro HTTP
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  },

  put: async (endpoint, data, requireAuth = true) => {
    try {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (requireAuth) {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const csrfToken = sessionStorage.getItem('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (response.status === 401) {
        removeStoredToken();
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return responseData;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  },

  delete: async (endpoint, requireAuth = true) => {
    try {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (requireAuth) {
        const token = getStoredToken();
        if (!token) {
          throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const csrfToken = sessionStorage.getItem('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        removeStoredToken();
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return responseData;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  }
};



// Helper function to simulate users for development/demo
function simulateUsers() {
  return [
    {
      user_id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      credits: 1000,
      plan_id: 'PRO',
      plan: 'PRO',
      last_login: new Date().toISOString()
    },
    {
      user_id: '2',
      email: 'user1@example.com',
      name: 'Regular User',
      role: 'user',
      credits: 500,
      plan_id: 'STANDARD',
      plan: 'STANDARD',
      last_login: new Date().toISOString()
    },
    {
      user_id: '3',
      email: 'user2@example.com',
      name: 'Free User',
      role: 'user',
      credits: 100,
      plan_id: 'FREE_TRIAL',
      plan: 'FREE_TRIAL',
      last_login: new Date().toISOString()
    }
  ];
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Inicializar estado com dados armazenados se disponíveis
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();

    return (storedUser && token) ? storedUser : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const isAuth = !!(token && storedUser);

    return isAuth;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authLogs, setAuthLogs] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [usersCache, setUsersCache] = useState([]);
  const [lastUsersLoad, setLastUsersLoad] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

  // Verificar autenticação ao iniciar
  useEffect(() => {

    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpar cache quando company_id mudar
  useEffect(() => {
    if (currentUser?.company_id) {
  
      setUsersCache([]);
      setLastUsersLoad(null);
    }
  }, [currentUser?.company_id]);
  
  const checkAuth = async () => {

    try {
      const token = getStoredToken();
      const storedUser = getStoredUser();
      
      
      if (!token) {
    
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      // Se já temos dados válidos do usuário armazenados localmente, usar eles
      if (storedUser && storedUser.user_id && storedUser.email && storedUser.name) {
    
        setIsAuthenticated(true);
        setCurrentUser(storedUser);
        setIsLoading(false);
        return;
      }
      
  
      const response = await api.get('/auth/verify');
      
      
      if (response.success) {
        
        
        // Garantir que todos os campos necessários estão presentes
        const completeUser = {
          ...response.user,
          // Garantir compatibilidade com campos antigos
          plan: response.user.plan_id,
          maxQueriesPerHour: response.user.max_queries_per_hour,
          maxTokensPerHour: response.user.max_tokens_per_hour,
          historyRetention: response.user.history_retention_hours
        };
        
        setIsAuthenticated(true);
        setCurrentUser(completeUser);
        setStoredUser(completeUser); // Persistir dados do usuário
        
        // Carregar estatísticas do usuário
        try {
          const usageResponse = await api.get(`/user/${response.user.user_id}/usage-stats`);
          if (usageResponse.success && usageResponse.data) {
            setUsageStats({
              queriesThisHour: usageResponse.data.queries_this_hour || 0,
              tokensThisHour: usageResponse.data.tokens_this_hour || 0,
              lastQueryTimestamp: usageResponse.data.last_query_timestamp || null,
              queryHistory: [],
              queries_today: usageResponse.data.queries_today || 0,
              tokens_today: usageResponse.data.tokens_today || 0,
              queries_this_month: usageResponse.data.queries_this_month || 0,
              total_queries: usageResponse.data.total_queries || 0
            });
          }
        } catch (error) {
          console.error('Error loading usage stats:', error);
        }
      } else {
    
        removeStoredToken();
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('❌ CheckAuth: Erro na verificação:', error);
      removeStoredToken();
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
  
      setIsLoading(false);
    }
  };
  
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password }, false);
      
      if (response.success && response.token) {
        setStoredToken(response.token);
        setIsAuthenticated(true);
        
        // Atualizar o usuário com os dados do plano do backend
        const updatedUser = {
          ...response.user,
          plan: response.user.plan_id, // Para compatibilidade
          plan_name: response.user.plan_name,
          plan_color: response.user.plan_color,
          maxQueriesPerHour: response.user.max_queries_per_hour || SUBSCRIPTION_PLANS[response.user.plan_id]?.maxQueriesPerHour,
          maxTokensPerHour: response.user.max_tokens_per_hour || SUBSCRIPTION_PLANS[response.user.plan_id]?.maxTokensPerHour,
          historyRetention: response.user.history_retention_hours || SUBSCRIPTION_PLANS[response.user.plan_id]?.historyRetention
        };
        
        setCurrentUser(updatedUser);
        setStoredUser(updatedUser); // Persistir dados do usuário
        return true;
      }
      
      setError(response.message || 'Login failed');
      return false;
    } catch (error) {
      setError(error.message || 'Login failed');
      return false;
    }
  };
  
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpar session_id do usuário atual antes de fazer logout
      if (currentUser?.user_id) {
        const sessionKey = `user:${currentUser.user_id}:current_session`;
        sessionStorage.removeItem(sessionKey);
      }
      
      removeStoredToken(); // Já remove both token e user data
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUsageStats({
        queriesThisHour: 0,
        tokensThisHour: 0,
        lastQueryTimestamp: null,
        queryHistory: []
      });
    }
  };

  const loadAuthLogs = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/auth/logs?page=${page}`);
      if (response.success) {
        // Ensure we're getting an array of logs
        const logs = Array.isArray(response.data) ? response.data : [];
        
        // Transform the logs to ensure they have the correct structure
        const transformedLogs = logs.map(log => {
          // O backend já retorna status como 'success' ou 'failed'
          // mas vamos garantir que está correto baseado no campo success
          const isSuccess = log.status === 'success' || log.success === 1 || log.success === true;
          
          return {
            id: log.id || log.log_id,
            username: log.username || 'N/A',
            ip_address: log.ip_address || 'N/A',
            status: isSuccess ? 'success' : 'failed',
            success: isSuccess ? 1 : 0,
            timestamp: log.timestamp || new Date().toISOString()
          };
        });
        
        setAuthLogs(transformedLogs);
        if (response.pagination) {
          setCurrentPage(response.pagination.currentPage);
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      } else {
        console.error('Failed to load auth logs:', response.message || response.statusText || 'Unknown error');
        setAuthLogs([]);
      }
    } catch (error) {
      // Log more useful error info
      const backendMsg = error?.response?.data?.message;
      const statusText = error?.response?.statusText;
      const errMsg = backendMsg || statusText || error.message || error;
      console.error('Error loading auth logs:', errMsg);
      setAuthLogs([]);
    }
  }, []);

  const loadUsers = useCallback(async (forceRefresh = false) => {

    
    if (!currentUser?.company_id) {
  
      setUsers([]);
      setUsersCache([]);
      setLastUsersLoad(null);
      return null;
    }

    // Verificar se podemos usar o cache (apenas se não for forceRefresh)
    const now = Date.now();
    if (!forceRefresh && 
        usersCache.length > 0 && 
        lastUsersLoad && 
        (now - lastUsersLoad) < CACHE_DURATION) {
  
      setUsers(usersCache);
      return usersCache;
    }
    

    setIsLoadingUsers(true);
    try {
      const response = await api.get(`/company/${currentUser.company_id}/users`);
  
      
      if (response?.data) {
    
        setUsers(response.data);
        setUsersCache(response.data);
        setLastUsersLoad(now);
        return response.data;
      }
  
      setUsers([]);
      setUsersCache([]);
      return null;
    } catch (error) {
      console.error('Error loading company users:', error);
      setUsers([]);
      setUsersCache([]);
      return null;
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUser?.company_id]);

  const addUser = async (userData) => {
    try {
      const response = await api.post('/users', userData);
      if (response.success) {
        await loadUsers(true); // Força refresh após adicionar usuário
        return { success: true, userId: response.userId };
      }
      return { success: false, message: response.message || 'Failed to add user' };
    } catch (error) {
      console.error('Error adding user:', error);
  
      // Extrair a mensagem de erro mais específica
      let errorMessage = 'Erro ao adicionar usuário';
      
      if (error.message) {
        if (error.message.includes('Invalid email format')) {
          errorMessage = 'Formato de email inválido';
        } else if (error.message.includes('Password must be at least 6 characters')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'Um usuário com este email já existe';
        } else if (error.message.includes('Email, password and name are required')) {
          errorMessage = 'Email, senha e nome são obrigatórios';
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'Acesso negado: apenas administradores podem criar usuários';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const response = await api.post(`/users/${userId}`, updates);
      if (response.success) {
        await loadUsers(true); // Força refresh após atualizar usuário
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to update user' };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: 'Error updating user: ' + (error.message || 'Unknown error') };
    }
  };

  const removeUser = async (userId) => {
    try {
      // Prevent removing yourself
      if (currentUser && (currentUser.user_id === userId || currentUser.email === userId)) {
        return { success: false, message: 'You cannot remove your own account' };
      }
      
      const response = await api.post(`/users/${userId}/delete`);
      if (response.success) {
        await loadUsers(true); // Força refresh após remover usuário
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to remove user' };
    } catch (error) {
      console.error('Error removing user:', error);
      return { success: false, message: 'Error removing user: ' + (error.message || 'Unknown error') };
    }
  };

  const addCredits = async (userId, amount) => {
    try {
      const response = await api.post(`/users/${userId}/add-credits`, { amount });
      if (response.success) {
        // Update local users list
        setUsers(prevUsers => prevUsers.map(user => 
          user.user_id === userId || user.email === userId 
            ? { ...user, credits: (user.credits || 0) + amount } 
            : user
        ));
        
        // If adding credits to current user, update current user state
        if (currentUser && (currentUser.user_id === userId || currentUser.email === userId)) {
          const updatedUser = { 
            ...currentUser, 
            credits: (currentUser.credits || 0) + amount 
          };
          setCurrentUser(updatedUser);
        }
        
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to add credits' };
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, message: 'Error adding credits: ' + (error.message || 'Unknown error') };
    }
  };

  const changePlan = async (userId, newPlanId) => {
    try {
      // Validate plan exists
      if (!SUBSCRIPTION_PLANS[newPlanId]) {
        return { success: false, message: 'Invalid plan selected' };
      }
      
      const response = await api.post(`/users/${userId}/change-plan`, { plan_id: newPlanId });
      
      if (response.success) {
        // Update local users list
        const updatedUsers = users.map(user => {
          if (user.user_id === userId || user.email === userId) {
            return { 
              ...user, 
              plan_id: newPlanId,
              plan: newPlanId, // For backward compatibility
              plan_name: SUBSCRIPTION_PLANS[newPlanId].name,
              plan_color: SUBSCRIPTION_PLANS[newPlanId].color
            };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        
        // If changing plan for current user, update current user state
        if (currentUser && (currentUser.user_id === userId || currentUser.email === userId)) {
          const updatedUser = { 
            ...currentUser, 
            plan_id: newPlanId,
            plan: newPlanId, // For backward compatibility
            plan_name: SUBSCRIPTION_PLANS[newPlanId].name,
            plan_color: SUBSCRIPTION_PLANS[newPlanId].color
          };
          
          setCurrentUser(updatedUser);
        }
        
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Failed to change plan' };
    } catch (error) {
      console.error('Error changing plan:', error);
      return { success: false, message: 'Error changing plan: ' + (error.message || 'Unknown error') };
    }
  };

  const processAiQuery = async (prompt, setup, formData) => {
    const token = getStoredToken();
    if (!token) {
        throw new Error('Não autorizado');
    }

    try {
        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401) {
                removeStoredToken();
                window.location.href = '/login';
                throw new Error('Sessão expirada');
            }
            const error = await response.json();
            throw new Error(error.message || 'Erro ao processar mensagem');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        throw error;
    }
  };

  // Obter histórico de consultas
  const getQueryHistory = async () => {
    if (!isAuthenticated || !currentUser) {
      return [];
    }
    
    try {
      const response = await api.get(`/user/${currentUser.user_id}/query-history`);
      return response.success ? response.history : [];
    } catch (error) {
      console.error('Error fetching query history:', error);
      return [];
    }
  };

  // Obter histórico de chats
  const getChatHistory = async () => {
    if (!isAuthenticated || !currentUser) {
      return [];
    }
    
    try {
      const response = await api.get(`/user/${currentUser.user_id}/chat-history`);
      return response.success ? response.history : [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  };

  // Salvar conversa no Redis
  const saveChatConversation = async (conversation) => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }
    
    try {
      const response = await api.post(`/user/${currentUser.user_id}/chat-history`, {
        conversation
      });
      return response.success;
    } catch (error) {
      console.error('Error saving chat conversation:', error);
      return false;
    }
  };

  // Atualizar conversa existente
  const updateChatConversation = async (conversationId, messages) => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }
    
    try {
      const response = await api.put(`/user/${currentUser.user_id}/chat-history/${conversationId}`, {
        messages
      });
      return response.success;
    } catch (error) {
      console.error('Error updating chat conversation:', error);
      return false;
    }
  };

  // Remover conversa
  const removeChatConversation = async (conversationId) => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }
    
    try {
      const response = await api.delete(`/user/${currentUser.user_id}/chat-history/${conversationId}`);
      return response.success;
    } catch (error) {
      console.error('Error removing chat conversation:', error);
      return false;
    }
  };

  // Obter dados para o dashboard
  const getDashboardStats = async () => {
    if (!isAuthenticated || !currentUser) {
      return null;
    }
    
    try {
      const response = await api.get(`/user/${currentUser.user_id}/dashboard-stats`);
      
      if (response.success) {
        return response.dashboard;
      }
      
      // Dados de fallback
      return {
        totalQueries: 135,
        queriesThisMonth: 42,
        queriesThisWeek: 8,
        creditsRemaining: currentUser.credits,
        recentActivity: [
          { id: 1, type: 'query', description: 'Consulta sobre direito trabalhista', timestamp: new Date().toISOString() }
        ]
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Dados de fallback
      return {
        totalQueries: 0,
        queriesThisMonth: 0,
        queriesThisWeek: 0,
        creditsRemaining: currentUser.credits,
        recentActivity: []
      };
    }
  };

  // Obter tarefas do usuário
  const getUserTasks = async () => {
    if (!isAuthenticated || !currentUser) {
      return [];
    }
    
    try {
      const response = await api.get(`/user/${currentUser.user_id}/tasks`);
      
      if (response.success) {
        return response.tasks;
      }
      
      // Dados de fallback
      return [
        { 
          id: 1, 
          title: 'Revisar petição inicial', 
          description: 'Revisar petição inicial do processo 1234-56.2022', 
          due_date: '2025-05-15', 
          priority: 'high',
          completed: false
        },
        { 
          id: 2, 
          title: 'Audiência de conciliação', 
          description: 'Preparar documentos para audiência', 
          due_date: '2025-05-20', 
          priority: 'medium',
          completed: false
        },
        { 
          id: 3, 
          title: 'Prazo processual', 
          description: 'Prazo final para recurso no processo 9876-54.2021', 
          due_date: '2025-05-25', 
          priority: 'low',
          completed: false
        }
      ];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      
      // Dados de fallback em caso de erro
      return [
        { 
          id: 1, 
          title: 'Revisar petição inicial', 
          description: 'Revisar petição inicial do processo 1234-56.2022', 
          due_date: '2025-05-15', 
          priority: 'high',
          completed: false
        }
      ];
    }
  };

  // Obter membros da equipe
  const getTeamMembers = async () => {
    if (!isAuthenticated) {
      return [];
    }
    
    try {
      const response = await api.get('/team-members');
      
      if (response.success) {
        return response.members;
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
    
    // Dados de fallback em caso de erro
    return [
      { id: 1, name: 'Carlos Mendes', role: 'Advogado Sênior', initials: 'CM', color: '#3b82f6' },
      { id: 2, name: 'Ana Paula Silva', role: 'Advogada Tributária', initials: 'AS', color: '#f59e0b' },
      { id: 3, name: 'Roberto Almeida', role: 'Advogado Trabalhista', initials: 'RA', color: '#ef4444' },
      { id: 4, name: 'Juliana Santos', role: 'Estagiária', initials: 'JS', color: '#10b981' }
    ];
  };
  
  // Obter dados para gráficos
  const getQueryDistribution = async () => {
    if (!currentUser) {
  
      return null;
    }
    
    try {
  
      const response = await api.get(`/user/${currentUser.user_id}/query-distribution`);
  
      
      if (response.success) {
        console.log('Returning successful response data');
        return {
          distribution: response.distribution || [],
          planDistribution: response.planDistribution || []
        };
      }
    } catch (error) {
      console.error('Error fetching query distribution:', error);
    }
    
    console.log('Returning fallback data');
    // Dados de fallback em caso de erro
    return {
      distribution: [
        { label: 'Consultas Jurídicas', percentage: 55, color: '#3b82f6' },
        { label: 'Análise Documental', percentage: 20, color: '#f59e0b' },
        { label: 'Modelagem de Contratos', percentage: 15, color: '#10b981' },
        { label: 'Pesquisa de Jurisprudência', percentage: 10, color: '#64748b' }
      ],
      planDistribution: [
        { label: 'Free Trial', user_count: 5, color: '#64748b' },
        { label: 'Standard', user_count: 12, color: '#3b82f6' },
        { label: 'Profissional', user_count: 3, color: '#10b981' }
      ]
    };
  };

  const getCurrentPlanData = () => {
    // Se o usuário não estiver autenticado, retornar dados do plano gratuito
    if (!currentUser) {
      return SUBSCRIPTION_PLANS.FREE_TRIAL;
    }
    
    // Retornar os dados do plano do usuário atual
    return {
      name: currentUser.plan_name || SUBSCRIPTION_PLANS[currentUser.plan_id]?.name,
      maxQueriesPerHour: currentUser.maxQueriesPerHour || SUBSCRIPTION_PLANS[currentUser.plan_id]?.maxQueriesPerHour,
      maxTokensPerHour: currentUser.maxTokensPerHour || SUBSCRIPTION_PLANS[currentUser.plan_id]?.maxTokensPerHour,
      historyRetention: currentUser.historyRetention || SUBSCRIPTION_PLANS[currentUser.plan_id]?.historyRetention,
      price: SUBSCRIPTION_PLANS[currentUser.plan_id]?.price,
      color: currentUser.plan_color || SUBSCRIPTION_PLANS[currentUser.plan_id]?.color,
      features: SUBSCRIPTION_PLANS[currentUser.plan_id]?.features || []
    };
  };

  // Verificar se o usuário tem acesso a um recurso específico
  const hasAccess = (resourceCompanyId) => {
    if (!currentUser) return false;
    
    // Super admin tem acesso a tudo
    if (currentUser.role === 'superadmin') return true;
    
    // Verificar se o recurso pertence à mesma empresa do usuário
    return currentUser.company_id === resourceCompanyId;
  };

  // Verificar se o usuário tem acesso administrativo
  const hasAdminAccess = () => {
    if (!currentUser) return false;
    
    // Verificar se o token é válido
    const token = getStoredToken();
    if (!token) return false;
    
    try {
      // Basic token validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        removeStoredToken();
        return false;
      }
      
      // Check expiration
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp * 1000 < Date.now()) {
        removeStoredToken();
        return false;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
    
    // Verificar se o usuário tem a role de admin
    return currentUser.role === 'admin' || currentUser.role === 'superadmin';
  };

  // Funções para gerenciar configurações do sistema
  const getSystemSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || 'Failed to get settings' };
    } catch (error) {
      console.error('Error getting system settings:', error);
      return { success: false, message: 'Error getting system settings: ' + (error.message || 'Unknown error') };
    }
  };

  const saveSystemSettings = async (settings) => {
    try {
      const response = await api.post('/admin/settings', { settings });
      if (response.success) {
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to save settings' };
    } catch (error) {
      console.error('Error saving system settings:', error);
      return { success: false, message: 'Error saving system settings: ' + (error.message || 'Unknown error') };
    }
  };

  const resetSystemSettings = async () => {
    try {
      const response = await api.post('/admin/settings/reset');
      if (response.success) {
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to reset settings' };
    } catch (error) {
      console.error('Error resetting system settings:', error);
      return { success: false, message: 'Error resetting system settings: ' + (error.message || 'Unknown error') };
    }
  };

  const getSettingsHistory = async () => {
    try {
      const response = await api.get('/admin/settings/history');
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message || 'Failed to get settings history' };
    } catch (error) {
      console.error('Error getting settings history:', error);
      return { success: false, message: 'Error getting settings history: ' + (error.message || 'Unknown error') };
    }
  };

  const loadUsageStats = async () => {
    try {
      if (!currentUser?.user_id) {
        console.log('DEBUG: loadUsageStats - Usuário não autenticado');
        return { success: false, message: 'Usuário não autenticado' };
      }

      console.log('DEBUG: loadUsageStats - Carregando estatísticas para usuário:', currentUser.user_id);
      
      const response = await api.get(`/user/${currentUser.user_id}/usage-stats`);
      
      if (response.success) {
        console.log('DEBUG: loadUsageStats - Estatísticas carregadas:', response.data);
        setUsageStats(response.data);
        return { success: true, data: response.data };
      } else {
        console.error('DEBUG: loadUsageStats - Erro na resposta:', response.message);
        return { success: false, message: response.message || 'Erro ao carregar estatísticas' };
      }
    } catch (error) {
      console.error('DEBUG: loadUsageStats - Erro:', error);
      return { success: false, message: 'Erro ao carregar estatísticas: ' + (error.message || 'Unknown error') };
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      isLoading,
      error,
      usageStats,
      authLogs,
      users,
      isLoadingUsers,
      setIsLoadingUsers,
      login,
      logout,
      loadAuthLogs,
      loadUsers,
      addUser,
      updateUser,
      removeUser,
      addCredits,
      changePlan,
      processAiQuery,
      getQueryHistory,
    getChatHistory,
    saveChatConversation,
    updateChatConversation,
    removeChatConversation,
      getDashboardStats,
      getUserTasks,
      getTeamMembers,
      getQueryDistribution,
      getCurrentPlanData,
      hasAccess,
      hasAdminAccess,
      getSystemSettings,
      saveSystemSettings,
      resetSystemSettings,
      getSettingsHistory,
      loadUsageStats,
      currentPage,
      totalPages,
      totalItems,
      api,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 