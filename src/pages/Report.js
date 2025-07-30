import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSetup } from '../contexts/SetupContext';
import {
  FaHome,
  FaUser,
  FaCog,
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaLock,
  FaCheck,
  FaTimes as FaTimesCircle,
  FaRobot,
  FaPaperPlane,
  FaMicrophone,
  FaRegFileAlt,
  FaUserShield,
  FaBell,
  FaClipboardList,
  FaCalendarAlt,
  FaBookmark,
  FaExclamationTriangle,
  FaLink,
  FaFileExport,
  FaClock,
  FaMoneyBillWave,
  FaShare,
  FaPlus,
  FaChartLine,
  FaCode,
  FaCommentDots,
  FaHistory,
  FaComment,
  FaBuilding,
  FaCopy,
  FaRedo,
  FaTrash,
} from 'react-icons/fa';
import { BsThreeDots, BsArrowsFullscreen } from 'react-icons/bs';
import { HiLightBulb } from 'react-icons/hi';
import { Line } from 'react-chartjs-2';
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
import FileUpload from '../components/FileUpload';
import SetupSelector from '../components/SetupSelector';
import TokenHistoryDashboard from '../components/TokenHistoryDashboard';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
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
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: ${({ 'data-active': active }) => (active ? '#8C4B35' : '#ADADAD')};
  &:hover {
    background: rgba(140, 75, 53, 0.1);
    color: #8C4B35;
  }
`;

const MenuIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen'
})`
  font-size: 1.2rem;
  margin-right: ${({ isOpen }) => (isOpen ? '1rem' : '0')};
  min-width: 24px;
  text-align: center;
`;

const MenuText = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen'
})`
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;
  white-space: nowrap;
`;

const ToggleButton = styled(motion.button)`
  position: absolute;
  right: -12px;
  top: 20px;
  background: #3b82f6;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 10;
