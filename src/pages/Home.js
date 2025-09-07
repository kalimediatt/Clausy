import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSetup } from '../contexts/SetupContext';
import {
  FaCog,
  FaChartBar,
  FaTimes,
  FaCheck,
  FaRobot,
  FaPaperPlane,
  FaClock,
  FaPlus,
  FaChartLine,
  FaCode,
  FaCommentDots,
  FaHistory,
  FaCopy,
  FaTrash,
  FaFileAlt,
  FaShieldAlt,
  FaChevronDown,
  FaEllipsisV,
  FaUserTie,
  FaUsers,
  FaTags,
  FaFileWord,
  FaFilePdf,
  FaDownload
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType } from 'docx';
import jsPDF from 'jspdf';

import SecurityPanel from './SecurityPanel';
import Sidebar from '../components/Sidebar';
import Config from './Config';
import Profile from './Profile';
import Reports from './Reports';
import { 
  validateMessage, 
  handleError, 
  showSuccessToast, 
  showErrorToast,
  showInfoToast,
  useKeyboardShortcuts,
  LoadingSpinner,
  EmptyState,
  useAutoScroll,
  formatTime
} from '../utils/essentialImprovements';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Container convertido para Tailwind (flex h-screen bg-gray-800 text-gray-300)




const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #64748b;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.variant === 'primary' ? '#8C4B35' : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : '#2B2B2B'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#2B2B2B' : '#ADADAD'};
  }
`;



// Função para gerar session_id único por sessão de login
function generateSessionId(userId) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const time = now.toISOString().slice(11, 17).replace(/:/g, ''); // HHMMSS
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${userId}_session_${date}_${time}_${random}`;
}

// Função para obter ou criar session_id da sessão atual
function getCurrentSessionId(userId) {
  const sessionKey = `user:${userId}:current_session`;
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = generateSessionId(userId);
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
}

// Função para gerar nome de sessão
function generateSessionName() {
  const now = new Date();
  return `Sessão ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Adicione a função para buscar os chats do backend:
// IMPORTANTE: A API externa espera POST com body JSON, mesmo para buscas (não GET com body)
async function fetchLabChatsFromBackend() {
  try {
    // Buscar históricos através do backend (proxy)
    const response = await fetch('http://138.197.27.151:5000/api/lab-chats/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        chat_name: "all" // Buscar todos os chats
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar chats da API externa');
    }
    
    const data = await response.json();
    
    
    // Processar os dados recebidos da API
    if (Array.isArray(data)) {
      return data;
    } else if (data.chats && Array.isArray(data.chats)) {
      return data.chats;
    } else {
      return [];
    }
  } catch (err) {
    console.error('Erro ao buscar chats do laboratório:', err);
    return [];
  }
}

// Função para salvar chat no Redis
async function saveLabChatToRedis(userId, chatName, sessionId) {
  try {
    const response = await fetch('http://138.197.27.151:5000/api/lab-chats/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        user_id: userId,
        chat_name: chatName,
        session_id: sessionId
      })
    });
    const data = await response.json();
    return data.chats || [];
  } catch (err) {
    console.error('Erro ao salvar chat no Redis:', err);
    return [];
  }
}

// Função para ocultar chat do Redis
async function hideLabChat(userId, sessionId) {
  try {
    const response = await fetch('http://138.197.27.151:5000/api/lab-chats/hide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId
      })
    });
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error('Erro ao ocultar chat:', err);
    return false;
  }
}

// Função para listar chats do Redis
async function fetchLabChatsFromRedis(userId) {
  try {
    // Buscar todos os chats do usuário (incluindo sessões anteriores)
    const currentSessionId = getCurrentSessionId(userId);
    const response = await fetch(`http://138.197.27.151:5000/api/lab-chats/all?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'X-Current-Session-Id': currentSessionId
      }
    });
    const data = await response.json();
    return data.chats || [];
  } catch (err) {
    console.error('Erro ao buscar chats do Redis:', err);
    return [];
  }
}

