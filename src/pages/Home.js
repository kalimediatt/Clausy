import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
} from 'react-icons/fa';
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
  height: 100vh;
  background: #0f172a;
  color: #fff;
`;

const Sidebar = styled(motion.div)`
  width: ${({ isOpen }) => (isOpen ? '250px' : '80px')};
  background: #1e293b;
  padding: 1rem;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
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

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
`;

const MenuItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: ${({ active }) => (active ? '#3b82f6' : '#94a3b8')};

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
`;

const MenuIcon = styled.div`
  font-size: 1.2rem;
  margin-right: ${({ isOpen }) => (isOpen ? '1rem' : '0')};
  min-width: 24px;
  text-align: center;
`;

const MenuText = styled.span`
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;
  white-space: nowrap;
`;

const LogoutButton = styled(motion.button)`
  margin-top: auto;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const WelcomeText = styled(motion.h1)`
  color: #fff;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardTitle = styled.h3`
  color: #94a3b8;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const ChartContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

// Novo componente para exibir os logs de autenticação
const LogsSection = styled.div`
  margin-top: 2rem;
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
`;

const TableRow = styled.tr`
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: ${({ success }) => (success ? '#10b981' : '#ef4444')};
  color: ${({ neutral }) => neutral && '#94a3b8'};
`;

const StatusIcon = styled.span`
  margin-right: 0.5rem;
  vertical-align: middle;
`;

const FilterContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const FilterButton = styled.button`
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
  }
`;

// Componentes para a seção de IA
const AiContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 6rem);
  max-height: calc(100vh - 6rem);
`;

const ChatContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 0.875rem 1.25rem;
  border-radius: 18px;
  color: #fff;
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  background: ${({ isUser }) => 
    isUser 
      ? 'linear-gradient(45deg, #3b82f6, #60a5fa)' 
      : 'rgba(255, 255, 255, 0.1)'};
  margin-bottom: 0.5rem;
  position: relative;
  
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    ${({ isUser }) => (isUser ? 'right: -8px' : 'left: -8px')};
    width: 15px;
    height: 15px;
    background: ${({ isUser }) => 
      isUser 
        ? '#60a5fa' 
        : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 50%;
    transform: translateY(50%);
  }
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 0.5rem;
  text-align: ${({ isUser }) => (isUser ? 'right' : 'left')};
`;

const InputArea = styled.div`
  margin-top: 1rem;
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ChatInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const InputActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const AiTypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
`;

const DotAnimation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .dot {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: dotPulse 1.5s infinite;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes dotPulse {
    0% {
      transform: scale(0.5);
      opacity: 0.3;
    }
    50% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(0.5);
      opacity: 0.3;
    }
  }
`;

const AIModelSelector = styled.div`
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
`;

const ModelButton = styled.button`
  background: ${({ active }) => 
    active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ active }) => 
    active ? 'rgba(59, 130, 246, 0.8)' : 'transparent'};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.2);
  }