`;

const LogoutButton = styled(motion.button)`
  margin-top: auto;
  padding: 1rem;
  background: rgba(225, 102, 61, 0.1);
  color: #E1663D;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(225, 102, 61, 0.2);
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 2.5rem 2rem 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Report = () => {
  const navigate = useNavigate();
  const { currentUser, logout, hasAdminAccess } = useAuth();
  const { selectedSetup, setSelectedSetup, setups } = useSetup();
  
  const [activeItem, setActiveItem] = useState('reports');
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para o painel de IA
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedSetupState, setSelectedSetupState] = useState(null);
  const [keepFileAttached, setKeepFileAttached] = useState(false);
  
  const chatEndRef = useRef(null);

  const menuItems = [
    { id: 'dashboard', icon: <FaHome />, text: 'Home' },
    { id: 'ai', icon: <FaRobot />, text: 'Inteligência Artificial' },
    { id: 'security', icon: <FaLock />, text: 'Segurança' },
    { id: 'profile', icon: <FaUser />, text: 'Perfil' },
    { id: 'settings', icon: <FaCog />, text: 'Configurações' }
  ];

  // Efeito para rolar o chat para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatChatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileUpload = (file) => {
    console.log('File uploaded:', file);
    setSelectedFile(file);
    if (!file) {
      setSelectedFile(null);
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
    setChatInput('');
    if (!keepFileAttached) setSelectedFile(null);

    try {
        let response;
        if (selectedFile) {
          console.log('Sending message with file:', selectedFile.name);
          const formData = new FormData();
          formData.append('prompt', chatInput.trim() || 'Documento enviado');
          formData.append('maxTokens', 64000);
          formData.append('file', selectedFile);
          formData.append('setup', JSON.stringify(selectedSetup));

          response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formData
          });
        } else {
          console.log('Sending message without file');
          response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: chatInput.trim(),
              maxTokens: 64000,
              setup: selectedSetup
            })
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
    } catch (error) {
        console.error('Erro:', error);
        let errorMessage = 'Erro ao processar a solicitação';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        } else {
            errorMessage = error.message || errorMessage;
        }

        const errorResponse = {
            id: Date.now(),
            role: 'error',
            content: errorMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
        setIsAiTyping(false);
    }
  };

  const handleSetupSelect = (setup) => {
    setSelectedSetupState(setup);
  };

  const handleSetupConfirm = () => {
    if (selectedSetupState) {
      setSelectedSetup(selectedSetupState);
      toast.success('Setup selecionado com sucesso!');
      setShowSetupModal(false);
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

  const handleRegenerateResponse = async (messageId) => {
    try {
      setIsAiTyping(true);
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1 || messageIndex === 0) return;
      
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role !== 'user') return;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          maxTokens: 64000,
          setup: selectedSetup
        })
      });

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
    } catch (error) {
      console.error('Erro ao regenerar resposta:', error);
      const errorResponse = {
        id: Date.now(),
        role: 'error',
        content: 'Erro ao regenerar resposta: ' + error.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSelectedFile(null);
    setChatInput('');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Container>
      <Sidebar isOpen={isOpen}>
        <ToggleButton
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </ToggleButton>
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            data-active={activeItem === item.id}
            onClick={() => {
              setActiveItem(item.id);
              if (item.id !== 'reports') {
                navigate('/');
              }
            }}
            whileHover={{ x: 5 }}
          >
            <MenuIcon isOpen={isOpen}>{item.icon}</MenuIcon>
            <MenuText isOpen={isOpen}>{item.text}</MenuText>
          </MenuItem>
        ))}
        {currentUser && currentUser.role === 'superadmin' && (
          <MenuItem
            key="companies"
            data-active={activeItem === 'companies'}
            onClick={() => { setActiveItem('companies'); navigate('/companies'); }}
            whileHover={{ x: 5 }}
          >
            <MenuIcon isOpen={isOpen}><FaBuilding /></MenuIcon>
            <MenuText isOpen={isOpen}>Empresas</MenuText>
          </MenuItem>
        )}
        {hasAdminAccess() && (
          <MenuItem
            onClick={() => navigate('/admin')}
            whileHover={{ x: 5 }}
          >
            <MenuIcon isOpen={isOpen}><FaUserShield /></MenuIcon>
            <MenuText isOpen={isOpen}>Painel Admin</MenuText>
          </MenuItem>
        )}
        <MenuItem
          key="reports"
          data-active={activeItem === 'reports'}
          onClick={() => { setActiveItem('reports'); }}
          whileHover={{ x: 5 }}
        >
          <MenuIcon isOpen={isOpen}><FaChartBar /></MenuIcon>
          <MenuText isOpen={isOpen}>Relatórios</MenuText>
        </MenuItem>
        <LogoutButton
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MenuIcon isOpen={isOpen}>
            <FaSignOutAlt />
          </MenuIcon>
          <MenuText isOpen={isOpen}>Sair</MenuText>
        </LogoutButton>
      </Sidebar>
      <Content>
        {activeItem === 'reports' && <TokenHistoryDashboard />}
        {activeItem === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <p>Redirecionando para o dashboard principal...</p>
            {setTimeout(() => navigate('/'), 1000)}
          </div>
        )}
        {activeItem === 'ai' && (
          <div>
            <h1>Inteligência Artificial</h1>
            <p>Redirecionando para o dashboard principal...</p>
            {setTimeout(() => navigate('/'), 1000)}
          </div>
        )}
        {activeItem === 'security' && (
          <div>
            <h1>Segurança</h1>
            <p>Redirecionando para o dashboard principal...</p>
            {setTimeout(() => navigate('/'), 1000)}
          </div>
        )}
        {activeItem === 'profile' && (
          <div>
            <h1>Perfil</h1>
            <p>Redirecionando para o dashboard principal...</p>
            {setTimeout(() => navigate('/'), 1000)}
          </div>
        )}
        {activeItem === 'settings' && (
          <div>
            <h1>Configurações</h1>
            <p>Redirecionando para o dashboard principal...</p>
            {setTimeout(() => navigate('/'), 1000)}
          </div>
        )}
      </Content>
    </Container>
  );
};

export default Report; 