const Home = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    logout, 
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
    loadUsers,
    loadAuthLogs,
    loadUsageStats,
    authLogs,
    usageStats,
    currentPage,
    totalPages,
    totalItems
  } = useAuth();
  const { selectedSetup, setSelectedSetup, setups } = useSetup();
  
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [language, setLanguage] = useState('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [creditsAmount, setCreditsAmount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userTasks, setUserTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [queryDistributionData, setQueryDistributionData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersCache, setUsersCache] = useState([]);
  const [lastUsersLoad, setLastUsersLoad] = useState(null);
  const [, setCurrentPage] = useState(1);
  const [logFilter, setLogFilter] = useState('all');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJudgeMenuOpen, setIsJudgeMenuOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState('Todos os Juízes');

  const [fileContent, setFileContent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedSetupState, setSelectedSetupState] = useState(null);
  const [keepFileAttached, setKeepFileAttached] = useState(false);
  const [securityFilter, setSecurityFilter] = useState('all');
  const [securityPage, setSecurityPage] = useState(currentPage || 1);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState(null);

  // Estados para histórico de conversas
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);

  // Estado para modal lateral do histórico
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Estados para o Laboratório (separados da IA)
  const [labMessages, setLabMessages] = useState([]);
  const [labInput, setLabInput] = useState('');
  const labTextareaRef = useRef(null);
  const labFileInputRef = useRef(null);
  const [isLabTyping, setIsLabTyping] = useState(false);
  const [labSelectedFile, setLabSelectedFile] = useState(null);
  const [labShowSetupModal, setLabShowSetupModal] = useState(false);
  const [labSelectedSetupState, setLabSelectedSetupState] = useState(null);
  const [labShowNewChatModal, setLabShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // Hook para detectar tamanho da tela
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width <= 1024);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('.desktop-menu-container')) {
        setIsMobileMenuOpen(false);
      }
      if (isJudgeMenuOpen && !event.target.closest('.judge-menu-container')) {
        setIsJudgeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isJudgeMenuOpen]);
  

  
  // useEffect para garantir que o modal seja resetado corretamente
  useEffect(() => {
    if (!labShowNewChatModal) {
      // Resetar o nome do chat quando o modal for fechado
      setNewChatName('');
      setIsCreatingChat(false);
    }
  }, [labShowNewChatModal]);
  const [labShowInitialChatModal, setLabShowInitialChatModal] = useState(true);
  const [showChipJuridicoModal, setShowChipJuridicoModal] = useState(false);
  
  // Estados para Chip Jurídico - áreas do direito
  const [chipJuridicoAreas, setChipJuridicoAreas] = useState({
    civil: false,
    trabalhista: false,
    contratos: false,
    empresarial: false,
    penal: false,
    tributario: false,
    administrativo: false,
    consumidor: false,
    previdenciario: false,
    ambiental: false,
    imobiliario: false,
    familia: false,
    bancario: false,
    compliance: false,
    aduaneiro: false,
    eleitoral: false
  });
  const [initialChatName, setInitialChatName] = useState('');
  const [labKeepFileAttached, setLabKeepFileAttached] = useState(false);
  const [labShowHistorySidebar, setLabShowHistorySidebar] = useState(false);
  
  // Estados para drag and drop
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Limpar estados de drag and drop quando sair do laboratório
  useEffect(() => {
    if (activeItem !== 'laboratory') {
      setIsDragOver(false);
      setDragCounter(0);
    }
  }, [activeItem]);
  const [labChatHistory, setLabChatHistory] = useState([]);
  const [labSelectedConversation, setLabSelectedConversation] = useState(null);
  const [labSelectedChatName, setLabSelectedChatName] = useState(null);
  const [labHistoryLoading, setLabHistoryLoading] = useState(false);
  // [1] Adicione o estado para mensagens pendentes do laboratório
  const [labPendingMessages, setLabPendingMessages] = useState([]);
  // [1] Estados segmentados por chat
  const [labMessagesByChat, setLabMessagesByChat] = useState({});
  const [labPendingMessagesByChat, setLabPendingMessagesByChat] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false); // Controla se os dados já foram carregados

  // Hook para detectar orientação do dispositivo
  const [isLandscape, setIsLandscape] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Funções seguras para acessar propriedades de objetos
  const safeGet = (obj, key, defaultValue = null) => {
    if (obj && typeof obj === 'object' && key in obj) {
      return obj[key];
    }
    return defaultValue;
  };

  const safeSet = (obj, key, value) => {
    if (obj && typeof obj === 'object') {
      obj[key] = value;
    }
    return obj;
  };

  // Função utilitária para obter a chave do chat
  const getCurrentLabChatKey = () => {
    const key = labSelectedChatName || labSelectedConversation || 'default';
    
    return key;
  };

  const chatEndRef = useRef(null);
  const labChatEndRef = useRef(null);
  const labChatContainerRef = useRef(null);
  
  // Auto-scroll inteligente
  const chatScrollRef = useAutoScroll([safeGet(labMessagesByChat, labSelectedChatName || labSelectedConversation || 'default', [])]);
  const aiScrollRef = useAutoScroll([messages]);

  // Função para fazer scroll do lab chat
  const scrollLabChatToBottom = () => {
    setTimeout(() => {
      if (labChatContainerRef.current) {
        labChatContainerRef.current.scrollTop = labChatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Função melhorada para scroll no mobile
  const scrollToBottomMobile = useCallback(() => {
    if (labChatContainerRef.current) {
      const container = labChatContainerRef.current;
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Scroll mais suave no mobile
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const tasks = await getUserTasks();
      setUserTasks(tasks || []);
    } catch (error) {
      handleError(error, 'carregamento de tarefas');
    }
  }, [getUserTasks]);

  const loadTeamMembers = useCallback(async () => {
    try {
      const members = await getTeamMembers();
      setTeamMembers(members || []);
    } catch (error) {
      handleError(error, 'carregamento de membros da equipe');
    }
  }, [getTeamMembers]);

  const loadQueryDistribution = useCallback(async () => {
    try {
      const distribution = await getQueryDistribution();
      setQueryDistributionData(distribution || null);
    } catch (error) {
      handleError(error, 'carregamento de distribuição de consultas');
    }
  }, [getQueryDistribution]);

  // Efeito único para carregar dados iniciais
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      // Carregar todos os dados necessários em paralelo para evitar requests simultâneos
      Promise.all([
        loadInitialData(),
        loadUsageStats(),
        loadAuthLogs()
      ]).then(() => {
        setDataLoaded(true); // Marca que os dados foram carregados
      }).catch(error => {
        console.error('Erro ao carregar dados iniciais:', error);
      });
    }
  }, [currentUser, dataLoaded]); // Adicionado dataLoaded para evitar carregamentos duplicados

  // Efeito para carregar dados específicos da aba
  useEffect(() => {
    if (!currentUser || !dataLoaded) return; // Aguarda os dados iniciais serem carregados

    if (activeItem === 'users') {
      setIsLoadingUsers(true);
      loadUsers(true) // Força refresh para garantir dados corretos
        .then(result => {
          if (result) {
            setUsersCache(result);
            setLastUsersLoad(Date.now());
          } else {
            setUsersCache([]);
            setLastUsersLoad(null);
          }
        })
        .catch(error => {
          handleError(error, 'carregamento de usuários');
          setUsersCache([]);
          setLastUsersLoad(null);
        })
        .finally(() => setIsLoadingUsers(false));
    } else if (activeItem === 'security') {
      // Carregar logs apenas se mudou de página (os dados já foram carregados no useEffect inicial)
      if (currentPage !== undefined) {
        setIsLoading(true);
        loadAuthLogs(currentPage)
          .catch(error => {
            handleError(error, 'carregamento de logs de autenticação');
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [activeItem, currentUser, currentPage, dataLoaded]); // Adicionado dataLoaded para evitar requests prematuros

  // Efeito para rolar o chat para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Efeito para garantir que o input permaneça visível e o scroll funcione corretamente
  useEffect(() => {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };
      
      // Scroll inicial
      scrollToBottom();
      
      // Observer para mudanças no conteúdo
      const resizeObserver = new ResizeObserver(scrollToBottom);
      resizeObserver.observe(chatMessages);
      
      // Observer para mudanças nas mensagens
      const mutationObserver = new MutationObserver(scrollToBottom);
      mutationObserver.observe(chatMessages, {
        childList: true,
        subtree: true
      });
      
      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [messages]);

  // Efeito para rolar o chat do laboratório para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    scrollLabChatToBottom();
  }, [labMessages]);

  // Efeito para rolar o chat do laboratório quando as mensagens são carregadas
  useEffect(() => {
    const currentChatKey = getCurrentLabChatKey();
    const currentMessages = safeGet(labMessagesByChat, currentChatKey, []);
    
    if (currentMessages.length > 0) {
      scrollToBottomMobile();
    }
  }, [labMessagesByChat, labSelectedChatName, labSelectedConversation, scrollToBottomMobile]);

  // Função para limpar todo o cache de mensagens
  const clearMessageCache = useCallback(() => {
    setLabMessagesByChat({});
    setLabPendingMessagesByChat({});

  }, []);

  // Efeito para carregar históricos do laboratório quando acessar o painel
  useEffect(() => {
    if (activeItem === 'laboratory' && currentUser) {
      // Limpar cache ao acessar o painel
      clearMessageCache();
      
      setLabHistoryLoading(true);
      fetchLabChatsFromRedis(currentUser.user_id || currentUser.id).then(chats => {
        setLabChatHistory(chats);
        setLabHistoryLoading(false);
      });
    }
  }, [activeItem, currentUser, clearMessageCache]);

  // Função para carregar histórico de conversas
  const loadChatHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const history = await getChatHistory();
      setChatHistory(history || []);
    } catch (error) {
      handleError(error, 'carregamento de histórico de conversas');
    } finally {
      setHistoryLoading(false);
    }
  }, [getChatHistory]);

  // Efeito para carregar histórico de conversas da IA
  useEffect(() => {
    if (activeItem === 'ai') {
      // Carregar do Redis
      loadChatHistory();
    }
  }, [activeItem]); // Removida dependência de função que causava re-renders

  // Efeito para recarregar mensagens quando o chat selecionado mudar
  useEffect(() => {
    if (labSelectedChatName && activeItem === 'laboratory') {
      // Limpar cache antes de carregar mensagens
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        // Manter apenas o chat atual, limpar outros
        const currentChatMessages = newState[labSelectedChatName] || [];
        return { [labSelectedChatName]: currentChatMessages };
      });
      
      setLabPendingMessagesByChat(prev => {
        const newState = { ...prev };
        // Manter apenas o chat atual, limpar outros
        const currentPendingMessages = newState[labSelectedChatName] || [];
        return { [labSelectedChatName]: currentPendingMessages };
      });
      

      loadChatMessages(labSelectedChatName, true);
    }
  }, [labSelectedChatName, activeItem]); // Mantidas apenas dependências essenciais

  // Atalhos de teclado
  useKeyboardShortcuts({
    sendMessage: () => {
      if (activeItem === 'laboratory') handleLabSendMessage();
      else if (activeItem === 'ai') handleSendMessage();
    },
    newChat: () => {
      if (activeItem === 'laboratory') {
        // Deselecionar chat atual
        setLabSelectedConversation(null);
        setLabSelectedChatName(null);
        setLabMessages([]);
        setLabInput('');
        setLabSelectedFile(null);
        
        // Limpar cache de mensagens
        setLabMessagesByChat({});
        setLabPendingMessagesByChat({});
        
  
        
        // Abrir modal de novo chat
        setLabShowNewChatModal(true);
      }
    },
    escape: () => {
      setLabShowSetupModal(false);
      setLabShowNewChatModal(false);
      setLabShowInitialChatModal(false);
    }
  });



  const loadInitialData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      await Promise.all([
        loadTasks(),
        loadTeamMembers(),
        loadQueryDistribution()
      ]);
    } catch (error) {
      handleError(error, 'carregamento de dados iniciais');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, loadTasks, loadTeamMembers, loadQueryDistribution]);

  // Função para salvar conversa atual no histórico
  const saveCurrentConversation = useCallback(async () => {
    if (!messages.length) return;
    
    try {
      // Criar nova conversa (apenas para novos chats)
      const conversation = {
        id: Date.now().toString(),
        title: messages[0]?.content?.substring(0, 50) + "..." || `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
        timestamp: new Date().toISOString(),
        preview: messages[messages.length - 1]?.content?.substring(0, 100) || 'Sem preview',
        messages: [...messages]
      };
      
      // Salvar no Redis
      const success = await saveChatConversation(conversation);
      if (success) {
        // Atualizar estado local
        setChatHistory(prev => [conversation, ...prev.slice(0, 49)]); // Manter apenas 50 conversas
        setSelectedConversation(conversation.id);
      }
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
    }
  }, [messages, saveChatConversation]);

  // Função para carregar conversa do histórico
  const loadConversation = useCallback(async (conversationId) => {
    try {
      const conversation = chatHistory.find(conv => conv.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversationId);
        setMessages(conversation.messages || []);
        setChatInput('');
        setSelectedFile(null);
      }
    } catch (error) {
      handleError(error, 'carregamento de conversa');
    }
  }, [chatHistory]);

  // Funções para Chip Jurídico
  const handleChipJuridicoAreaChange = (area) => {
    // Limpar todas as seleções e marcar apenas a área clicada
    const newState = {};
    Object.keys(chipJuridicoAreas).forEach(key => {
      newState[key] = false;
    });
    newState[area] = true;
    setChipJuridicoAreas(newState);
  };


  const handleChipJuridicoClearAll = () => {
    const newState = {};
    Object.keys(chipJuridicoAreas).forEach(key => {
      newState[key] = false;
    });
    setChipJuridicoAreas(newState);
  };

  const getSelectedAreas = () => {
    return Object.entries(chipJuridicoAreas)
      .filter(([_, selected]) => selected)
      .map(([area, _]) => area);
  };

  const getSelectedAreasDisplay = () => {
    const areaNames = {
      civil: 'Cível',
      trabalhista: 'Trabalhista',
      contratos: 'Contratos',
      empresarial: 'Empresarial',
      penal: 'Penal',
      tributario: 'Tributário',
      administrativo: 'Administrativo',
      consumidor: 'Consumidor',
      previdenciario: 'Previdenciário',
      ambiental: 'Ambiental',
      imobiliario: 'Imobiliário',
      familia: 'Família',
      bancario: 'Bancário/Capital',
      compliance: 'Compliance',
      aduaneiro: 'Aduaneiro',
      eleitoral: 'Eleitoral'
    };
    
    return getSelectedAreas().map(area => areaNames[area]).join(', ');
  };

  const getSelectedChipJuridicoMode = () => {
    const selectedAreas = getSelectedAreas();
    return selectedAreas.length > 0 ? selectedAreas[0] : null;
  };

  // Funções de Exportação
  const getAreaName = (areaKey) => {
    const areaNames = {
      civil: 'Cível',
      trabalhista: 'Trabalhista',
      contratos: 'Contratos',
      empresarial: 'Empresarial',
      penal: 'Penal',
      tributario: 'Tributário',
      administrativo: 'Administrativo',
      consumidor: 'Consumidor',
      previdenciario: 'Previdenciário',
      ambiental: 'Ambiental',
      imobiliario: 'Imobiliário',
      familia: 'Família',
      bancario: 'Bancário/Capital',
      compliance: 'Compliance',
      aduaneiro: 'Aduaneiro',
      eleitoral: 'Eleitoral'
    };
    return areaNames[areaKey] || 'Não especificada';
  };

  const exportToWord = async () => {
    try {
      console.log('Iniciando exportação para Word...');
      
      const currentChatKey = getCurrentLabChatKey();
      const messages = safeGet(labMessagesByChat, currentChatKey, []);
      
      console.log('Chat key:', currentChatKey);
      console.log('Mensagens encontradas:', messages.length);
      
      if (messages.length === 0) {
        toast.error('Nenhuma mensagem para exportar');
        return;
      }

      const selectedMode = getSelectedChipJuridicoMode();
      const areaName = getAreaName(selectedMode);
      
      console.log('Criando documento Word...');
      
      // Criar documento Word com estrutura mais simples e robusta
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Cabeçalho
            new Paragraph({
              children: [
                new TextRun({
                  text: "CONVERSA - CENTRAL JURÍDICA CLAUSY",
                  bold: true,
                  size: 32
                })
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            
            // Metadados
            new Paragraph({
              children: [
                new TextRun({
                  text: `Chat: ${currentChatKey}`,
                  bold: true,
                  size: 24
                })
              ],
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Modo: ${labSelectedSetupState?.title || 'Não selecionado'}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Área Jurídica: ${areaName}`,
                  size: 20
                })
              ],
              spacing: { after: 400 }
            }),

            // Mensagens
            ...messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isError = message.role === 'error';
              
              // Limpar conteúdo da mensagem para evitar caracteres problemáticos
              const cleanContent = message.content ? message.content.toString().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') : '';
              
              return new Paragraph({
                children: [
                  new TextRun({
                    text: `${isUser ? 'USUÁRIO' : isError ? 'ERRO' : 'CLAUSY - IA'}: `,
                    bold: true,
                    size: 22
                  }),
                  new TextRun({
                    text: cleanContent,
                    size: 20
                  })
                ],
                spacing: { 
                  after: 300,
                  before: index === 0 ? 0 : 200
                }
              });
            })
          ]
        }]
      });

      console.log('Gerando blob do documento...');
      
      // Gerar blob diretamente (compatível com navegador)
      const blob = await Packer.toBlob(doc);
      
      console.log('Blob gerado, tamanho:', blob.size);
      
      // Criar URL e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversa-clausy-${currentChatKey}-${new Date().toISOString().split('T')[0]}.docx`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download iniciado com sucesso!');
      toast.success('Conversa exportada para Word com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para Word:', error);
      console.error('Stack trace:', error.stack);
      toast.error(`Erro ao exportar para Word: ${error.message}`);
    }
  };

  const exportToPDF = async () => {
    try {
      const currentChatKey = getCurrentLabChatKey();
      const messages = safeGet(labMessagesByChat, currentChatKey, []);
      
      if (messages.length === 0) {
        toast.error('Nenhuma mensagem para exportar');
        return;
      }

      const selectedMode = getSelectedChipJuridicoMode();
      const areaName = getAreaName(selectedMode);
      
      // Criar PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Função para adicionar nova página se necessário
      const checkNewPage = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONVERSA - CENTRAL JURÍDICA CLAUSY', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Metadados
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Chat: ${currentChatKey}`, margin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Modo: ${labSelectedSetupState?.title || 'Não selecionado'}`, margin, yPosition);
      yPosition += lineHeight;
      
      pdf.text(`Área Jurídica: ${areaName}`, margin, yPosition);
      yPosition += 15;

      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Mensagens
      messages.forEach((message, index) => {
        const isUser = message.role === 'user';
        const isError = message.role === 'error';
        
        // Verificar se precisa de nova página
        checkNewPage(20);

        // Cabeçalho da mensagem
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        const roleText = isUser ? 'USUÁRIO' : isError ? 'ERRO' : 'CLAUSY - IA';
        const roleColor = isUser ? [37, 99, 235] : isError ? [220, 38, 38] : [5, 150, 105];
        
        pdf.setTextColor(roleColor[0], roleColor[1], roleColor[2]);
        pdf.text(`${roleText}:`, margin, yPosition);
        yPosition += lineHeight;

        // Conteúdo da mensagem
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        
        // Quebrar texto em linhas
        const content = message.content;
        const lines = pdf.splitTextToSize(content, maxWidth);
        
        lines.forEach(line => {
          checkNewPage(lineHeight);
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        // Espaçamento entre mensagens
        yPosition += 8;
        
        // Linha separadora sutil
        if (index < messages.length - 1) {
          checkNewPage(5);
          pdf.setDrawColor(240, 240, 240);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }
      });

      // Baixar arquivo
      const fileName = `conversa-clausy-${currentChatKey}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Conversa exportada para PDF com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      toast.error('Erro ao exportar para PDF');
    }
  };






  const formatChatTime = (isoDate) => {
    return formatTime(isoDate);
  };



  const handleModalSubmit = async () => {
    if (modalType === 'credits' && selectedUser) {
      try {
        const result = await addCredits(selectedUser.user_id, creditsAmount);
        if (result.success) {
          toast.success('Créditos adicionados com sucesso!');
          setModalOpen(false);
          setCreditsAmount(0);
          setSelectedUser(null);
        } else {
          toast.error(result.message || 'Erro ao adicionar créditos');
        }
      } catch (error) {
        toast.error('Erro ao adicionar créditos');
      }
    }
  };



  // Funções para o Laboratório
  const handleLabFileUpload = (file) => {
    setLabSelectedFile(file);
    if (!file) {
      setLabSelectedFile(null);
    } else {
      showSuccessToast('Arquivo anexado com sucesso!');
    }
  };

  const handleLabFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar tamanho do arquivo (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showErrorToast('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      
      handleLabFileUpload(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Funções para drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DragEnter - tipos:', e.dataTransfer?.types);
    
    setDragCounter(prev => prev + 1);
    
    // Verificar se há arquivos sendo arrastados
    if (e.dataTransfer?.types?.includes('Files') || e.dataTransfer?.files?.length > 0) {
      console.log('✅ Ativando overlay de drag');
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      console.log('DragLeave - counter:', newCount);
      
      if (newCount <= 0) {
        console.log('❌ Desativando overlay de drag');
        setIsDragOver(false);
        return 0;
      }
      return newCount;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Definir o efeito visual do cursor
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== DRAG AND DROP INICIADO ===');
    
    // Resetar estados
    setIsDragOver(false);
    setDragCounter(0);
    
    // Verificar se há arquivos
    console.log('DataTransfer:', e.dataTransfer);
    console.log('Files:', e.dataTransfer?.files);
    console.log('Files length:', e.dataTransfer?.files?.length);
    
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) {
      console.log('❌ Nenhum arquivo encontrado');
      showErrorToast('Nenhum arquivo foi detectado. Tente novamente.');
        return;
      }
      
    const file = e.dataTransfer.files[0];
    console.log('✅ Arquivo detectado:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Usar a mesma lógica do botão +
    console.log('🔄 Chamando handleLabFileSelect...');
    
    // Simular event do input file
    const fakeEvent = {
      target: {
        files: [file],
        value: ''
      }
    };
    
    handleLabFileSelect(fakeEvent);
    console.log('=== DRAG AND DROP CONCLUÍDO ===');
  };

  // [3] Atualize handleLabSendMessage para usar o chat atual

  // [3] Atualize handleLabSendMessage para usar o chat atual
  const handleLabSendMessage = async () => {
    
    
    if (!labInput.trim() && !labSelectedFile) {
      
      return;
    }
    
    // Validação da mensagem (apenas se houver texto)
    if (labInput.trim()) {
      const validation = validateMessage(labInput);
      if (!validation.valid) {
        showInfoToast(validation.error);
        return;
      }
    }
    // Definir chatKey inicialmente
    let chatKey = getCurrentLabChatKey();
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: labSelectedFile 
        ? (labInput.trim() ? `${labInput} (Arquivo anexado: ${labSelectedFile.name})` : `Arquivo enviado: ${labSelectedFile.name}`)
        : labInput,
      timestamp: new Date().toISOString()
    };
    
    setLabInput('');
    setIsLabTyping(true);
    
    // Mostrar indicador de processamento
    showInfoToast('Processando sua mensagem...');
    try {
              // Montar os dados para a API
      // Cada setup tem um promptId fixo
      let promptId;
      if (labSelectedSetupState?.title === "IA Clausy") {
        promptId = 0;
      } else if (labSelectedSetupState?.title === "Pesquisador de Jurisprudência Atualizada") {
        promptId = 2;
      } else if (labSelectedSetupState?.title === "Redator Jurídico Técnico") {
        promptId = 8;
      } else if (labSelectedSetupState?.title === "Avaliador Técnico-Jurídico") {
        promptId = 4;
      } else if (labSelectedSetupState?.title === "Mentor Jurídico Educacional") {
        promptId = 5;
      } else if (labSelectedSetupState?.title === "Analisador de Erros Repetitivos") {
        promptId = 6;
      } else if (labSelectedSetupState?.title === "Transcritor Jurídico Inteligente") {
        promptId = 7;
      } else if (labSelectedSetupState?.title === "Adaptador de Textos Jurídicos") {
        promptId = 3;
      } else if (labSelectedSetupState?.title === "Analisador de Conformidade e Risco") {
        promptId = 9;
      } else if (labSelectedSetupState?.title === "Copiloto Jurídico Avançado") {
        promptId = 1;
      } else {
        promptId = 0; // Fallback padrão
      }
      const conteudo = userMessage.content;
  
      const userPlan = currentUser?.plan_id || currentUser?.plan_name || '';
      const userId = currentUser?.user_id || currentUser?.id || '';
      

      
      // Usar chat_name como chave principal para identificar o chat
      let session_id;
      let chat_name;
      
      // Priorizar o chat_name do chat selecionado
      if (labSelectedChatName) {
        chat_name = labSelectedChatName;
        // Procurar o session_id correspondente no histórico
        if (labChatHistory && labChatHistory.length > 0) {
          const selectedChat = labChatHistory.find(
            c => c.chat_name === labSelectedChatName || c.name === labSelectedChatName
          );
          if (selectedChat) {
            session_id = selectedChat.session_id || labSelectedConversation;
          } else {
            session_id = labSelectedConversation || getCurrentSessionId(currentUser?.user_id || currentUser?.id || '');
          }
        } else {
          session_id = labSelectedConversation || getCurrentSessionId(currentUser?.user_id || currentUser?.id || '');
        }
      } else if (!labSelectedChatName) {
        // Criar novo chat com nome baseado na primeira mensagem do usuário
        session_id = labSelectedConversation || getCurrentSessionId(currentUser?.user_id || currentUser?.id || '');
        
        // Usar a primeira mensagem do usuário como nome do chat
        if (labInput.trim()) {
          // Pegar as primeiras palavras da mensagem (máximo 30 caracteres)
          const messageWords = labInput.trim().split(' ').slice(0, 5).join(' ');
          chat_name = messageWords.length > 30 ? messageWords.substring(0, 30) + '...' : messageWords;
        } else if (labSelectedFile) {
          // Se não há texto mas há arquivo, usar o nome do arquivo
          chat_name = labSelectedFile.name.length > 30 ? labSelectedFile.name.substring(0, 30) + '...' : labSelectedFile.name;
        } else {
          // Fallback para data
          chat_name = `Chat ${new Date().toLocaleDateString('pt-BR')}`;
        }
      } else {
        // Chat já existe, usar o nome e session_id existentes
        chat_name = labSelectedChatName;
        session_id = labSelectedConversation || getCurrentSessionId(currentUser?.user_id || currentUser?.id || '');
      }
      
      // Atualizar chatKey se for um novo chat
      if (!labSelectedChatName) {
        chatKey = chat_name;
  
      }
      
      // Adicionar mensagem do usuário ao chat correto
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        const currentMessages = safeGet(newState, chatKey, []);
        const updatedMessages = [...currentMessages, userMessage];
        safeSet(newState, chatKey, updatedMessages);
        return newState;
      });
      


      let response;
      if (labSelectedFile) {

        // Envia como FormData se houver arquivo
        const formData = new FormData();
        formData.append('prompt', promptId);
        formData.append('conteudo', conteudo);
        formData.append('userPlan', userPlan);
        formData.append('id', userId);
        formData.append('user_id', userId);
        formData.append('chat_name', chat_name);
        formData.append('session_id', session_id);
        formData.append('file', labSelectedFile);
        
        // Adiciona o parâmetro mode do Chip Jurídico
        const selectedMode = getSelectedChipJuridicoMode();
        if (selectedMode) {
          formData.append('mode', selectedMode);
        }

        // Timeout de 30 segundos para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        response = await fetch('http://138.197.27.151:5000/api/lab-chats/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
      } else {

        // Envia como JSON se não houver arquivo
        const body = {
          prompt: promptId,
          conteudo,
          userPlan,
          id: userId,
          user_id: userId,
          chat_name,
          session_id
        };
        
        // Adiciona o parâmetro mode do Chip Jurídico
        const selectedMode = getSelectedChipJuridicoMode();
        if (selectedMode) {
          body.mode = selectedMode;
        }

        // Timeout de 30 segundos para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        response = await fetch('http://138.197.27.151:5000/api/lab-chats/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro na resposta da API do laboratório');
      }

      // Verificar se a resposta está vazia ou inválida
      if (!response) {
        throw new Error('Resposta vazia da API do laboratório');
      }

      const data = await response.json();
      
      // Debug: verificar a estrutura da resposta

      
      // Processamento robusto da resposta da IA
      let content = 'Resposta recebida da API, mas sem mensagem.';
      let found = false;
      
      // Função auxiliar para extrair conteúdo de uma mensagem
      const extractContent = (item) => {
        if (item && typeof item === 'object') {
          // Caso 1: Resposta direta da IA
          if (item.type === 'ai' && item.content) {
            return item.content;
          }
          // Caso 2: Mensagem aninhada
          if (item.message && item.message.type === 'ai' && item.message.content) {
            return item.message.content;
          }
          // Caso 3: Conteúdo direto
          if (item.content) {
            return item.content;
          }
        }
        return null;
      };
      
      // Estratégia 1: Resposta direta
      if (data && data.type === 'ai' && data.content) {
        content = data.content;
        found = true;

      }
      // Estratégia 2: Array de mensagens
      else if (Array.isArray(data) && data.length > 0) {

        // Procurar a última mensagem da IA
        for (let i = data.length - 1; i >= 0; i--) {
          const extracted = extractContent(data[i]);
          if (extracted) {
            content = extracted;
            found = true;

            break;
          }
        }
      }
      // Estratégia 3: Objeto com propriedades (chats históricos)
      else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {

        
        // Encontrar todas as propriedades que contêm mensagens
        const messageKeys = Object.keys(data).filter(key => {
          const item = data[key];
          return typeof item === 'object' && item !== null && (item.message || item.type === 'ai');
        });
        
        
        
        if (messageKeys.length > 0) {
          // Ordenar por número (maior primeiro) para pegar a última mensagem
          const sortedKeys = messageKeys.sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return isNaN(numA) || isNaN(numB) ? 0 : numB - numA;
          });
          
          
          
          // Tentar cada chave até encontrar a ÚLTIMA resposta da IA
          for (const key of sortedKeys) {
            const item = data[key];
            if (item && item.message && item.message.type === 'ai' && item.message.content) {
              content = item.message.content;
              found = true;

              break;
            }
          }
        }
        
        // Se não encontrou nas chaves numeradas, verificar resposta direta no objeto
        if (!found && data.message) {
          const extracted = extractContent(data);
          if (extracted) {
            content = extracted;
            found = true;
    
          }
        }
      }
      
      // Estratégia 4: Fallbacks para estruturas específicas
      if (!found) {

        
        if (data && data.message && typeof data.message === 'string') {
          content = data.message;
          found = true;
        } else if (data && data.result) {
          content = data.result;
          found = true;
        } else if (data && data.content) {
          content = data.content;
          found = true;
        }
      }
      
      if (!found) {
        content = 'DEBUG: ' + JSON.stringify(data);
      } else {
      }
     
      
      const labResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: content,
        timestamp: new Date().toISOString()
      };

      // Atualização otimizada de estado - apenas uma vez
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        const currentMessages = safeGet(newState, chatKey, []);
        safeSet(newState, chatKey, [...currentMessages, labResponse]);
        return newState;
      });
      
      // Salvar o chat no histórico se for um novo chat
      if (!labSelectedChatName) {
        try {
          // Criar objeto do chat para salvar no histórico
          const chatToSave = {
            id: Date.now(),
            session_id: session_id,
            chat_name: chat_name,
            name: chat_name,
            messages: [userMessage, labResponse],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Adicionar ao histórico local
          setLabChatHistory(prev => [chatToSave, ...prev]);
          
          // Definir como chat selecionado
          setLabSelectedChatName(chat_name);
          setLabSelectedConversation(session_id);
          
          // Limpar cache de mensagens para o novo chat
          setLabMessagesByChat(prev => {
            const newState = { ...prev };
            delete newState[chatKey];
            return newState;
          });
          
          // Limpar cache de mensagens pendentes
          setLabPendingMessagesByChat(prev => {
            const newState = { ...prev };
            delete newState[chatKey];
            return newState;
          });
          
      
          showSuccessToast(`Chat "${chat_name}" criado com sucesso!`);
        } catch (error) {
          console.error('❌ Erro ao salvar chat no histórico:', error);
        }
      }
    } catch (error) {
      let errorMessage = 'Erro ao processar a solicitação para o laboratório';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Tempo limite excedido. A requisição demorou mais de 30 segundos.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      handleError(error, 'envio de mensagem do laboratório');
      const errorResponse = {
        id: Date.now() + 2,
        role: 'error',
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        const currentMessages = safeGet(newState, chatKey, []);
        safeSet(newState, chatKey, [...currentMessages, errorResponse]);
        return newState;
      });
    } finally {
      setIsLabTyping(false);
      // Limpar arquivo se não deve ser mantido
      if (!labKeepFileAttached) {
        setLabSelectedFile(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if (isAiTyping) return;
    if (!chatInput.trim() && !selectedFile) return;

    setIsLoading(true);
    setIsAiTyping(true);
    
    const userMessage = {
        id: Date.now(),
        role: 'user',
        content: chatInput.trim() || 'Documento enviado',
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput(''); // Limpa o texto
    if (!keepFileAttached) setSelectedFile(null); // Limpa o arquivo selecionado se o toggle estiver desligado

    try {
        let response;
        if (selectedFile) {
  
          // Envia como FormData se houver arquivo
          const formData = new FormData();
          formData.append('prompt', chatInput.trim() || 'Documento enviado');
          formData.append('maxTokens', 64000);
          formData.append('file', selectedFile);
          formData.append('setup', JSON.stringify(selectedSetup));
          
          // Adiciona o parâmetro mode do Chip Jurídico
          const selectedMode = getSelectedChipJuridicoMode();
          if (selectedMode) {
            formData.append('mode', selectedMode);
          }



          response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formData
          });
        } else {

          // Envia como JSON se não houver arquivo
          const requestBody = {
            prompt: chatInput.trim(),
            maxTokens: 64000,
            setup: selectedSetup
          };
          
          // Adiciona o parâmetro mode do Chip Jurídico
          const selectedMode = getSelectedChipJuridicoMode();
          if (selectedMode) {
            requestBody.mode = selectedMode;
          }
          
          response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro na resposta do servidor');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erro ao processar a solicitação');
        }

        const aiResponse = {
            id: Date.now(),
            role: 'assistant',
            content: data.message || 'Não foi possível processar a resposta',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
        
        // Atualizar conversa existente se houver uma selecionada
        if (selectedConversation) {
          setTimeout(() => {
            updateChatConversation(selectedConversation, [...messages, aiResponse]);
          }, 1000);
        }
        
        } catch (error) {
      handleError(error, 'envio de mensagem da IA');
      const errorResponse = {
        id: Date.now(),
        role: 'error',
        content: error.message || 'Erro ao processar a solicitação',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
        setIsAiTyping(false);
    }
};  {/* <SettingSection>
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

  const renderDashboard = () => {
    const planData = getCurrentPlanData() || {
      name: 'Free Trial',
      maxQueriesPerHour: 100,
      maxTokensPerHour: 20000,
      historyRetention: 0,
      price: 'Gratuito',
      color: '#64748b'
    };
    
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
                  Dashboard
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Bem-vindo(a), {currentUser?.name || 'Usuário'}! • Visão geral da sua conta
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-colors duration-500"
          >
        
            {/* Statistics Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-neutral-200 dark:border-neutral-800">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center space-x-3 sm:space-x-4"
              >
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-accent1 to-accent1 text-white shadow-lg">
                  <FaChartLine className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Estatísticas de Uso
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                    Acompanhe seu desempenho e atividade na plataforma
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Statistics Content */}
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
              >
                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Consultas hoje
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                          Total de consultas realizadas hoje
                        </p>
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.queries_today || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-accent1 to-accent1 text-white">
                        <FaCode className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="relative group">
                        <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 cursor-help">
                          Tokens Hoje
                        </h3>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          Tokens são unidades de texto que a IA processa. Cada palavra, pontuação ou espaço conta como um token.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100"></div>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                          Tokens processados hoje
                        </p>
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.tokens_today || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <FaClock className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Total no mês
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                          Total mensal de consultas
                        </p>
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.queries_this_month || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <FaCommentDots className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Total de Consultas
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                          Consultas realizadas no total
                        </p>
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.total_queries || 0}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Resumo de Produtividade */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Resumo de Produtividade
                  </h3>
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    <FaChartBar className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* Peças Revisadas */}
                  <div className="text-center p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-neutral-100 dark:bg-neutral-700 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                      <FaFileAlt className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {Math.floor(Math.random() * 50) + 25}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Peças Revisadas
                    </div>
                  </div>

                  {/* Erros Evitados */}
                  <div className="text-center p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-neutral-100 dark:bg-neutral-700 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                      <FaShieldAlt className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {Math.floor(Math.random() * 30) + 15}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Erros Evitados
                    </div>
                  </div>

                  {/* Tempo Economizado */}
                  <div className="text-center p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-neutral-100 dark:bg-neutral-700 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                      <FaClock className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {Math.floor(Math.random() * 20) + 8}h
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Tempo Economizado
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Uso do Plano */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Uso do Plano
                  </h3>
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    <FaChartBar className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Barra de Progresso Principal */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Consumo Total do Plano
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {Math.min(
                          Math.max(
                            ((usageStats?.queries_today || 0) / (planData.maxQueriesPerHour || 100)) * 100,
                            ((usageStats?.tokens_today || 0) / (planData.maxTokensPerHour || 20000)) * 100
                          ), 
                          100
                        ).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 sm:h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(
                            Math.max(
                              ((usageStats?.queries_today || 0) / (planData.maxQueriesPerHour || 100)) * 100,
                              ((usageStats?.tokens_today || 0) / (planData.maxTokensPerHour || 20000)) * 100
                            ), 
                            100
                          )}%`
                        }}
                        transition={{ duration: 1, delay: 1.2 }}
                        className="h-full bg-gradient-to-r from-accent1 to-accent1 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Informações Detalhadas */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                    <div className="text-center p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {usageStats?.queries_today || 0}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Consultas hoje
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {(usageStats?.tokens_today || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Tokens hoje
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

               {/* Current Plan */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 1.2 }}
                 className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
               >
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                   <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                     Seu Plano Atual
                   </h3>
                   {currentUser && currentUser.plan_id && currentUser.plan_id !== 'PRO' && (
                     <button
                       className="px-3 py-1.5 sm:py-2 bg-gradient-to-r from-accent1 to-accent1 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
                     >
                       Fazer upgrade
                     </button>
                   )}
                 </div>
                 <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                     <div 
                       className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                       style={{ 
                         backgroundColor: 'rgba(225, 102, 61, 0.1)',
                         color: '#8C4B35'
                       }}
                     >
                       {planData.name || 'Free Trial'}
                     </div>
                     <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                       {planData.price || 'Gratuito'}
                     </span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                     <div className="flex items-center space-x-2">
                       <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                       <div>
                         <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                           {planData.maxQueriesPerHour || 100}
                         </div>
                         <div className="text-xs text-neutral-500 dark:text-neutral-400">
                           consultas/hora
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center space-x-2">
                       <FaCode className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                       <div>
                         <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                           {(planData.maxTokensPerHour || 20000).toLocaleString()}
                         </div>
                         <div className="text-xs text-neutral-500 dark:text-neutral-400">
                           tokens/hora
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center space-x-2">
                       <FaHistory className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                       <div>
                         <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                           {!planData.historyRetention ? 'Limitado' : `${planData.historyRetention}h`}
                         </div>
                         <div className="text-xs text-neutral-500 dark:text-neutral-400">
                           histórico
                         </div>
                       </div>
                     </div>
                   </div>
                   {currentUser && currentUser.plan_id && currentUser.plan_id !== 'PRO' && (
                     <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                       Upgrade disponível para mais recursos
                     </div>
                   )}
                 </div>
               </motion.div>

             </div>
           </motion.div>
         </div>
       </div>

    );
  };

  const handleLabSetupSelect = (setup) => {
    setLabSelectedSetupState(setup);
  };

  const handleLabSetupConfirm = () => {
    if (labSelectedSetupState) {
      // O setup já está aplicado através do labSelectedSetupState
      setLabShowSetupModal(false);
      toast.success(`Setup "${labSelectedSetupState.title}" aplicado com sucesso!`);
    }
  };

  const handleLabClearChat = () => {
    setLabMessages([]);
    setLabInput('');
    setLabSelectedChatName(null);
    toast.success('Chat da Central Jurídica limpo com sucesso!');
  };

  const handleCreateNewChat = async () => {
    try {
      if (!newChatName.trim()) {
        toast.error('Por favor, insira um nome para o chat');
        return;
      }
      
      if (isCreatingChat) {
        return; // Evitar múltiplas execuções
      }
      
      setIsCreatingChat(true);
      
      const chatName = newChatName.trim();
      const userId = currentUser?.user_id || currentUser?.id;
      
      if (!userId) {
        toast.error('Usuário não identificado');
        setIsCreatingChat(false);
        return;
      }
      
      // Gerar um novo sessionId único para cada novo chat
      const sessionId = generateSessionId(userId);
      
      
      // Limpar estados
      setLabMessages([]);
      setLabInput('');
      setLabSelectedFile(null);
      setLabSelectedConversation(sessionId);
      setLabSelectedChatName(chatName);
      
      // Fechar modal e limpar nome
      setNewChatName('');
      setLabShowNewChatModal(false);
      
      showSuccessToast(`Novo chat "${chatName}" criado com sucesso!`);

      // Salvar no Redis
      if (currentUser) {
        await saveLabChatToRedis(userId, chatName, sessionId);
        
        // Recarregar histórico
        const updatedChats = await fetchLabChatsFromRedis(userId);
        setLabChatHistory(updatedChats);
      }
    } catch (error) {
      console.error('❌ Erro ao criar novo chat:', error);
      toast.error('Erro ao criar novo chat. Tente novamente.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleHideChat = async (sessionId) => {
    if (!currentUser) return;
    
    const success = await hideLabChat(currentUser.user_id || currentUser.id, sessionId);
    
    if (success) {
      showSuccessToast('Chat removido com sucesso!');
      // Recarregar lista de chats
      fetchLabChatsFromRedis(currentUser.user_id || currentUser.id).then(chats => setLabChatHistory(chats));
      
      // Se o chat removido era o selecionado, limpar seleção
      if (labSelectedConversation === sessionId) {
        setLabSelectedConversation(null);
        setLabSelectedChatName(null);
        setLabMessages([]);
        setLabInput('');
      }
    } else {
      showInfoToast('Erro ao remover chat');
    }
  };



  // Função para cortar texto antes de "Conteúdo do arquivo"
  function cortarAntesDeConteudo(texto) {
    const marcador = "Conteúdo do arquivo";
    const index = texto.indexOf(marcador);

    let resultado;
    if (index !== -1) {
      // Pega apenas o que vem antes do marcador
      resultado = texto.slice(0, index).trim();
    } else {
      // Se não encontrar, retorna o texto inteiro
      resultado = texto;
    }

    
    return resultado;       // ainda retorna, caso precise usar depois
  }

  // Função para renderizar mensagem com arquivo
  const renderMessageWithFile = (content) => {
    
    if (!content || typeof content !== 'string') {
      return content;
    }

    // Detectar diferentes padrões de arquivo
    const patterns = [
      /Arquivo enviado: (.+?)(?:\n|$)/,
      /Conteúdo do arquivo "(.+?)":\s*/,
      /--- DOCUMENTO ANEXADO: (.+?) ---/,
      /\(Arquivo anexado: (.+?)\)/
    ];

    let fileName = '';
    let cleanContent = content;
    let hasFile = false;

    // Verificar cada padrão
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        fileName = match[1];
        hasFile = true;
        
        // Aplicar a função cortarAntesDeConteudo apenas quando há arquivo
        content = cortarAntesDeConteudo(content);
        
        if (pattern.source.includes('Conteúdo do arquivo')) {
          // Para padrão "Conteúdo do arquivo", remover tudo até a pergunta do usuário
          const userQuestionMatch = content.match(/Pergunta do usuário:\s*(.+?)$/s);
          if (userQuestionMatch) {
            cleanContent = userQuestionMatch[1].trim();
          } else {
            // Se não encontrar "Pergunta do usuário", tentar pegar só as últimas linhas
            const lines = content.split('\n');
            const lastLines = lines.slice(-3).join('\n').trim();
            cleanContent = lastLines;
          }
        } else if (pattern.source.includes('DOCUMENTO ANEXADO')) {
          // Para padrão "--- DOCUMENTO ANEXADO: nome ---", remover tudo até "--- FIM DO DOCUMENTO ---"
          cleanContent = content.replace(/--- DOCUMENTO ANEXADO:.*?--- FIM DO DOCUMENTO ---\s*/gs, '');
          // Remover também instruções para a IA
          cleanContent = cleanContent.replace(/Por favor, analise o documento anexado.*?Base sua resposta no documento acima\.\s*/gs, '');
          cleanContent = cleanContent.trim();
        } else {
          // Para outros padrões, apenas remover a linha do arquivo
          cleanContent = content.replace(pattern, '').trim();
        }
        break;
      }
    }
    
    if (hasFile) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-300">
            <FaFileAlt className="w-4 h-4 text-accent1" />
            <span className="font-medium">{fileName}</span>
          </div>
          {cleanContent && (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {cleanContent}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </div>
    );
  };

  // [4] Atualize loadChatMessages para segmentar por chat
  const loadChatMessages = async (chatName, isSwitchingChat = false) => {
    try {
      
      const response = await fetch('http://138.197.27.151:5000/api/lab-chats/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          chat_name: chatName // sempre use o nome do chat
        })
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar mensagens do chat');
      }
      const data = await response.json();
      
      let messages = [];
      if (Array.isArray(data)) {
        messages = data.map(item => ({
          id: item.id,
          role: item.message?.type === 'human' ? 'user' : 'assistant',
          content: item.message?.content || '',
          timestamp: item.last_update || new Date().toISOString()
        }));
      } else if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages.map(item => ({
          id: item.id,
          role: item.message?.type === 'human' ? 'user' : 'assistant',
          content: item.message?.content || '',
          timestamp: item.last_update || new Date().toISOString()
        }));
      }
      // Merge inteligente: mantenha mensagens pendentes que não estão no histórico
      const chatKey = chatName || labSelectedConversation || 'default';
      let mergedMessages = messages;
      const pending = safeGet(labPendingMessagesByChat, chatKey, []);
      
      if (pending.length > 0) {
        const pendingToKeep = pending.filter(pendingMsg => {
          return !messages.some(msg => msg.content === pendingMsg.content && msg.role === pendingMsg.role);
        });
        mergedMessages = [...messages, ...pendingToKeep];
        if (pendingToKeep.length < pending.length) {
          setLabPendingMessagesByChat(prev => {
            const newState = { ...prev };
            safeSet(newState, chatKey, pendingToKeep);
            return newState;
          });
        }
      }
      
      // Se não estamos trocando de chat, fazer merge com mensagens existentes para evitar perda
      if (!isSwitchingChat) {
        const existingMessages = safeGet(labMessagesByChat, chatKey, []);
        const newMessageIds = new Set(messages.map(msg => msg.id));
        const existingToKeep = existingMessages.filter(msg => !newMessageIds.has(msg.id));
        mergedMessages = [...existingToKeep, ...messages];
      }
      // Ordenar mensagens por timestamp para garantir ordem correta
      mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      
      
      // Sempre atualizar o estado das mensagens, não apenas quando trocando de chat
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        safeSet(newState, chatKey, mergedMessages);
        return newState;
      });

      // Scroll para o final após carregar as mensagens
      setTimeout(() => {
        scrollLabChatToBottom();
      }, 150);
    } catch (error) {
      handleError(error, 'carregamento de mensagens do chat');
      if (isSwitchingChat) setLabMessages([]);
    }
  };



  const handleCopyMessage = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Erro ao copiar texto:', err);
          toast.error('Erro ao copiar texto');
          return;
        }
        
        document.body.removeChild(textArea);
      }
      
        toast.success('Mensagem copiada!');
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
      toast.error('Erro ao copiar texto');
    }
    };



  const renderLaboratoryPanel = () => {
    // Sidebar de sessões do laboratório
    return (
      <div className={`flex flex-col lg:flex-row h-full bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden transition-all duration-500
        ${isMobile ? 'home-mobile-optimized' : ''}`}>
        {/* Sidebar de sessões - Apenas Desktop */}
        {!isMobile && !isTablet && (
          <div className="w-52 !bg-gradient-to-b !from-white/60 !via-white/50 !to-white/40 dark:!from-neutral-800/60 dark:!via-neutral-800/50 dark:!to-neutral-800/40 !text-neutral-900 dark:!text-white !border-b lg: lg:!border-b-0 !border-1 !border-gradient-to-b !from-amber-200/30 !to-amber-300/30 dark:!from-amber-700/30 dark:!to-amber-600/30 flex flex-col items-stretch min-h-0 lg:min-h-full box-border backdrop-blur-md shadow-inner p-3 lg:p-5 gap-3 lg:gap-5">
          {!isMobile && !isTablet && (
            <div className="flex flex-col items-center">
            <button
                className="bg-gradient-to-r from-accent1 to-accent1 hover:bg-accent1/80 text-white border-0 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg w-full max-w-xs mx-auto py-2 lg:py-2.5 px-3 lg:px-4 mb-4 lg:mb-6 text-sm"
              onClick={() => {
                // Deselecionar chat atual
                setLabSelectedConversation(null);
                setLabSelectedChatName(null);
                setLabMessages([]);
                setLabInput('');
                setLabSelectedFile(null);
                
                // Limpar cache de mensagens
                setLabMessagesByChat({});
                setLabPendingMessagesByChat({});
                
                
                // Abrir modal de novo chat
                setLabShowNewChatModal(true);
              }}
            >
                <FaPlus className="w-3.5 h-3.5" />
              <span>Nova Peça</span>
            </button>
            </div>
          )}
          

          

          
          <div className="flex-1 overflow-hidden">
            {(isMobile || isTablet) ? (
              // Espaço vazio para mobile e tablet (dropdown movido para fora)
              <div className="h-full"></div>
            ) : (
              // Layout original para desktop
              <>
                <div className={`mb-3 lg:mb-4 ${isMobile ? 'mb-2' : ''}`}>
                  <div className={`flex items-center justify-center ${isMobile ? 'mb-1' : 'mb-2 lg:mb-3'}`}>
                    <h4 className={`font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center space-x-2
                      ${isMobile ? 'text-xs' : 'text-xs lg:text-sm'}`}>
                      <FaHistory className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                      <span>Histórico</span>
                    </h4>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-600 to-transparent"></div>
                </div>
                
                {labHistoryLoading ? (
                  <div className={`flex flex-col items-center justify-center space-y-2 lg:space-y-4
                    ${isMobile ? 'p-2' : 'p-3 lg:p-8'}`}>
                    <div className="relative">
                      <div className={`border-4 border-accent1/20 dark:border-accent1 rounded-full
                        ${isMobile ? 'w-6 h-6' : 'w-6 h-6 lg:w-12 lg:h-12'}`}></div>
                      <div className={`absolute top-0 left-0 border-4 border-transparent border-t-amber-500 rounded-full
                        ${isMobile ? 'w-6 h-6' : 'w-6 h-6 lg:w-12 lg:h-12'}`}></div>
                    </div>
                    <p className={`text-neutral-600 dark:text-neutral-400
                      ${isMobile ? 'text-xs' : 'text-xs lg:text-sm'}`}>Carregando...</p>
                  </div>
                ) : labChatHistory.length === 0 ? (
                  <div className={`${isMobile ? 'p-2' : 'p-2 lg:p-4'}`}>
                    <EmptyState 
                      type="chats" 
                      action={() => {
                        // Deselecionar chat atual
                        setLabSelectedConversation(null);
                        setLabSelectedChatName(null);
                        setLabMessages([]);
                        setLabInput('');
                        setLabSelectedFile(null);
                        
                        // Limpar cache de mensagens
                        setLabMessagesByChat({});
                        setLabPendingMessagesByChat({});
                        
                        
                        // Abrir modal de novo chat
                        setLabShowNewChatModal(true);
                      }} 
                    />
                  </div>
                ) : (
                  <div className={`flex flex-col max-h-[40vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500
                    ${isMobile ? 'gap-1 pr-1' : 'gap-0.5 pr-2'}`}>
                    {labChatHistory.map((session, idx) => (
                      <div
                        key={session.session_id || session.id}
                        className={`relative cursor-pointer group flex items-center gap-3 transition-all duration-200 ${
                          labSelectedConversation === (session.session_id || session.id) 
                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100' 
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        } ${isMobile ? 'rounded-lg p-2' : 'rounded-lg p-1 lg:p-1.5'}`}
                        onClick={() => {
                          const chatName = session.chat_name || session.session_id || session.name;
                          const sessionId = session.session_id || session.id;
                          
                  
                          
                          setLabSelectedConversation(sessionId);
                          setLabSelectedChatName(chatName);
                          
                          // Buscar mensagens do chat específico da API externa
                          loadChatMessages(chatName, true); // use sempre o nome do chat
                          
                          setLabInput('');
                          setLabSelectedFile(null);
                        }}
                        title={`${session.chat_name || session.session_id || session.name}${session.is_current_session ? ' (Sessão atual)' : ''}`}
                      >
                        {/* Conteúdo do chat */}
                            <div className="flex-1 min-w-0">
                          <span className={`block truncate font-medium
                            ${isMobile ? 'text-sm' : 'text-sm'}`}>
                                  {session.chat_name || session.session_id || session.name}
                                </span>
                          </div>
                          
                          {/* Botão de remover */}
                          <button
                          className="opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer rounded p-1.5 flex items-center justify-center transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Tem certeza que deseja remover o chat "${session.chat_name || session.session_id || session.name}"?`)) {
                                handleHideChat(session.session_id || session.id);
                              }
                            }}
                            title="Remover chat"
                          >
                          <FaTrash className="w-3 h-3" />
                          </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )}
        {/* Chat principal do laboratório (igual IA, mas usando estados do laboratório) */}
        <div className="flex-1 min-w-0 !bg-white/30 dark:!bg-neutral-900/30 backdrop-blur-sm">
                     <div className={`flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-7rem)] max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-7rem)] !bg-white/60 dark:!bg-neutral-800/60 pb-5 lg:pb-10 gap-2 lg:gap-6 backdrop-blur-sm min-h-[97svh] ${isMobile ? 'bg-gradient-to-b from-sky-50 via-white to-indigo-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900' : ''}
            ${isMobile ? 'p-0 gap-0 justify-start items-center h-full pt-2' : 'pt-2 px-0 lg:pt-3 lg:px-2 md:p-4 md:pb-6 md:gap-4 md:h-[calc(100vh-7rem)] md:max-h-[calc(100vh-7rem)] sm:p-0 sm:pb-4 sm:gap-3'}`}>

            <div 
              className={`flex flex-col bg-white dark:bg-neutral-800 shadow-md h-full border border-neutral-200 dark:border-neutral-700 backdrop-blur-sm relative
                ${isMobile ? 'w-full max-w-md mx-auto rounded-2xl ring-1 ring-white/40 dark:ring-white/10 shadow-xl backdrop-blur-lg overflow-visible h-[calc(100vh-5rem)]' : 'mb-6 lg:mb-8 md:mb-6 sm:mb-4 rounded-xl overflow-hidden'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Overlay de drag and drop */}
              {isDragOver && (
                <div className={`absolute inset-0 bg-accent2/20 backdrop-blur-sm border-2 border-dashed border-accent2 z-50 flex items-center justify-center
                  ${isMobile ? 'rounded-lg' : 'rounded-lg lg:rounded-xl'}`}>
                  <div className={`text-center ${isMobile ? 'p-3' : 'p-3 lg:p-8'}`}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`bg-white dark:bg-neutral-800 shadow-2xl border border-accent2/20 dark:border-accent2
                        ${isMobile ? 'rounded-xl p-3' : 'rounded-xl lg:rounded-2xl p-3 lg:p-8'}`}
                    >
                      <div className={`mb-2 lg:mb-4 ${isMobile ? 'text-2xl' : 'text-3xl lg:text-6xl'}`}>📁</div>
                      <h3 className={`font-bold text-accent2 dark:text-accent2 mb-2
                        ${isMobile ? 'text-sm' : 'text-base lg:text-xl'}`}>
                        Solte o arquivo aqui
                      </h3>
                      <p className={`text-neutral-600 dark:text-neutral-300
                        ${isMobile ? 'text-xs' : 'text-xs lg:text-sm'}`}>
                        PDF, DOC, DOCX, XLS, XLSX, TXT, CSV e imagens
                      </p>
                      <p className={`text-neutral-500 dark:text-neutral-400 mt-1 lg:mt-2
                        ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        Máximo: 10MB
                      </p>
                    </motion.div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col h-full min-h-0 gap-3">
                {/* Header para desktop */}
                {!isMobile && !isTablet && (
                  <div className={`flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-xl flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm
                    ${isMobile ? 'p-2' : 'p-3 lg:p-5'}`}>
                    <div className="flex flex-col gap-1">
                    <h3 className={`text-neutral-800 dark:text-neutral-200 font-semibold m-0 flex items-center gap-2
                      ${isMobile ? 'text-base' : 'text-lg lg:text-xl md:text-lg'}`}>Chat da Central Jurídica</h3>
                      
                      {/* Modo atual embaixo do título */}
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 text-sm">
                        <FaCog className="text-accent1 w-3 h-3" />
                        <span className="font-medium">
                          Modo: {labSelectedSetupState?.title || 'Não selecionado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                      {/* Menu dropdown de juízes */}
                      <div className="relative judge-menu-container">
                        <button 
                          onClick={() => setIsJudgeMenuOpen(!isJudgeMenuOpen)}
                          className="bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md px-3 py-2 text-sm"
                        >
                          <FaUserTie className="w-4 h-4 text-accent1" />
                          <span>{selectedJudge}</span>
                          <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isJudgeMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Menu dropdown */}
                        {isJudgeMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                            <div className="p-2">
                              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 px-2">Selecionar Juiz</div>
                              
                              <button 
                                onClick={() => {
                                  setSelectedJudge('Todos os Juízes');
                                  setIsJudgeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${
                                  selectedJudge === 'Todos os Juízes' 
                                    ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' 
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="w-6 h-6 bg-accent1 rounded-full flex items-center justify-center">
                                  <FaUsers className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">Todos os Juízes</span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setSelectedJudge('Dr. Silva');
                                  setIsJudgeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${
                                  selectedJudge === 'Dr. Silva' 
                                    ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' 
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <FaUserTie className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">Dr. Silva</span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setSelectedJudge('Dra. Santos');
                                  setIsJudgeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${
                                  selectedJudge === 'Dra. Santos' 
                                    ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' 
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <FaUserTie className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">Dra. Santos</span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setSelectedJudge('Dr. Oliveira');
                                  setIsJudgeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${
                                  selectedJudge === 'Dr. Oliveira' 
                                    ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' 
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <FaUserTie className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">Dr. Oliveira</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                                             {/* Menu dropdown de 3 pontos para desktop */}
                       <div className="relative desktop-menu-container">
                         <button 
                           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                           className="bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center hover:shadow-md w-10 h-10 min-w-[40px]"
                           title="Menu"
                         >
                           <FaEllipsisV className="w-4 h-4" /> 
                         </button>
                         
                         {/* Menu dropdown */}
                         {isMobileMenuOpen && (
                           <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[180px]">
                             <button 
                               onClick={() => {
                                 setShowHistoryModal(true);
                                 setIsMobileMenuOpen(false);
                               }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-t-lg"
                             >
                               <div className="w-7 h-7 bg-secondary rounded flex items-center justify-center">
                                 <FaHistory className="w-4 h-4 text-white" />
                               </div>
                               <span className="text-sm font-medium">Histórico</span>
                             </button>
                             
                             <button 
                               onClick={() => {
                                 setLabShowSetupModal(true);
                                 setIsMobileMenuOpen(false);
                               }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200"
                             >
                               <div className="w-7 h-7 bg-accent1 rounded flex items-center justify-center">
                                 <FaCog className="w-4 h-4 text-white" />
                               </div>
                               <span className="text-sm font-medium">Alterar Modo</span>
                             </button>
                             
                             <button 
                               onClick={() => {
                                 setShowChipJuridicoModal(true);
                                 setIsMobileMenuOpen(false);
                               }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200"
                             >
                               <div className="w-7 h-7 bg-secondary rounded flex items-center justify-center">
                                 <FaTags className="w-4 h-4 text-white" />
                               </div>
                               <span className="text-sm font-medium">Chip Jurídico</span>
                             </button>
                             
                             <button 
                               onClick={() => {
                                 handleLabClearChat();
                                 setIsMobileMenuOpen(false);
                               }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-b-lg"
                             >
                               <div className="w-7 h-7 bg-neutral-500 rounded flex items-center justify-center">
                                 <FaTrash className="w-4 h-4 text-white" />
                               </div>
                               <span className="text-sm font-medium">Limpar Chat</span>
                             </button>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}
                
                {/* Header completo para mobile */}
                {isMobile && (
                  <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-xl flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm p-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-neutral-800 dark:text-neutral-200 font-semibold m-0 text-base">Chat da Central Jurídica</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <FaCog className="w-3 h-3" />
                        <span>Modo: Não selecionado</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Menu dropdown de juízes para mobile */}
                      <div className="relative judge-menu-container">
                        <button
                          onClick={() => setIsJudgeMenuOpen(!isJudgeMenuOpen)}
                          className="bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-1 font-medium shadow-sm hover:shadow-md px-2 py-1.5 text-xs"
                        >
                          <FaUserTie className="w-3 h-3 text-accent1" />
                          <span className="truncate max-w-[80px]">{selectedJudge}</span>
                          <FaChevronDown className={`w-2 h-2 transition-transform duration-200 ${isJudgeMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isJudgeMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[160px]">
                            <div className="p-2">
                              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 px-2">Selecionar Juiz</div>
                              <button onClick={() => { setSelectedJudge('Todos os Juízes'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Todos os Juízes' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-5 h-5 bg-accent1 rounded-full flex items-center justify-center"><FaUsers className="w-2.5 h-2.5 text-white" /></div>
                                <span className="text-xs font-medium">Todos os Juízes</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dr. Silva'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dr. Silva' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><FaUserTie className="w-2.5 h-2.5 text-white" /></div>
                                <span className="text-xs font-medium">Dr. Silva</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dra. Santos'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dra. Santos' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"><FaUserTie className="w-2.5 h-2.5 text-white" /></div>
                                <span className="text-xs font-medium">Dra. Santos</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dr. Oliveira'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dr. Oliveira' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><FaUserTie className="w-2.5 h-2.5 text-white" /></div>
                                <span className="text-xs font-medium">Dr. Oliveira</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Menu dropdown de 3 pontos para mobile */}
                      <div className="relative mobile-menu-container">
                        <button
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                          className="bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center hover:shadow-md w-8 h-8 min-w-[32px]"
                          title="Menu"
                        >
                          <FaEllipsisV className="w-3 h-3" />
                        </button>
                        {isMobileMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[160px]">
                            <button onClick={() => { setShowHistoryModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-t-lg">
                              <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center"><FaHistory className="w-3 h-3 text-white" /></div>
                              <span className="text-sm font-medium">Histórico</span>
                            </button>
                            <button onClick={() => { setLabShowSetupModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200">
                              <div className="w-6 h-6 bg-accent1 rounded flex items-center justify-center"><FaCog className="w-3 h-3 text-white" /></div>
                              <span className="text-sm font-medium">Alterar Modo</span>
                            </button>
                            <button onClick={() => { setShowChipJuridicoModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200">
                              <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center"><FaTags className="w-3 h-3 text-white" /></div>
                              <span className="text-sm font-medium">Chip Jurídico</span>
                            </button>
                            <button onClick={() => { handleLabClearChat(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-b-lg">
                              <div className="w-6 h-6 bg-neutral-500 rounded flex items-center justify-center"><FaTrash className="w-3 h-3 text-white" /></div>
                              <span className="text-sm font-medium">Limpar Chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Header para tablet */}
                {isTablet && (
                  <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-xl flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm p-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-neutral-800 dark:text-neutral-200 font-semibold m-0 text-lg">Chat da Central Jurídica</h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <FaCog className="w-3 h-3" />
                        <span>Modo: Não selecionado</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Menu dropdown de juízes para tablet */}
                      <div className="relative judge-menu-container">
                        <button
                          onClick={() => setIsJudgeMenuOpen(!isJudgeMenuOpen)}
                          className="bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-md px-3 py-2 text-sm"
                        >
                          <FaUserTie className="w-4 h-4 text-accent1" />
                          <span className="truncate max-w-[100px]">{selectedJudge}</span>
                          <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${isJudgeMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isJudgeMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[180px]">
                            <div className="p-2">
                              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 px-2">Selecionar Juiz</div>
                              <button onClick={() => { setSelectedJudge('Todos os Juízes'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Todos os Juízes' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-6 h-6 bg-accent1 rounded-full flex items-center justify-center"><FaUsers className="w-3 h-3 text-white" /></div>
                                <span className="text-sm font-medium">Todos os Juízes</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dr. Silva'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dr. Silva' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><FaUserTie className="w-3 h-3 text-white" /></div>
                                <span className="text-sm font-medium">Dr. Silva</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dra. Santos'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dra. Santos' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"><FaUserTie className="w-3 h-3 text-white" /></div>
                                <span className="text-sm font-medium">Dra. Santos</span>
                              </button>
                              <button onClick={() => { setSelectedJudge('Dr. Oliveira'); setIsJudgeMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors duration-200 ${ selectedJudge === 'Dr. Oliveira' ? 'bg-accent1/10 text-accent1 dark:bg-accent1/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300' }`}>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><FaUserTie className="w-3 h-3 text-white" /></div>
                                <span className="text-sm font-medium">Dr. Oliveira</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Menu dropdown de 3 pontos para tablet */}
                      <div className="relative tablet-menu-container">
                        <button
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                          className="bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center hover:shadow-md w-10 h-10 min-w-[40px]"
                          title="Menu"
                        >
                          <FaEllipsisV className="w-4 h-4" />
                        </button>
                        {isMobileMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 min-w-[180px]">
                            <button onClick={() => { setShowHistoryModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-t-lg">
                              <div className="w-7 h-7 bg-secondary rounded flex items-center justify-center"><FaHistory className="w-4 h-4 text-white" /></div>
                              <span className="text-sm font-medium">Histórico</span>
                            </button>
                            <button onClick={() => { setLabShowSetupModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200">
                              <div className="w-7 h-7 bg-accent1 rounded flex items-center justify-center"><FaCog className="w-4 h-4 text-white" /></div>
                              <span className="text-sm font-medium">Alterar Modo</span>
                            </button>
                            <button onClick={() => { setShowChipJuridicoModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200">
                              <div className="w-7 h-7 bg-secondary rounded flex items-center justify-center"><FaTags className="w-4 h-4 text-white" /></div>
                              <span className="text-sm font-medium">Chip Jurídico</span>
                            </button>
                            <button onClick={() => { handleLabClearChat(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors duration-200 rounded-b-lg">
                              <div className="w-7 h-7 bg-neutral-500 rounded flex items-center justify-center"><FaTrash className="w-4 h-4 text-white" /></div>
                              <span className="text-sm font-medium">Limpar Chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={labChatContainerRef} className={`chat-messages flex-1 overflow-y-auto flex flex-col gap-4 lg:gap-6 min-h-0 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent overscroll-contain
                  ${isMobile ? 'p-3 gap-3 pb-36 mb-[env(safe-area-inset-bottom)] scroll-smooth min-h-[65vh] max-h-[65vh]' : isTablet ? 'p-4 gap-4 scroll-smooth' : 'p-3 lg:p-6'}`}>
                  {(safeGet(labMessagesByChat, getCurrentLabChatKey(), [])).map((message, index) => (
                    <div 
                      key={`${message.role}-${index}-${message.timestamp}`}
                      className={`flex flex-col w-full group ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      } fade-in ${isMobile ? 'mb-2' : isTablet ? 'mb-3' : 'mb-3 lg:mb-4'}`}
                    >
                      <div className={`relative max-w-[85%] lg:max-w-[80%] rounded-2xl shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg active:scale-[0.99]
                        ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-accent1 to-accent1 text-white shadow-accent1/20' 
                          : message.role === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-white/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600'
                      } ${isMobile ? 'p-2 max-w-[95%]' : isTablet ? 'p-3 max-w-[90%]' : 'p-3 lg:p-4 md:max-w-[90%] sm:max-w-[95%]'}`}>
                        {renderMessageWithFile(message.content)}
                        <div className={`text-xs opacity-60 mt-2 ${
                          message.role === 'user' 
                            ? 'text-right text-white/80' 
                            : 'text-left text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {formatChatTime(message.timestamp)}
                        </div>
                      </div>
                      <div className={`flex gap-1 lg:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        ${isMobile ? 'mt-1' : 'mt-1 lg:mt-2'}`}>
                        <button 
                          onClick={() => handleCopyMessage(message.content)}
                          title="Copiar mensagem"
                          className={`bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 border-0 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer rounded-lg text-xs flex items-center gap-1 transition-all duration-200
                            ${isMobile ? 'p-1.5' : 'p-1.5 lg:p-2'}`}
                        >
                          <FaCopy className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5 lg:w-3 lg:h-3'}`} /> 
                          <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>Copiar</span>
                        </button>
                        
                        {/* Botões de exportação - apenas para respostas da IA */}
                        {message.role === 'assistant' && (
                          <>
                            <button 
                              onClick={exportToWord}
                              title="Exportar conversa para Word"
                              className={`bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 border-0 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer rounded-lg text-xs flex items-center gap-1 transition-all duration-200
                                ${isMobile ? 'p-1.5' : 'p-1.5 lg:p-2'}`}
                            >
                              <FaFileWord className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5 lg:w-3 lg:h-3'}`} /> 
                              <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>Word</span>
                            </button>
                            
                            <button 
                              onClick={exportToPDF}
                              title="Exportar conversa para PDF"
                              className={`bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 border-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer rounded-lg text-xs flex items-center gap-1 transition-all duration-200
                                ${isMobile ? 'p-1.5' : 'p-1.5 lg:p-2'}`}
                            >
                              <FaFilePdf className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2.5 h-2.5 lg:w-3 lg:h-3'}`} /> 
                              <span className={`${isMobile ? 'hidden' : 'hidden sm:inline'}`}>PDF</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLabTyping && (
                    <div className={`flex flex-col w-full items-start ${isMobile ? 'mb-2' : isTablet ? 'mb-3' : 'mb-3 lg:mb-4'}`}>
                      <div className={`relative max-w-[85%] lg:max-w-[80%] rounded-2xl shadow-md backdrop-blur-sm border bg-white/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600 transition-all duration-300
                        ${isMobile ? 'p-2 max-w-[95%]' : isTablet ? 'p-3 max-w-[90%]' : 'p-2 lg:p-2'}`}>
                        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <div className={`bg-accent1 rounded-full animate-bounce ${isMobile ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5 lg:w-2 lg:h-2'}`} style={{animationDelay: '0s'}}></div>
                            <div className={`bg-accent1 rounded-full animate-bounce ${isMobile ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5 lg:w-2 lg:h-2'}`} style={{animationDelay: '0.2s'}}></div>
                            <div className={`bg-accent1 rounded-full animate-bounce ${isMobile ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5 lg:w-2 lg:h-2'}`} style={{animationDelay: '0.4s'}}></div>
                          </div>
                          <span className={`${isMobile ? 'text-xs' : 'text-xs lg:text-sm'}`}>Clausy está digitando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={labChatEndRef} />
                </div>
                
                {/* Indicador de arquivo anexado */}
                {labSelectedFile && (
                  <div className={`${isTablet ? 'px-4 py-3' : 'px-3 lg:px-4 py-2'} bg-accent1/5 dark:bg-accent1/90/20 border-t border-accent1/20 dark:border-accent1`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center ${isTablet ? 'gap-3' : 'gap-2 lg:gap-3'}`}>
                        <div className={`${isTablet ? 'w-8 h-8' : 'w-6 h-6 lg:w-8 lg:h-8'} bg-accent1/10 dark:bg-accent1/80 rounded-lg flex items-center justify-center`}>
                          <FaFileAlt className={`${isTablet ? 'w-4 h-4' : 'w-3 h-3 lg:w-4 lg:h-4'} text-accent1 dark:text-accent1/80`} />
                        </div>
                        <div>
                          <p className={`${isTablet ? 'text-sm' : 'text-xs lg:text-sm'} font-medium text-accent1 dark:text-accent1/80`}>
                            {labSelectedFile.name}
                          </p>
                          <p className={`${isTablet ? 'text-xs' : 'text-xs'} text-accent1 dark:text-accent1`}>
                            {(labSelectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLabSelectedFile(null)}
                        className={`${isTablet ? 'w-6 h-6' : 'w-5 h-5 lg:w-6 lg:h-6'} bg-accent1/20 dark:bg-amber-700 hover:bg-accent1/30 dark:hover:bg-accent1/80 rounded-full flex items-center justify-center text-amber-700 dark:text-accent1/80 transition-all duration-200`}
                      >
                        <FaTimes className={`${isTablet ? 'w-3 h-3' : 'w-2.5 h-2.5 lg:w-3 lg:h-3'}`} />
                      </button>
                    </div>
                  </div>
                )}
                
                {(isMobile || isTablet) ? (
                <div className="flex items-center gap-3 flex-shrink-0 sticky bottom-0 transition-all duration-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-700 fixed inset-x-0 z-50">
                  {/* Container do input estilo desktop */}
                  <div className="flex-1 relative flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-600 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Botão de anexar arquivo dentro da barra */}
                    <input
                      type="file"
                      ref={labFileInputRef}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xls,.xlsx"
                      onChange={handleLabFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => labFileInputRef.current?.click()}
                      className="w-8 h-8 ml-2 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-all duration-200"
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                    
                    <textarea
                      ref={labTextareaRef}
                      value={labInput}
                      onChange={(e) => {
                        setLabInput(e.target.value);
                        const textarea = e.target;
                        setTimeout(() => {
                          if (textarea.scrollHeight > textarea.clientHeight) {
                            textarea.style.overflowY = 'auto';
                          } else {
                            textarea.style.overflowY = 'hidden';
                          }
                        }, 0);
                      }}
                      placeholder="Escreva sua mensagem..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleLabSendMessage();
                        }
                      }}
                      className="w-full resize-none px-6 py-3 text-base h-12 bg-transparent text-neutral-900 dark:text-neutral-100 leading-6 border-0 outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400 overflow-hidden"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  
                  {/* Botão de envio separado - Mobile */}
                  <button 
                    type="submit" 
                    onClick={handleLabSendMessage}
                    disabled={(!labInput.trim() && !labSelectedFile) || isLabTyping}
                    className={`bg-accent1 hover:bg-accent1/90 active:bg-accent1/80 text-white border-0 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50 touch-manipulation w-12 h-12 min-w-[48px] p-0
                      ${(!labInput.trim() && !labSelectedFile) ? 'scale-90 opacity-60' : 'scale-100 opacity-100'}
                      ${isLabTyping ? 'animate-pulse' : ''}
                    `}
                    style={{ minHeight: '48px' }}
                  >
                    {isLabTyping ? (
                      <div className="flex items-center justify-center">
                        <div className="border-2 border-white/30 border-t-white rounded-full animate-spin w-5 h-5"></div>
                      </div>
                    ) : (
                      <FaPaperPlane className="transition-transform duration-200 hover:scale-110 w-5 h-5" />
                    )}
                  </button>
                </div>
                ) : (
                  <div className="flex items-center gap-3 flex-shrink-0 sticky bottom-0 transition-all duration-200 p-4 lg:p-6 bg-transparent max-w-7xl w-full mx-auto">
                    {/* Container do input */}
                    <div className="flex-1 relative flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-600 shadow-sm hover:shadow-md transition-all duration-200">
                      {/* Botão de anexar arquivo dentro da barra */}
                      <input
                        type="file"
                        ref={labFileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xls,.xlsx"
                        onChange={handleLabFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => labFileInputRef.current?.click()}
                        className="w-8 h-8 ml-2 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-all duration-200"
                      >
                        <FaPlus className="w-4 h-4" />
                      </button>
                      
                      <textarea
                        ref={labTextareaRef}
                        value={labInput}
                        onChange={(e) => {
                          setLabInput(e.target.value);
                          const textarea = e.target;
                          setTimeout(() => {
                            if (textarea.scrollHeight > textarea.clientHeight) {
                              textarea.style.overflowY = 'auto';
                            } else {
                              textarea.style.overflowY = 'hidden';
                            }
                          }, 0);
                        }}
                        placeholder="Ask anything"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleLabSendMessage();
                          }
                        }}
                        className="w-full resize-none px-6 py-3 text-base h-12 bg-transparent text-neutral-900 dark:text-neutral-100 leading-6 border-0 outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400 overflow-hidden"
                      />
                    </div>
                    
                    {/* Botão de envio separado - Desktop */}
                    <button 
                      type="submit" 
                      disabled={(!labInput.trim() && !labSelectedFile) || isLabTyping}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLabSendMessage();
                      }}
                      className={`bg-accent1 hover:bg-accent1/90 active:bg-accent1/80 text-white border-0 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50 w-14 h-12 p-3
                        ${(!labInput.trim() && !labSelectedFile) ? 'scale-90 opacity-60' : 'scale-100 opacity-100'}
                        ${isLabTyping ? 'animate-pulse' : ''}
                      `}
                    >
                      {isLabTyping ? (
                        <div className="border-2 border-white/30 border-t-white rounded-full animate-spin w-4 h-4"></div>
                      ) : (
                        <FaPaperPlane className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {labShowSetupModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-2 lg:p-4">
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-[95vw] lg:w-[900px] h-[85vh] lg:h-[600px] border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center p-3 lg:p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-sm lg:text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <FaCog className="text-accent1 w-3 h-3 lg:w-4 lg:h-4" />
                      Escolha um Setup
                    </h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleLabSetupConfirm}
                        disabled={!labSelectedSetupState}
                        className="px-2 lg:px-3 py-1 lg:py-1.5 bg-accent1 hover:bg-accent1/80 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg text-xs lg:text-sm font-medium transition-colors"
                      >
                        Usar Setup
                      </button>
                      <button 
                        onClick={() => setLabShowSetupModal(false)}
                        className="text-lg text-neutral-400 hover:text-neutral-600 cursor-pointer p-1 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-2 lg:p-4 h-[calc(85vh-80px)] lg:h-[calc(600px-80px)] overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 h-full">
                      {/* Lista de Setups */}
                      <div className="space-y-2">
                        {setups.map((setup, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              // Toggle dropdown para este setup
                              if (labSelectedSetupState?.title === setup.title) {
                                handleLabSetupSelect(null);
                              } else {
                                handleLabSetupSelect(setup);
                              }
                            }}
                            className={`p-2 lg:p-3 rounded-lg cursor-pointer border transition-colors ${
                              labSelectedSetupState?.title === setup.title
                                ? 'border-accent1 bg-accent1/5'
                                : 'border-neutral-300 dark:border-neutral-600 hover:border-accent1/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FaCog className="text-accent1 text-xs lg:text-sm" />
                                <span className="font-medium text-neutral-900 dark:text-neutral-100 text-xs lg:text-sm">
                                  {setup.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {labSelectedSetupState?.title === setup.title && (
                                  <FaCheck className="text-accent1 text-xs lg:text-sm" />
                                )}
                                <div className={`w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent transition-transform duration-200 ${
                                  labSelectedSetupState?.title === setup.title 
                                    ? 'border-t-accent1 rotate-180' 
                                    : 'border-t-neutral-400'
                                }`}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Área de Detalhes */}
                      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-2 lg:p-4 h-full overflow-y-auto">
                        {labSelectedSetupState ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2 lg:mb-4">
                              <FaCog className="text-accent1 text-xs lg:text-sm" />
                              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm lg:text-lg">
                                {labSelectedSetupState.title}
                              </h3>
                            </div>
                            
                            <div className="mb-2 lg:mb-4">
                              <h4 className="font-medium text-neutral-700 dark:text-neutral-300 text-xs lg:text-sm mb-1 lg:mb-2">
                                Quando usar:
                              </h4>
                              <p className="text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm leading-relaxed">
                                {labSelectedSetupState.when_to_use}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-neutral-700 dark:text-neutral-300 text-xs lg:text-sm mb-1 lg:mb-2">
                                Prompt:
                              </h4>
                              <div className="p-2 lg:p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                                <p className="text-neutral-800 dark:text-neutral-200 text-xs lg:text-sm font-mono leading-relaxed">
                                  {labSelectedSetupState.prompt}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <FaCog className="text-neutral-400 text-lg lg:text-2xl mx-auto mb-2" />
                              <p className="text-neutral-500 dark:text-neutral-400 text-xs lg:text-sm">
                                Selecione um setup para ver os detalhes
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {labShowNewChatModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-2 lg:p-4">
                <div className="bg-white dark:bg-neutral-800 rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-sm lg:max-w-md overflow-hidden backdrop-blur-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center p-3 lg:p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-t-xl lg:rounded-t-2xl">
                    <h2 className="text-base lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100 m-0 flex items-center gap-2">
                      <FaPlus className="text-accent1 w-3 h-3 lg:w-5 lg:h-5" />
                      Nomear Novo Chat
                    </h2>
                    <button 
                      onClick={() => {
                        setLabShowNewChatModal(false);
                        setNewChatName('');
                      }}
                      className="text-lg lg:text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer bg-transparent border-0 p-1 lg:p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-3 lg:p-6">
                    <label className="block mb-2 lg:mb-3 font-semibold text-neutral-700 dark:text-neutral-300 text-sm lg:text-base">
                      Nome do Chat:
                    </label>
                    <input
                      type="text"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="Digite o nome do chat..."
                      disabled={isCreatingChat}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-4 focus:ring-accent1/20 dark:focus:ring-amber-800 focus:border-accent1 dark:focus:border-accent1/40 transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCreatingChat) {
                          e.preventDefault();
                          handleCreateNewChat();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2 lg:gap-3 p-3 lg:p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-b-xl lg:rounded-b-2xl">
                    <button onClick={() => {
                      setLabShowNewChatModal(false);
                      setNewChatName('');
                    }}
                    className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border-0 rounded-lg px-3 lg:px-6 py-2 lg:py-3 text-sm lg:text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleCreateNewChat}
                      disabled={!newChatName.trim() || isCreatingChat}
                      className="bg-accent1 hover:bg-accent1/80 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white border-0 rounded-lg px-3 lg:px-6 py-2 lg:py-3 text-sm lg:text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      {isCreatingChat ? (
                        <>
                          <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Criando...</span>
                        </>
                      ) : (
                        'Criar Chat'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };




  // Carregar logs ao abrir aba de segurança ou mudar de página
  useEffect(() => {
    if (activeItem === 'security') {
      setSecurityLoading(true);
      setSecurityError(null);
      loadAuthLogs(securityPage)
        .catch(err => setSecurityError(err.message || 'Erro ao carregar logs.'))
        .finally(() => setSecurityLoading(false));
    }
    // eslint-disable-next-line
  }, [activeItem, securityPage, loadAuthLogs]);





  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 transition-all duration-500">
      <Sidebar 
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeItem={activeItem} 
        setActiveItem={setActiveItem} 
      />
      <div className={`flex-1 ${activeItem === 'security' || activeItem === 'reports' || activeItem === 'dashboard' ? 'overflow-auto' : 'overflow-hidden'} bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-gray-900/50 dark:to-gray-800/50 pb-16 lg:pb-0`}>
        {activeItem === 'dashboard' && renderDashboard()}
        
        
        {activeItem === 'laboratory' && (
          <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
            {/* Header - Apenas no Desktop */}
            {!isMobile && (
              <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative bg-white/40 dark:bg-neutral-800/40 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4"
                  >
                    <div className="flex-1">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        Central Jurídica
                      </h1>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Sua copilota que cria, revisa e corrige peças em segundos, com precisão e
                        jurisprudência atualizada.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-4">
                      {/* Status Badge */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center space-x-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-accent2/10 dark:bg-accent2/30 text-accent2 dark:text-accent2 rounded-full text-xs font-medium self-start sm:self-auto"
                      >
                        <FaRobot className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                        <span>IA Ativa</span>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.header>
            )}

            {/* Original Content */}
            {renderLaboratoryPanel()}
          </div>
        )}
        
        {activeItem === 'security' && (
          <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4"
                >
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      Segurança e Logs
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      Monitoramento de acessos e atividades de autenticação
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-center space-x-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium self-start sm:self-auto"
                  >
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Sistema Online</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <SecurityPanel
              logs={authLogs}
              loading={securityLoading}
              error={securityError}
              filter={securityFilter}
              setFilter={setSecurityFilter}
              page={securityPage}
              setPage={setSecurityPage}
              totalPages={totalPages}
              totalItems={totalItems}
              debugData={authLogs}
            />
            </main>
          </div>
        )}
        
        {activeItem === 'settings' && <Config />}
        
        {activeItem === 'profile' && <Profile />}
        
        {activeItem === 'reports' && <Reports />}
      </div>
      
      {modalOpen && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{modalType === 'credits' ? 'Adicionar Créditos' : 'Editar Usuário'}</h2>
              <CloseButton onClick={() => setModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            
            {modalType === 'credits' && (
              <div>
                <FormGroup>
                  <Label>Quantidade de Créditos</Label>
                  <Input
                    type="number"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(Number(e.target.value))}
                    min="1"
                  />
                </FormGroup>
                <ModalActions>
                  <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={handleModalSubmit}>
                    Adicionar Créditos
                  </Button>
                </ModalActions>
              </div>
            )}
            
            {modalType === 'edit' && (
              <div>
                <FormGroup>
                  <Label>Nome</Label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do usuário"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Função</Label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                    {currentUser && currentUser.role === 'superadmin' && (
                      <option value="superadmin">Super Admin</option>
                    )}
                  </select>
                </FormGroup>
                
                <ModalActions>
                  <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={handleModalSubmit}>
                    Salvar Alterações
                  </Button>
                </ModalActions>
              </div>
            )}
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal Lateral do Histórico */}
      {showHistoryModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-2 lg:p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-[95vw] lg:w-[420px] h-[85vh] lg:h-[650px] border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente aprimorado */}
            <div className="flex justify-between items-center p-4 lg:p-5 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-white/80 via-neutral-50/80 to-white/80 dark:from-neutral-800/80 dark:via-neutral-700/80 dark:to-neutral-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent1/10 dark:bg-accent1/20 rounded-xl">
                  <FaHistory className="text-accent1 w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h2 className="text-base lg:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    Histórico
                  </h2>
                  <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400">
                    {labChatHistory.length} {labChatHistory.length === 1 ? 'conversa' : 'conversas'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center font-semibold text-lg"
              >
                ×
              </button>
            </div>
            
            {/* Conteúdo com scroll customizado */}
            <div className="p-4 lg:p-5 h-[calc(85vh-100px)] lg:h-[calc(650px-100px)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500">
              {labHistoryLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center space-y-6 h-full"
                >
                  <div className="relative">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 border-4 border-accent1/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 lg:w-20 lg:h-20 border-4 border-transparent border-t-accent1 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-neutral-700 dark:text-neutral-300 font-medium text-base lg:text-lg mb-2">
                      Carregando histórico
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm lg:text-base">
                      Buscando suas conversas...
                    </p>
                  </div>
                </motion.div>
              ) : labChatHistory.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center space-y-6 h-full text-center px-4"
                >
                  <div className="relative">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 rounded-3xl flex items-center justify-center shadow-lg">
                      <FaHistory className="text-neutral-400 dark:text-neutral-500 w-8 h-8 lg:w-10 lg:h-10" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent1/20 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent1/30 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-neutral-900 dark:text-neutral-100 font-bold text-lg lg:text-xl">
                      Nenhuma conversa ainda
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm lg:text-base leading-relaxed max-w-xs">
                      Suas conversas aparecerão aqui. Comece criando uma nova peça para ver o histórico.
                    </p>
                    <button
                      onClick={() => {
                        setShowHistoryModal(false);
                        setLabShowNewChatModal(true);
                      }}
                      className="mt-4 px-4 py-2 bg-accent1 hover:bg-accent1/90 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Criar Nova Peça
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {labChatHistory.map((session, idx) => {
                    const isActive = labSelectedConversation === (session.session_id || session.id);
                    const chatName = session.chat_name || session.session_id || session.name;
                    
                    return (
                      <motion.div
                        key={session.session_id || session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative p-4 lg:p-5 rounded-2xl cursor-pointer border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                          isActive
                            ? 'border-accent1/50 bg-gradient-to-r from-accent1/5 via-accent1/3 to-accent1/5 shadow-lg shadow-accent1/10'
                            : 'border-neutral-200/50 dark:border-neutral-600/50 hover:border-accent1/30 bg-white/60 dark:bg-neutral-700/60 hover:bg-white/80 dark:hover:bg-neutral-700/80'
                        }`}
                        onClick={() => {
                          const chatName = session.chat_name || session.name;
                          const sessionId = session.session_id || session.id;
                          
                          setLabSelectedConversation(sessionId);
                          setLabSelectedChatName(chatName);
                          
                          // Buscar mensagens do chat específico da API externa
                          loadChatMessages(chatName, true);
                          
                          setLabInput('');
                          setLabSelectedFile(null);
                          setShowHistoryModal(false);
                        }}
                      >
                        {/* Indicador lateral para conversa ativa */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-accent1 to-accent2 rounded-r-full"></div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 flex items-center space-x-3">
                            {/* Avatar/Icon da conversa */}
                            <div className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
                              isActive 
                                ? 'bg-accent1/20 text-accent1' 
                                : 'bg-neutral-100 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 group-hover:bg-accent1/10 group-hover:text-accent1'
                            } transition-all duration-200`}>
                              <FaFileAlt className="w-4 h-4 lg:w-5 lg:h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm lg:text-base truncate">
                                  {chatName}
                                </h4>
                                {isActive && (
                                  <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-2 py-1 bg-accent1 text-white text-xs rounded-full font-medium shadow-sm"
                                  >
                                    Ativo
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-neutral-500 dark:text-neutral-400 text-xs lg:text-sm">
                                {isActive ? 'Conversa atual' : 'Clique para abrir'}
                              </p>
                              {/* Data da última atualização (se disponível) */}
                              {session.last_update && (
                                <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                                  {new Date(session.last_update).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Botão de remover com confirmação melhorada */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 opacity-60 hover:opacity-100 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center justify-center group/delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Tem certeza que deseja remover a conversa "${chatName}"?\n\nEsta ação não pode ser desfeita.`)) {
                                handleHideChat(session.session_id || session.id);
                              }
                            }}
                            title="Remover conversa"
                          >
                            <FaTrash className="w-3 h-3 lg:w-4 lg:h-4 group-hover/delete:animate-pulse" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Footer com estatísticas */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: labChatHistory.length * 0.05 + 0.2 }}
                    className="mt-6 p-4 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/30 dark:border-neutral-700/30"
                  >
                    <div className="flex items-center justify-between text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                      <span>Total de conversas: {labChatHistory.length}</span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Sincronizado
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal do Chip Jurídico */}
      {showChipJuridicoModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={() => setShowChipJuridicoModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                  <FaTags className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    Chip Jurídico
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Selecione as áreas do direito para personalizar suas consultas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChipJuridicoModal(false)}
                className="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center font-semibold text-lg"
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Botão de ação rápida */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleChipJuridicoClearAll}
                  className="px-4 py-2 bg-neutral-500 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Limpar Todas
                </button>
              </div>

              {/* Grid de checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries({
                  civil: 'Cível',
                  trabalhista: 'Trabalhista',
                  contratos: 'Contratos',
                  empresarial: 'Empresarial',
                  penal: 'Penal',
                  tributario: 'Tributário',
                  administrativo: 'Administrativo',
                  consumidor: 'Consumidor',
                  previdenciario: 'Previdenciário',
                  ambiental: 'Ambiental',
                  imobiliario: 'Imobiliário',
                  familia: 'Família',
                  bancario: 'Bancário/Capital',
                  compliance: 'Compliance',
                  aduaneiro: 'Aduaneiro',
                  eleitoral: 'Eleitoral'
                }).map(([key, label]) => (
                  <motion.label
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      chipJuridicoAreas[key]
                        ? 'border-accent1 bg-accent1/10 dark:bg-accent1/20'
                        : 'border-neutral-200 dark:border-neutral-600 hover:border-accent1/50 dark:hover:border-accent1/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chipJuridicoArea"
                      checked={chipJuridicoAreas[key]}
                      onChange={() => handleChipJuridicoAreaChange(key)}
                      className="w-5 h-5 text-accent1 bg-neutral-100 border-neutral-300 focus:ring-accent1 dark:focus:ring-accent1 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                    />
                    <span className={`text-sm font-medium ${
                      chipJuridicoAreas[key]
                        ? 'text-accent1 dark:text-accent1'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {label}
                    </span>
                  </motion.label>
                ))}
              </div>

            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {getSelectedAreas().length > 0 ? '1 área selecionada' : 'Nenhuma área selecionada'}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChipJuridicoModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Aqui você pode adicionar lógica para salvar as preferências
                    toast.success('Preferências do Chip Jurídico salvas!');
                    setShowChipJuridicoModal(false);
                  }}
                  className="px-4 py-2 bg-accent1 hover:bg-accent1/90 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
    </div>
  );
};

export default Home; 