`;

const Home = () => {
  const { logout, authLogs } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'success', 'failed'
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      text: 'Olá! Sou a JudAI, sua assistente virtual jurídica. Como posso ajudar você hoje?', 
      isUser: false, 
      timestamp: new Date().toISOString() 
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude');
  const chatEndRef = useRef(null);
  
  // Rolagem automática para o final do chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Envio de mensagem para a IA (simulado)
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Adicionar mensagem do usuário
    const userMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    
    // Simular IA digitando
    setIsAiTyping(true);
    
    // Simular resposta da IA após um tempo
    setTimeout(() => {
      const aiResponses = [
        "Compreendo sua consulta. Com base na jurisprudência atual, posso sugerir alguns caminhos possíveis para esse caso.",
        "Analisando o contexto jurídico, existem precedentes similares que podem ser relevantes para sua situação.",
        "Conforme a legislação vigente, este é um ponto que merece atenção especial quanto aos prazos processuais.",
        "Sua questão envolve aspectos de diferentes áreas do direito. Posso elaborar uma análise mais detalhada se necessário.",
        "Encontrei alguns julgados recentes do STJ que podem auxiliar na fundamentação desse argumento."
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage = {
        id: chatMessages.length + 2,
        text: randomResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      setIsAiTyping(false);
    }, 2000);
  };
  
  // Formatar data para o chat
  const formatChatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Atividades',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: '#3b82f6',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  };

  const menuItems = [
    { id: 'dashboard', icon: <FaHome />, text: 'Dashboard' },
    { id: 'ai', icon: <FaRobot />, text: 'Inteligência Artificial' },
    { id: 'security', icon: <FaLock />, text: 'Segurança' },
    { id: 'profile', icon: <FaUser />, text: 'Perfil' },
    { id: 'settings', icon: <FaCog />, text: 'Configurações' },
    { id: 'reports', icon: <FaChartBar />, text: 'Relatórios' },
    { id: 'users', icon: <FaUsers />, text: 'Usuários' },
  ];

  // Filtrar logs conforme selecionado
  const filteredLogs = authLogs.filter(log => {
    if (logFilter === 'all') return true;
    if (logFilter === 'success') return log.success;
    if (logFilter === 'failed') return !log.success;
    return true;
  });

  // Formatar data local
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString('pt-BR');
  };

  // Renderizar conteúdo baseado na seção ativa
  const renderContent = () => {
    switch (activeItem) {
      case 'ai':
        return (
          <>
            <WelcomeText
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Assistente de IA
            </WelcomeText>
            
            <AIModelSelector>
              <ModelButton 
                active={selectedModel === 'claude'} 
                onClick={() => setSelectedModel('claude')}
              >
                <FaRobot /> Claude
              </ModelButton>
              <ModelButton 
                active={selectedModel === 'gpt'} 
                onClick={() => setSelectedModel('gpt')}
              >
                <FaRobot /> GPT-4
              </ModelButton>
              <ModelButton 
                active={selectedModel === 'law'} 
                onClick={() => setSelectedModel('law')}
              >
                <FaRegFileAlt /> LawGPT
              </ModelButton>
            </AIModelSelector>
            
            <AiContainer>
              <ChatContainer>
                {chatMessages.map((message) => (
                  <div key={message.id}>
                    <MessageBubble isUser={message.isUser}>
                      {message.text}
                      <MessageTime isUser={message.isUser}>
                        {formatChatTime(message.timestamp)}
                      </MessageTime>
                    </MessageBubble>
                  </div>
                ))}
                
                {isAiTyping && (
                  <AiTypingIndicator>
                    <small>JudAI está digitando</small>
                    <DotAnimation>
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </DotAnimation>
                  </AiTypingIndicator>
                )}
                <div ref={chatEndRef} />
              </ChatContainer>
              
              <InputArea>
                <ChatInput
                  type="text"
                  placeholder="Digite sua consulta jurídica..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <InputActions>
                  <ActionButton title="Enviar mensagem de voz">
                    <FaMicrophone />
                  </ActionButton>
                  <ActionButton 
                    onClick={handleSendMessage} 
                    title="Enviar mensagem"
                  >
                    <FaPaperPlane />
                  </ActionButton>
                </InputActions>
              </InputArea>
            </AiContainer>
          </>
        );
      case 'security':
        return (
          <>
            <WelcomeText
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Logs de Autenticação
            </WelcomeText>
            
            <LogsSection>
              <FilterContainer>
                <FilterButton 
                  active={logFilter === 'all'} 
                  onClick={() => setLogFilter('all')}
                >
                  Todos
                </FilterButton>
                <FilterButton 
                  active={logFilter === 'success'} 
                  onClick={() => setLogFilter('success')}
                >
                  Sucessos
                </FilterButton>
                <FilterButton 
                  active={logFilter === 'failed'} 
                  onClick={() => setLogFilter('failed')}
                >
                  Falhas
                </FilterButton>
              </FilterContainer>
              
              <LogTable>
                <thead>
                  <tr>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Usuário</TableHeader>
                    <TableHeader>Data/Hora</TableHeader>
                    <TableHeader>IP</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    // Inverter array para mostrar logs mais recentes primeiro
                    [...filteredLogs].reverse().map((log, index) => (
                      <TableRow key={index}>
                        <TableCell success={log.success}>
                          <StatusIcon>
                            {log.success ? <FaCheck /> : <FaTimesCircle />}
                          </StatusIcon>
                          {log.success ? 'Sucesso' : 'Falha'}
                        </TableCell>
                        <TableCell neutral>{log.username}</TableCell>
                        <TableCell neutral>{formatDate(log.timestamp)}</TableCell>
                        <TableCell neutral>{log.ip}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                        Nenhum log de autenticação disponível
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </LogTable>
            </LogsSection>
          </>
        );
      case 'dashboard':
      default:
        return (
          <>
            <WelcomeText
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Bem-vindo ao JudAI
            </WelcomeText>
            <DashboardGrid>
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle>Total de Usuários</CardTitle>
                <h2>1,234</h2>
              </Card>
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle>Processos Ativos</CardTitle>
                <h2>567</h2>
              </Card>
              <Card
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CardTitle>Decisões Pendentes</CardTitle>
                <h2>89</h2>
              </Card>
            </DashboardGrid>
            <ChartContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CardTitle>Atividades Recentes</CardTitle>
              <Line data={chartData} options={chartOptions} />
            </ChartContainer>
          </>
        );
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
            active={activeItem === item.id}
            onClick={() => setActiveItem(item.id)}
            whileHover={{ x: 5 }}
          >
            <MenuIcon isOpen={isOpen}>{item.icon}</MenuIcon>
            <MenuText isOpen={isOpen}>{item.text}</MenuText>
          </MenuItem>
        ))}
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
        {renderContent()}
      </Content>
    </Container>
  );
};

export default Home; 