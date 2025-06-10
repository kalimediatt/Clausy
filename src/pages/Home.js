import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
import SecurityPanel from './SecurityPanel';

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
  background: #2B2B2B;
  color: #DFDFDF;
`;

const AIContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 6rem);
  max-height: calc(100vh - 6rem);
  background: #f8fafc;
  padding: 1.5rem;
  gap: 1.5rem;
`;

const AIContent = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
`;

const AISidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
`;

const AIChatSection = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow: hidden;
`;

const SidebarTitle = styled.h3`
  font-size: 1.1rem;
  color: #334155;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
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

// Definindo Card antes de seu primeiro uso
const Card = styled(motion.div)`
  background: #DFDFDF;
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid #ADADAD;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
  color: #64748b;
  margin-bottom: 1rem;
  font-size: 1.1rem;
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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

const WelcomeText = styled(motion.h1)`
  color: #DFDFDF;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  background: linear-gradient(45deg, #8C4B35, #2B2B2B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const PlanBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 1rem;
  background: ${props => props.color || 'rgba(225, 102, 61, 0.1)'};
  color: ${props => props.textColor || '#E1663D'};
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: 1rem;
  vertical-align: middle;
`;

const PlanUpgradeBtn = styled.button`
  display: flex;
  align-items: center;
  background-color: #E1663D;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #8C4B35;
  }
`;

const UsageProgressBar = styled.div`
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
  
  div {
    height: 100%;
    background: ${props => props.color || '#3b82f6'};
    width: ${props => `${props.value || 0}%`};
    border-radius: 4px;
    transition: width 0.5s ease;
  }
`;

const UsageStatsContainer = styled.div`
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
`;

const PlanDetailsCard = styled(Card)`
  border-left: 4px solid ${props => props.borderColor || '#3b82f6'};
`;

const PlanFeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  
  li {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: #334155;
    
    svg {
      color: #10b981;
      margin-right: 0.5rem;
      flex-shrink: 0;
    }
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartContainer = styled(motion.div)`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

// Novo componente para exibir os logs de autenticação
const LogsSection = styled.div`
  margin-top: 2rem;
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 0.5rem;
`;

const PaginationButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: ${props => props.active ? '#3b82f6' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#64748b'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#3b82f6' : '#f8fafc'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f8fafc;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: ${props => props.neutral ? '#64748b' : '#1e293b'};
  font-size: 0.875rem;
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

const FilterButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  background: ${({ active }) => active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.05)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

// Componentes para a seção de IA
const AiContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 6rem);
  max-height: calc(100vh - 6rem);
`;

const AIHeader = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const UsageStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const UsageStat = styled.div`
  background: ${props => props.color || '#f8fafc'};
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
`;

const UsageValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #334155;
  margin-bottom: 0.25rem;
`;

const UsageLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const SuggestedPrompts = styled.div`
  margin-top: 1rem;
`;

const PromptSectionTitle = styled.h3`
  font-size: 1rem;
  color: #334155;
  margin-bottom: 0.75rem;
`;

const PromptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
`;

const PromptButton = styled.button`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  text-align: left;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: 600px; // Altura fixa
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ClearChatButton = styled.button`
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #e2e8f0;
    color: #334155;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const MessageActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const MessageActionButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #334155;
  }
`;

const MessageItemWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isUser'
})`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 1rem;
  width: 100%;

  &:hover ${MessageActions} {
    opacity: 1;
  }
`;

const MessageBubble = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'isError'
})`
  background: ${props => props.isUser ? '#E1663D' : '#DFDFDF'};
  color: ${props => props.isUser ? 'white' : '#2B2B2B'};
  padding: 1rem;
  border-radius: 12px;
  max-width: 80%;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;
  word-break: break-word;

  ${props => props.isError && `
    background: #fee2e2;
    color: #dc2626;
  `}
`;

const ChatInputContainer = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: auto;
  flex-shrink: 0; // Impede que o input encolha
`;

const ChatInput = styled.textarea`
  flex: 1;
  border: 1px solid #ADADAD;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.875rem;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.5;
  background: #DFDFDF;
  color: #2B2B2B;

  &:focus {
    outline: none;
    border-color: #E1663D;
    box-shadow: 0 0 0 2px rgba(225, 102, 61, 0.1);
  }
`;

const SendButton = styled.button`
  background: #E1663D;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #8C4B35;
  }

  &:disabled {
    background: #ADADAD;
    cursor: not-allowed;
  }
`;

const AiTypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1rem;
  padding-left: 1rem;
  color: #64748b;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MessageItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isUser'
})`
  display: flex;
  flex-direction: column;
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  max-width: 80%;
`;

const MessageTimeWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isUser'
})`
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 0.5rem;
  text-align: ${props => props.isUser ? 'right' : 'left'};
  color: ${props => props.isUser ? 'rgba(255, 255, 255, 0.8)' : '#64748b'};
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TypingDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #3b82f6;
  opacity: 0.6;
  animation: pulse 1.5s infinite;
  animation-delay: ${props => props.delay || '0s'};

  @keyframes pulse {
    0%, 100% {
      transform: scale(0.8);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.8;
    }
  }
`;

const DotAnimation = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$delay'
})`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
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

const ModelButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  background: ${({ 'data-active': active }) => 
    active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.05)'};
  border: 1px solid ${({ 'data-active': active }) => 
    active ? 'rgba(59, 130, 246, 0.8)' : 'transparent'};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: ${({ 'data-active': active }) => (active ? 'bold' : 'normal')};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

const TaskCard = styled(Card)`
  position: relative;
  padding-left: 3rem;
`;

const TaskIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 1.5rem;
  background: ${props => props.color || 'rgba(59, 130, 246, 0.1)'};
  color: ${props => props.iconColor || '#3b82f6'};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const TaskTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #334155;
`;

const TaskDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.75rem;
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #94a3b8;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => 
    props.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
    props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
    props.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
    'rgba(59, 130, 246, 0.1)'
  };
  color: ${props => 
    props.type === 'warning' ? '#f59e0b' :
    props.type === 'error' ? '#ef4444' :
    props.type === 'success' ? '#10b981' :
    '#3b82f6'
  };
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin: 1.5rem 0;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-child {
    padding-top: 0;
  }
`;

const SettingText = styled.div`
  flex: 1;
`;

const SettingTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: #334155;
`;

const SettingDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
`;

const ToggleSwitch = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  background: ${props => props['data-active'] ? '#E1663D' : '#ADADAD'};
  width: 48px;
  height: 24px;
  border-radius: 9999px;
  position: relative;
  transition: background 0.2s ease;
  border: none;
  cursor: pointer;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props['data-active'] ? 'calc(100% - 22px)' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
  }
`;

const SelectInput = styled.select`
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  color: #334155;
`;

const DashboardStatCard = styled.div`
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-3px);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 8px;
  background-color: #3b82f6;
  color: white;
  margin-right: 15px;
  font-size: 1.2rem;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const DashboardStatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
`;

const DashboardStatLabel = styled.div`
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
`;

const UserListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.bg || '#3b82f6'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  text-transform: uppercase;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #334155;
`;

const UserRole = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const UserActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconAction = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f1f5f9;
    color: #1e293b;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.status === 'active' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.status === 'active' ? '#166534' : '#991b1b'};
`;

const SavedPrompt = styled.div`
  background: #f8fafc;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`;

const SavedPromptTitle = styled.div`
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
`;

const SavedPromptText = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const PromptTitle = styled.div`
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
`;

const PromptText = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const DoughnutChart = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    #3b82f6 0% 55%,
    #f59e0b 55% 75%,
    #10b981 75% 85%,
    #64748b 85% 100%
  );
  margin: 1.5rem auto;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 110px;
    height: 110px;
    background: white;
    border-radius: 50%;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${props => props.color};
`;

// Estilos para Dashboard
const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(1, 1fr);
    padding: 0 20px;
  }
`;

const InfoBannerContainer = styled.div`
  grid-column: span 12;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatisticsSection = styled.section`
  grid-column: span 12;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
`;

const StatTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 20px;
`;

const StatCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const TasksSection = styled.section`
  grid-column: span 6;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-column: span 12;
  }
`;

const TasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TasksTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
`;

const TasksCounter = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
`;

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 350px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 5px;
  }
`;

const TaskItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-left: 3px solid ${props => 
    props.priority === 'high' ? '#ef4444' : 
    props.priority === 'medium' ? '#f59e0b' : '#3b82f6'
  };
  background-color: #f8fafc;
  border-radius: 5px;
  margin-bottom: 10px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateX(3px);
  }
`;

const TaskItemContent = styled.div`
  flex: 1;
`;

const TaskListItemTitle = styled.h4`
  font-size: 0.95rem;
  color: #0f172a;
  margin: 0 0 5px 0;
`;

const TaskListItemDescription = styled.p`
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 10px 0;
`;

const TaskDueDate = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #94a3b8;
`;

const TaskItemActions = styled.div`
  display: flex;
  align-items: center;
`;

const TaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: none;
  background-color: #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #10b981;
    color: white;
  }
`;

const EmptyTasksMessage = styled.p`
  text-align: center;
  color: #94a3b8;
  padding: 30px 0;
  font-size: 0.9rem;
`;

// Estilos para Equipe
const TeamSection = styled.section`
  grid-column: span 6;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-column: span 12;
  }
`;

const TeamSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TeamTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
`;

const TeamViewAll = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.85rem;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TeamList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 350px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 5px;
  }
`;

const TeamMember = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateX(3px);
  }
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  margin-right: 12px;
`;

const MemberInfo = styled.div`
  flex: 1;
`;

const MemberName = styled.div`
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
`;

const MemberRole = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const TeamMemberAction = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: none;
  background-color: #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3b82f6;
    color: white;
  }
`;

const EmptyTeamMessage = styled.p`
  text-align: center;
  color: #94a3b8;
  padding: 30px 0;
  font-size: 0.9rem;
`;

// Estilos para Gráficos e Distribuição
const QueryDistributionSection = styled.section`
  grid-column: span 6;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-column: span 12;
  }
`;

const DistributionTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 20px;
`;

const DistributionChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const DistributionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DistributionLabel = styled.div`
  display: flex;
  align-items: center;
  width: 200px;
  font-size: 0.85rem;
  color: #0f172a;
`;

const ColorDot = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
`;

const DistributionBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
`;

const DistributionProgress = styled.div`
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px;
`;

const DistributionPercentage = styled.div`
  width: 45px;
  text-align: right;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
`;

// Estilos para Plano Atual
const CurrentPlanSection = styled.section`
  grid-column: span 6;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-column: span 12;
  }
`;

const CurrentPlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const CurrentPlanTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e293b;
`;

const CurrentPlanDetails = styled.div`
  padding: 20px;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
`;

const PlanName = styled.h4`
  font-size: 1.4rem;
  font-weight: 600;
  color: #3b82f6;
  margin: 0 0 15px 0;
`;

const PlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const PlanInfoItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #64748b;
`;

const PlanPrice = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: #0f172a;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
`;

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

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const SetupModal = styled(Modal)`
  background: rgba(0, 0, 0, 0.8);
`;

const SetupModalContent = styled(ModalContent)`
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
`;

const SetupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const SetupTitle = styled.h2`
  color: #334155;
  font-size: 1.5rem;
  margin: 0;
`;

const SetupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SetupCard = styled.div`
  background: white;
  border: 2px solid ${props => props.selected ? '#3b82f6' : '#e2e8f0'};
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const SetupCardTitle = styled.h3`
  color: #334155;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const SetupCardDescription = styled.p`
  color: #64748b;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
`;

const SetupCardFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    
    svg {
      color: #10b981;
    }
  }
`;

const SetupActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const SetupButton = styled.button`
  background: ${props => props.primary ? '#3b82f6' : '#e2e8f0'};
  color: ${props => props.primary ? 'white' : '#64748b'};
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? '#2563eb' : '#cbd5e1'};
  }
`;

const CurrentSetup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  color: #334155;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const ToggleSwitchStyled = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  width: 60px;
  height: 28px;
  border-radius: 14px;
  background: ${props => props['data-active'] ? '#22c55e' : '#e5e7eb'};
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  padding: 0;
`;

const SwitchCircle = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'data-active'
})`
  position: absolute;
  left: ${props => props['data-active'] ? '32px' : '2px'};
  top: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  transition: left 0.2s;
`;

const SwitchLabel = styled.span`
  position: absolute;
  left: 10px;
  font-size: 0.7rem;
  color: #fff;
  font-weight: bold;
  user-select: none;
`;

const SwitchLabelOff = styled.span`
  position: absolute;
  right: 8.5px;
  font-size: 0.7rem;
  color: #888;
  font-weight: bold;
  user-select: none;
`;

const Home = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    logout, 
    users, 
    loadUsers,
    hasAdminAccess,
    getCurrentPlanData,
    processAiQuery,
    getQueryHistory,
    getDashboardStats,
    getUserTasks,
    getTeamMembers,
    getQueryDistribution,
    loadAuthLogs,
    authLogs,
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
  const [usageStats, setUsageStats] = useState({
    queries_today: 0,
    tokens_today: 0,
    queries_this_month: 0,
    total_queries: 0
  });
  const [fileContent, setFileContent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedSetupState, setSelectedSetupState] = useState(null);
  const [keepFileAttached, setKeepFileAttached] = useState(false);
  const [securityFilter, setSecurityFilter] = useState('all');
  const [securityPage, setSecurityPage] = useState(currentPage || 1);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState(null);

  const chatEndRef = useRef(null);

  const loadTasks = useCallback(async () => {
    try {
      const tasks = await getUserTasks();
      setUserTasks(tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    }
  }, [getUserTasks]);

  const loadTeamMembers = useCallback(async () => {
    try {
      const members = await getTeamMembers();
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Erro ao carregar membros da equipe');
    }
  }, [getTeamMembers]);

  const loadQueryDistribution = useCallback(async () => {
    try {
      const distribution = await getQueryDistribution();
      setQueryDistributionData(distribution || null);
    } catch (error) {
      console.error('Error loading query distribution:', error);
      toast.error('Erro ao carregar distribuição de consultas');
    }
  }, [getQueryDistribution]);

  // Efeito único para carregar dados iniciais
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser, getDashboardStats, getUserTasks, getTeamMembers, getQueryDistribution]);

  // Efeito para carregar dados específicos da aba
  useEffect(() => {
    if (!currentUser) return;

    if (activeItem === 'users') {
      setIsLoadingUsers(true);
      loadUsers()
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
          console.error('Error loading users:', error);
          toast.error('Erro ao carregar usuários');
          setUsersCache([]);
          setLastUsersLoad(null);
        })
        .finally(() => setIsLoadingUsers(false));
    } else if (activeItem === 'security') {
      // Carregar logs apenas se ainda não foram carregados OU se mudou de página
      if (!authLogs || authLogs.length === 0 || typeof currentPage !== 'undefined') {
        setIsLoading(true);
        loadAuthLogs(currentPage)
          .catch(error => {
            console.error('Error loading auth logs:', error);
            toast.error('Erro ao carregar logs de autenticação');
          })
          .finally(() => setIsLoading(false));
      }
    }
    // eslint-disable-next-line
  }, [activeItem, currentUser, currentPage, loadUsers, loadAuthLogs]);

  // Efeito para rolar o chat para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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
      console.error('Error loading initial data:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, loadTasks, loadTeamMembers, loadQueryDistribution]);

  const removeUser = async (email) => {
    try {
      const response = await fetch(`/api/users/${email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing user:', error);
      return { success: false, message: 'Error removing user' };
    }
  };

  const addCredits = async (userId, amount) => {
    try {
      const response = await fetch(`/api/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ amount })
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, message: 'Error adding credits' };
    }
  };

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
          color: '#64748b',
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
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
    { id: 'reports', icon: <FaChartBar />, text: 'Relatórios' }
  ];

  const filteredLogs = useMemo(() => {
    if (!authLogs || !Array.isArray(authLogs)) return [];
    if (logFilter === 'all') return authLogs;
    return authLogs.filter(log => log.status === logFilter);
  }, [authLogs, logFilter]);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString('pt-BR');
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalType('edit');
    setEditName(user.name || '');
    setEditRole(user.role || 'user');
    setModalOpen(true);
  };

  const handleAddCredits = (user) => {
    setSelectedUser(user);
    setModalType('credits');
    setCreditsAmount(100);
    setModalOpen(true);
  };

  const handleRemoveUser = async (user) => {
    if (window.confirm(`Tem certeza que deseja remover o usuário ${user.name}?`)) {
      try {
        setIsLoadingUsers(true);
        const result = await removeUser(user.email);
        
        if (result.success) {
          toast.success('Usuário removido com sucesso');
          // Recarregar a lista após a remoção
          await loadUsers();
        } else {
          toast.error(result.message || 'Erro ao remover usuário');
        }
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        toast.error('Erro inesperado ao remover usuário');
      } finally {
        setIsLoadingUsers(false);
      }
    }
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

  const loadData = async () => {
    try {
      setIsLoading(true);
      // ... existing code ...
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleFileUpload = (file) => {
    console.log('File uploaded:', file);
    setSelectedFile(file);
    // Se o arquivo for null, significa que foi removido
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
    setChatInput(''); // Limpa o texto
    if (!keepFileAttached) setSelectedFile(null); // Limpa o arquivo selecionado se o toggle estiver desligado

    try {
        let response;
        if (selectedFile) {
          console.log('Sending message with file:', selectedFile.name);
          // Envia como FormData se houver arquivo
          const formData = new FormData();
          formData.append('prompt', chatInput.trim() || 'Documento enviado');
          formData.append('maxTokens', 64000);
          formData.append('file', selectedFile);
          formData.append('setup', JSON.stringify(selectedSetup));

          console.log('FormData contents:', {
            prompt: chatInput.trim() || 'Documento enviado',
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            setup: selectedSetup
          });

          response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formData
          });
        } else {
          console.log('Sending message without file');
          // Envia como JSON se não houver arquivo
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
      <DashboardContainer>
        <InfoBannerContainer>
          <WelcomeText>Bem-vindo(a), {currentUser?.name || 'Usuário'}!</WelcomeText>
        </InfoBannerContainer>
        
        <StatisticsSection>
          <StatTitle>Estatísticas de uso</StatTitle>
          <StatCards>
            <DashboardStatCard>
              <StatIcon>
                <FaChartLine />
              </StatIcon>
              <StatInfo>
                <DashboardStatValue>{usageStats?.queries_today || 0}</DashboardStatValue>
                <DashboardStatLabel>Consultas hoje</DashboardStatLabel>
              </StatInfo>
            </DashboardStatCard>
            <DashboardStatCard>
              <StatIcon style={{ backgroundColor: '#f59e0b' }}>
                <FaCode />
              </StatIcon>
              <StatInfo>
                <DashboardStatValue>{usageStats?.tokens_today || 0}</DashboardStatValue>
                <DashboardStatLabel>Tokens hoje</DashboardStatLabel>
              </StatInfo>
            </DashboardStatCard>
            <DashboardStatCard>
              <StatIcon style={{ backgroundColor: '#10b981' }}>
                <FaClock />
              </StatIcon>
              <StatInfo>
                <DashboardStatValue>{usageStats?.queries_this_month || 0}</DashboardStatValue>
                <DashboardStatLabel>Consultas no mês</DashboardStatLabel>
              </StatInfo>
            </DashboardStatCard>
            <DashboardStatCard>
              <StatIcon style={{ backgroundColor: '#8b5cf6' }}>
                <FaCommentDots />
              </StatIcon>
              <StatInfo>
                <DashboardStatValue>{usageStats?.total_queries || 0}</DashboardStatValue>
                <DashboardStatLabel>Total de consultas</DashboardStatLabel>
              </StatInfo>
            </DashboardStatCard>
          </StatCards>
        </StatisticsSection>

        <TasksSection>
          <TasksHeader>
            <TasksTitle>Tarefas Pendentes</TasksTitle>
            <TasksCounter>{userTasks?.length || 0}</TasksCounter>
          </TasksHeader>
          <TasksList>
            {userTasks && userTasks.length > 0 ? (
              userTasks.map(task => (
                <TaskItem key={task.id} priority={task.priority}>
                  <TaskItemContent>
                    <TaskListItemTitle>{task.title}</TaskListItemTitle>
                    <TaskListItemDescription>{task.description}</TaskListItemDescription>
                    <TaskDueDate>
                      <FaCalendarAlt style={{ marginRight: '5px' }} />
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </TaskDueDate>
                  </TaskItemContent>
                  <TaskItemActions>
                    <TaskButton aria-label="Complete task">
                      <FaCheck />
                    </TaskButton>
                  </TaskItemActions>
                </TaskItem>
              ))
            ) : (
              <EmptyTasksMessage>
                Não há tarefas pendentes
              </EmptyTasksMessage>
            )}
          </TasksList>
        </TasksSection>

        <TeamSection>
          <TeamSectionHeader>
            <TeamTitle>Membros da Equipe</TeamTitle>
            <TeamViewAll>Ver todos</TeamViewAll>
          </TeamSectionHeader>
          <TeamList>
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <TeamMember key={member.id}>
                  <Avatar style={{ backgroundColor: member.color || '#3b82f6' }}>
                    {member.initials || member.name?.substring(0, 2) || 'U'}
                  </Avatar>
                  <MemberInfo>
                    <MemberName>{member.name || 'Usuário'}</MemberName>
                    <MemberRole>{member.role || 'Membro'}</MemberRole>
                  </MemberInfo>
                  <TeamMemberAction>
                    <FaComment />
                  </TeamMemberAction>
                </TeamMember>
              ))
            ) : (
              <EmptyTeamMessage>
                Não há membros na equipe
              </EmptyTeamMessage>
            )}
          </TeamList>
        </TeamSection>

        {queryDistributionData && queryDistributionData.distribution && (
          <QueryDistributionSection>
            <DistributionTitle>Distribuição de Consultas</DistributionTitle>
            <DistributionChart>
              {queryDistributionData.distribution.map((item, index) => (
                <DistributionItem key={index}>
                  <DistributionLabel>
                    <ColorDot style={{ backgroundColor: item.color || '#3b82f6' }} />
                    {item.label || 'Categoria'}
                  </DistributionLabel>
                  <DistributionBar>
                    <DistributionProgress 
                      style={{ 
                        width: `${item.percentage || 0}%`,
                        backgroundColor: item.color || '#3b82f6'
                      }} 
                    />
                  </DistributionBar>
                  <DistributionPercentage>{item.percentage || 0}%</DistributionPercentage>
                </DistributionItem>
              ))}
            </DistributionChart>
          </QueryDistributionSection>
        )}

        {queryDistributionData && queryDistributionData.planDistribution && (
          <QueryDistributionSection>
            <DistributionTitle>Usuários por Plano</DistributionTitle>
            <DistributionChart>
              {queryDistributionData.planDistribution.map((plan, index) => {
                const userCount = typeof plan.user_count === 'number' ? plan.user_count : parseInt(plan.user_count || '0', 10);
                
                return (
                <DistributionItem key={index}>
                  <DistributionLabel>
                    <ColorDot style={{ backgroundColor: plan.color || '#3b82f6' }} />
                    {plan.label || 'Plano'}
                  </DistributionLabel>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      backgroundColor: plan.color || '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {userCount}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {userCount === 1 ? 'usuário' : 'usuários'}
                    </div>
                  </div>
                </DistributionItem>
                );
              })}
            </DistributionChart>
          </QueryDistributionSection>
        )}

        <CurrentPlanSection>
          <CurrentPlanHeader>
            <CurrentPlanTitle>Seu Plano Atual</CurrentPlanTitle>
            {currentUser && currentUser.plan_id && currentUser.plan_id !== 'PRO' && (
              <PlanUpgradeBtn>
                Fazer upgrade
              </PlanUpgradeBtn>
            )}
          </CurrentPlanHeader>
          <CurrentPlanDetails style={{ borderColor: planData.color || '#3b82f6' }}>
            <PlanName style={{ color: planData.color || '#3b82f6' }}>{planData.name || 'Plano Básico'}</PlanName>
            <PlanInfo>
              <PlanInfoItem>
                <FaClock style={{ marginRight: '8px' }} />
                {planData.maxQueriesPerHour || 0} consultas/hora
              </PlanInfoItem>
              <PlanInfoItem>
                <FaCode style={{ marginRight: '8px' }} />
                {(planData.maxTokensPerHour || 0).toLocaleString()} tokens/hora
              </PlanInfoItem>
              <PlanInfoItem>
                <FaHistory style={{ marginRight: '8px' }} />
                {!planData.historyRetention 
                  ? 'Sem histórico'
                  : `Histórico por ${planData.historyRetention}h`}
              </PlanInfoItem>
            </PlanInfo>
            <PlanPrice>{planData.price || 'Gratuito'}</PlanPrice>
            {currentUser && currentUser.plan_id && currentUser.plan_id !== 'PRO' && (
              <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Upgrade disponível
              </small>
            )}
          </CurrentPlanDetails>
        </CurrentPlanSection>
      </DashboardContainer>
    );
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
          maxTokens: 500,
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
      const errorMessage = error.message || 'Erro ao regenerar resposta';
      
      const errorResponse = {
        id: Date.now(),
        role: 'error',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatInput('');
    toast.success('Chat limpo com sucesso!');
  };

  const renderIAPanel = () => {
    return (
        <AIContainer>
        <CurrentSetup>
          <FaCog />
          Setup atual: {selectedSetup?.title || 'Não selecionado'}
          <SetupButton onClick={() => setShowSetupModal(true)}>
            Alterar Setup
          </SetupButton>
        </CurrentSetup>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem', color: '#334155' }}>Manter arquivo anexado após envio</span>
          <ToggleSwitchStyled
            type="button"
            data-active={keepFileAttached}
            aria-pressed={keepFileAttached}
            onClick={() => setKeepFileAttached(v => !v)}
          >
            {keepFileAttached ? (
              <SwitchLabel>ON</SwitchLabel>
            ) : (
              <SwitchLabelOff>OFF</SwitchLabelOff>
            )}
            <SwitchCircle data-active={keepFileAttached} />
          </ToggleSwitchStyled>
        </div>
        <FileUpload onFileUpload={handleFileUpload} file={selectedFile} />
            <ChatContainer>
          <ChatHeader>
            <h3>Chat</h3>
            <ClearChatButton onClick={handleClearChat}>
              <FaTrash /> Limpar Chat
            </ClearChatButton>
          </ChatHeader>
                <ChatMessages>
                    {messages.map((message, index) => (
                        <MessageItemWrapper key={`${message.role}-${index}-${message.timestamp}`} isUser={message.role === 'user'}>
                            <MessageBubble isUser={message.role === 'user'} isError={message.role === 'error'}>
                                {message.content}
                                <MessageTimeWrapper isUser={message.role === 'user'}>
                                    {formatChatTime(message.timestamp)}
                                </MessageTimeWrapper>
                            </MessageBubble>
                            <MessageActions>
                  <MessageActionButton 
                    onClick={() => handleCopyMessage(message.content)}
                    title="Copiar mensagem"
                  >
                                    <FaCopy /> Copiar
                                </MessageActionButton>
                  {message.role === 'assistant' && (
                    <MessageActionButton 
                      onClick={() => handleRegenerateResponse(message.id)}
                      title="Regenerar resposta"
                      disabled={isAiTyping}
                    >
                                        <FaRedo /> Regenerar
                                    </MessageActionButton>
                                )}
                            </MessageActions>
                        </MessageItemWrapper>
                    ))}
                    {isAiTyping && (
                        <MessageItemWrapper isUser={false}>
                            <MessageBubble isUser={false}>
                                <AiTypingIndicator>
                                    <DotAnimation $delay={0} />
                                    <DotAnimation $delay={0.2} />
                                    <DotAnimation $delay={0.4} />
                                </AiTypingIndicator>
                            </MessageBubble>
                        </MessageItemWrapper>
                    )}
                    <div ref={chatEndRef} />
                </ChatMessages>
                <ChatInputContainer onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }}>
                    <ChatInput
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <SendButton type="submit" disabled={(!chatInput.trim() && !selectedFile) || isAiTyping}>
                        <FaPaperPlane />
                    </SendButton>
                </ChatInputContainer>
            </ChatContainer>

        {showSetupModal && (
          <SetupModal>
            <SetupModalContent>
              <SetupHeader>
                <SetupTitle>Selecione um Setup</SetupTitle>
                <CloseButton onClick={() => setShowSetupModal(false)}>×</CloseButton>
              </SetupHeader>
              <SetupGrid>
                {setups.map((setup, index) => (
                  <SetupCard 
                    key={index}
                    selected={selectedSetupState?.title === setup.title}
                    onClick={() => handleSetupSelect(setup)}
                  >
                    <SetupCardTitle>{setup.title}</SetupCardTitle>
                    <SetupCardDescription>
                      {setup.when_to_use}
                    </SetupCardDescription>
                    <SetupCardFeatures>
                      <li>
                        <FaCheck /> 
                        {setup.prompt.split('.')[0]}
                      </li>
                    </SetupCardFeatures>
                  </SetupCard>
                ))}
              </SetupGrid>
              <SetupActions>
                <SetupButton onClick={() => setShowSetupModal(false)}>
                  Cancelar
                </SetupButton>
                <SetupButton 
                  primary 
                  onClick={handleSetupConfirm}
                  disabled={!selectedSetupState}
                >
                  Confirmar Setup
                </SetupButton>
              </SetupActions>
            </SetupModalContent>
          </SetupModal>
        )}
        </AIContainer>
    );
  };

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== currentPage) {
      loadAuthLogs(newPage);
    }
  }, [loadAuthLogs, currentPage]);

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
            onClick={() => setActiveItem(item.id)}
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
        {activeItem === 'dashboard' && renderDashboard()}
        
        {activeItem === 'ai' && renderIAPanel()}
        
        {activeItem === 'security' && (
          <div>
            <WelcomeText>Segurança</WelcomeText>
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
          </div>
        )}
        
        {activeItem === 'settings' && (
          <div>
            <WelcomeText>Configurações</WelcomeText>
            <SettingsCard>
              <SettingItem>
                <SettingText>
                  <SettingTitle>Notificações</SettingTitle>
                  <SettingDescription>Receber notificações sobre prazos e tarefas</SettingDescription>
                </SettingText>
                <ToggleSwitch data-active={notifications} onClick={() => setNotifications(!notifications)}>
                  <SwitchCircle data-active={notifications} />
                </ToggleSwitch>
              </SettingItem>
              <SettingItem>
                <SettingText>
                  <SettingTitle>Modo Escuro</SettingTitle>
                  <SettingDescription>Usar tema escuro na interface</SettingDescription>
                </SettingText>
                <ToggleSwitch data-active={darkMode} onClick={() => setDarkMode(!darkMode)}>
                  <SwitchCircle data-active={darkMode} />
                </ToggleSwitch>
              </SettingItem>
              <SettingItem>
                <SettingText>
                  <SettingTitle>Salvamento Automático</SettingTitle>
                  <SettingDescription>Salvar as consultas automaticamente</SettingDescription>
                </SettingText>
                <ToggleSwitch data-active={autoSave} onClick={() => setAutoSave(!autoSave)}>
                  <SwitchCircle data-active={autoSave} />
                </ToggleSwitch>
              </SettingItem>
              <SettingItem>
                <SettingText>
                  <SettingTitle>Idioma da Interface</SettingTitle>
                  <SettingDescription>Definir idioma preferido</SettingDescription>
                </SettingText>
                <SelectInput value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </SelectInput>
              </SettingItem>
            </SettingsCard>
          </div>
        )}
      </Content>
      
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
      
      <ToastContainer />
    </Container>
  );
};

export default Home; 