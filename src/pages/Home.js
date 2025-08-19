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
  FaFlask,
  FaSearch,
  FaEdit,
  FaFileAlt,
  FaComments
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

const AIContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  max-height: calc(100vh - 4rem);
  background: #f8fafc;
  padding: 1.5rem;
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
    height: calc(100vh - 3rem);
    max-height: calc(100vh - 3rem);
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }
`;

const AIContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'showSidebar'
})`
  display: grid;
  grid-template-columns: ${props => props.showSidebar ? '280px 1fr' : '1fr'};
  gap: 2rem;
  height: 100%;
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const AISidebar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})`
  display: ${props => props.isVisible ? 'flex' : 'none'};
  flex-direction: column;
  gap: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  min-width: 280px;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 1000;
    border-radius: 0;
    padding: 1rem;
    min-width: auto;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const SidebarOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isVisible ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const AIChatSection = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; // Importante para flexbox funcionar corretamente
  gap: 0; // Remove gap para melhor controle do layout
`;

const SidebarTitle = styled.h3`
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.875rem;
  }
`;

const MobileCloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: none;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #334155;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ConversationItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'selected'
})`
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  background: ${props => props.selected ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff'};
  border: 2px solid ${props => props.selected ? '#3b82f6' : '#e2e8f0'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.selected ? '0 2px 4px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'};
  position: relative;
  
  &:hover {
    background: ${props => props.selected ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#f8fafc'};
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
    margin-bottom: 0.5rem;
  }
`;

const ConversationDeleteButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 6px;
  padding: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #dc2626;
    transform: scale(1.1);
  }

  ${ConversationItem}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    top: 0.375rem;
    right: 0.375rem;
    padding: 0.25rem;
    font-size: 0.65rem;
  }
`;

const ConversationTitle = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  padding-right: 2rem; // Espaço para o botão de lixeira

  @media (max-width: 768px) {
    font-size: 0.95rem;
    padding-right: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding-right: 1.5rem;
  }
`;

const ConversationDate = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const ConversationPreview = styled.div`
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const ActiveIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 0.6rem;
  margin-left: 0.5rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }
`;

const EmptyHistoryState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
`;

const EmptyHistoryIcon = styled.div`
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
`;

const EmptyHistoryTitle = styled.h4`
  font-size: 1.125rem;
  color: #475569;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
`;

const EmptyHistoryDescription = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  max-width: 250px;
`;

const EmptyHistoryButton = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }
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

// ToggleButton removido - não está sendo usado

// Content convertido para Tailwind (flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100)

// MenuItem, MenuIcon, MenuText, LogoutButton removidos - agora usados no componente Sidebar.js

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



const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px 12px 0 0;
  flex-shrink: 0; // Impede que o header encolha
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 0.875rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const ChatTitle = styled.h3`
  font-size: 1.25rem;
  color: #1e293b;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const ChatHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
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

  @media (max-width: 768px) {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
    min-height: 44px;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 0; // Importante para flexbox funcionar corretamente
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    gap: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    gap: 1rem;
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

  @media (max-width: 768px) {
    padding: 0.375rem;
    font-size: 0.8rem;
    min-height: 36px;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.75rem;
    min-height: 40px;
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

  @media (max-width: 768px) {
    max-width: 90%;
    padding: 0.875rem;
  }

  @media (max-width: 480px) {
    max-width: 95%;
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

const ChatInputContainer = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; // Impede que o input encolha
  border-top: 1px solid #e2e8f0;
  position: sticky;
  bottom: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 1.25rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    gap: 0.5rem;
  }
`;

const ChatInput = styled.textarea`
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  font-size: 0.95rem;
  resize: none;
  min-height: 48px;
  max-height: 120px;
  line-height: 1.5;
  background: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  transition: all 0.2s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }

  &:hover {
    border-color: #cbd5e1;
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    font-size: 0.875rem;
    min-height: 48px;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.875rem;
    min-height: 52px;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    min-width: 48px;
    min-height: 48px;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    min-width: 52px;
    min-height: 52px;
    font-size: 0.875rem;
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

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.7rem;
    margin-top: 0.375rem;
  }
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

// StatusBadge removido - não está sendo usado

// SavedPrompt, SavedPromptTitle, SavedPromptText, PromptTitle, PromptText removidos - não estão sendo usados

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



const SetupModal = styled(Modal)`
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
`;

const SetupModalContent = styled(ModalContent)`
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
  z-index: 1001;
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

  @media (max-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
`;

const CurrentSetup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #334155;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 0.875rem 1.25rem;
    font-size: 0.875rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    gap: 0.5rem;
  }
`;

const SetupInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const SetupIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-size: 1.2rem;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
`;

const SetupDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SetupLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const SetupName = styled.span`
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const FileAttachmentToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 0.875rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.5rem;
  }
`;

const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ToggleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
`;

const ToggleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ToggleTitle = styled.span`
  font-size: 0.95rem;
  color: #334155;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ToggleDescription = styled.span`
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const NewConversationButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    font-size: 0.8rem;
  }
`;

const NewConversationButtonSmall = styled.button`
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    color: #2563eb;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(1);
  }

  @media (max-width: 768px) {
    padding: 0.375rem;
    font-size: 0.7rem;
  }

  @media (max-width: 480px) {
    padding: 0.25rem;
    font-size: 0.65rem;
  }
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

// Componentes para o Laboratório
const LaboratoryPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const LabCard = styled(motion.div)`
  background: #DFDFDF;
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid #ADADAD;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
`;

const LabCardTitle = styled.h3`
  color: #2B2B2B;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LabCardDescription = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const LabCardStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${props => props.status === 'active' ? '#10b981' : props.status === 'warning' ? '#f59e0b' : '#ef4444'};
`;

const LabExperimentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ExperimentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ExperimentTitle = styled.h4`
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const ExperimentDescription = styled.p`
  color: #64748b;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
`;

const ExperimentStatus = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  background: ${props => 
    props.status === 'running' ? '#dbeafe' : 
    props.status === 'completed' ? '#dcfce7' : 
    props.status === 'failed' ? '#fee2e2' : '#f3f4f6'};
  color: ${props => 
    props.status === 'running' ? '#1d4ed8' : 
    props.status === 'completed' ? '#166534' : 
    props.status === 'failed' ? '#dc2626' : '#6b7280'};
`;

// Adicione antes da função renderLaboratoryPanel:

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
    console.log('Históricos recebidos da API:', data);
    
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

  // Estados para histórico de conversas
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);

  // Estados para o Laboratório (separados da IA)
  const [labMessages, setLabMessages] = useState([]);
  const [labInput, setLabInput] = useState('');
  const [isLabTyping, setIsLabTyping] = useState(false);
  const [labSelectedFile, setLabSelectedFile] = useState(null);
  const [labShowSetupModal, setLabShowSetupModal] = useState(false);
  const [labSelectedSetupState, setLabSelectedSetupState] = useState(null);
  const [labShowNewChatModal, setLabShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [labShowInitialChatModal, setLabShowInitialChatModal] = useState(true);
  const [initialChatName, setInitialChatName] = useState('');
  const [labKeepFileAttached, setLabKeepFileAttached] = useState(false);
  const [labShowHistorySidebar, setLabShowHistorySidebar] = useState(false);
  const [labChatHistory, setLabChatHistory] = useState([]);
  const [labSelectedConversation, setLabSelectedConversation] = useState(null);
  const [labSelectedChatName, setLabSelectedChatName] = useState(null);
  const [labHistoryLoading, setLabHistoryLoading] = useState(false);
  // [1] Adicione o estado para mensagens pendentes do laboratório
  const [labPendingMessages, setLabPendingMessages] = useState([]);
  // [1] Estados segmentados por chat
  const [labMessagesByChat, setLabMessagesByChat] = useState({});
  const [labPendingMessagesByChat, setLabPendingMessagesByChat] = useState({});

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
    console.log('Chave atual do chat:', key, 'labSelectedChatName:', labSelectedChatName, 'labSelectedConversation:', labSelectedConversation);
    return key;
  };

  const chatEndRef = useRef(null);
  const labChatEndRef = useRef(null);
  
  // Auto-scroll inteligente
  const chatScrollRef = useAutoScroll([safeGet(labMessagesByChat, labSelectedChatName || labSelectedConversation || 'default', [])]);
  const aiScrollRef = useAutoScroll([messages]);

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
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser, getDashboardStats, getUserTasks, getTeamMembers, getQueryDistribution]);

  // Efeito para carregar dados específicos da aba
  useEffect(() => {
    if (!currentUser) return;

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
      // Carregar logs apenas se ainda não foram carregados OU se mudou de página
      if (!authLogs || authLogs.length === 0 || typeof currentPage !== 'undefined') {
        setIsLoading(true);
        loadAuthLogs(currentPage)
          .catch(error => {
            handleError(error, 'carregamento de logs de autenticação');
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
    if (labChatEndRef.current) {
      labChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [labMessages]);

  // Efeito para carregar históricos do laboratório quando acessar o painel
  useEffect(() => {
    if (activeItem === 'laboratory' && currentUser) {
      setLabHistoryLoading(true);
      fetchLabChatsFromRedis(currentUser.user_id || currentUser.id).then(chats => {
        setLabChatHistory(chats);
        setLabHistoryLoading(false);
      });
    }
    // eslint-disable-next-line
  }, [activeItem, currentUser]);

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
  }, [activeItem, loadChatHistory]);

  // Efeito para recarregar mensagens quando o chat selecionado mudar
  useEffect(() => {
    if (labSelectedChatName && activeItem === 'laboratory') {
      console.log('Chat selecionado mudou, recarregando mensagens:', labSelectedChatName);
      loadChatMessages(labSelectedChatName, true);
    }
  }, [labSelectedChatName, activeItem]);

  // Atalhos de teclado
  useKeyboardShortcuts({
    sendMessage: () => {
      if (activeItem === 'laboratory') handleLabSendMessage();
      else if (activeItem === 'ai') handleSendMessage();
    },
    newChat: () => {
      if (activeItem === 'laboratory') setLabShowNewChatModal(true);
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

  // Função para criar nova conversa
  const createNewConversation = useCallback(async () => {
    // Salvar conversa atual se houver mensagens e não estiver já salva
    if (messages.length > 0 && !selectedConversation) {
      await saveCurrentConversation();
    }
    
    // Limpar estado para nova conversa
    setSelectedConversation(null);
    setMessages([]);
    setChatInput('');
    setSelectedFile(null);
  }, [messages, selectedConversation, saveCurrentConversation]);

  // Função para remover conversa do histórico
  const removeConversation = useCallback(async (conversationId, event) => {
    event.stopPropagation(); // Evita que o clique propague para o card
    
    console.log('Tentando remover conversa:', conversationId);
    
    if (window.confirm('Tem certeza que deseja remover esta conversa do histórico?')) {
      try {
        console.log('Confirmado, removendo do Redis...');
        // Remover do Redis
        const success = await removeChatConversation(conversationId);
        console.log('Resultado da remoção:', success);
        
        if (success) {
          // Atualizar estado local
          setChatHistory(prev => {
            const filtered = prev.filter(conv => conv.id !== conversationId);
            console.log('Estado local atualizado, conversas restantes:', filtered.length);
            return filtered;
          });
          
          // Se a conversa removida era a selecionada, limpar seleção
          if (selectedConversation === conversationId) {
            setSelectedConversation(null);
            setMessages([]);
            setChatInput('');
            setSelectedFile(null);
          }
          
          showSuccessToast('Conversa removida com sucesso');
        } else {
          showErrorToast('Erro ao remover conversa');
        }
      } catch (error) {
        console.error('Erro ao remover conversa:', error);
        handleError(error, 'remoção de conversa');
      }
    }
  }, [selectedConversation, removeChatConversation]);







  const formatChatTime = (isoDate) => {
    return formatTime(isoDate);
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
          await loadUsers(true);
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

  // Funções para o Laboratório
  const handleLabFileUpload = (file) => {
    console.log('Lab file uploaded:', file);
    setLabSelectedFile(file);
    if (!file) {
      setLabSelectedFile(null);
    }
  };

  // [3] Atualize handleLabSendMessage para usar o chat atual

  // [3] Atualize handleLabSendMessage para usar o chat atual
  const handleLabSendMessage = async () => {
    if (!labInput.trim() && !labSelectedFile) return;
    
    // Validação da mensagem
    const validation = validateMessage(labInput);
    if (!validation.valid) {
      showInfoToast(validation.error);
      return;
    }
    const chatKey = getCurrentLabChatKey();
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: labSelectedFile ? `${labInput} (Arquivo anexado: ${labSelectedFile.name})` : labInput,
      timestamp: new Date().toISOString()
    };
    setLabMessagesByChat(prev => {
      const newState = { ...prev };
      const currentMessages = safeGet(newState, chatKey, []);
      safeSet(newState, chatKey, [...currentMessages, userMessage]);
      return newState;
    });
    setLabInput('');
    setIsLabTyping(true);
    try {
      // Montar os dados para a API
      // Usar o índice do setup + 1 como ID, ou 1 como padrão se não houver setup selecionado
      const promptId = labSelectedSetupState ? setups.findIndex(s => s.title === labSelectedSetupState.title) + 1 : 1;
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
      } else {
        // fallback para o estado atual
        session_id = labSelectedConversation || getCurrentSessionId(currentUser?.user_id || currentUser?.id || '');
        chat_name = `Chat ${new Date().toLocaleDateString('pt-BR')}`;
      }
      
      console.log('Setup selecionado:', labSelectedSetupState?.title, 'Prompt ID:', promptId);
      console.log('Chat name:', chat_name, 'Session ID:', session_id);
      console.log('labSelectedChatName:', labSelectedChatName);
      console.log('labSelectedConversation:', labSelectedConversation);

      let response;
      if (labSelectedFile) {
        console.log('Sending lab message with file:', labSelectedFile.name);
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

        console.log('FormData contents for lab:', {
          prompt: promptId,
          conteudo: conteudo,
          fileName: labSelectedFile.name,
          fileSize: labSelectedFile.size,
          fileType: labSelectedFile.type,
          chat_name: chat_name,
          session_id: session_id
        });

        response = await fetch('http://138.197.27.151:5000/api/lab-chats/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: formData
        });
      } else {
        console.log('Sending lab message without file');
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

        response = await fetch('http://138.197.27.151:5000/api/lab-chats/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(body)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro na resposta da API do laboratório');
      }

      const data = await response.json();
      console.log('Resposta recebida da API:', data);
      console.log('Chat atual:', labSelectedChatName, 'Session:', labSelectedConversation);
      
      // Processamento universal e robusto da resposta da IA
      let content = 'Resposta recebida da API, mas sem mensagem.';
      let found = false;
      
      console.log('=== PROCESSANDO RESPOSTA DA IA ===');
      console.log('Tipo de dados:', typeof data);
      console.log('Estrutura recebida:', data);
      
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
        console.log('✅ Estratégia 1: Resposta direta encontrada');
      }
      // Estratégia 2: Array de mensagens
      else if (Array.isArray(data) && data.length > 0) {
        console.log('📋 Estratégia 2: Processando array de mensagens');
        // Procurar a última mensagem da IA
        for (let i = data.length - 1; i >= 0; i--) {
          const extracted = extractContent(data[i]);
          if (extracted) {
            content = extracted;
            found = true;
            console.log('✅ Encontrou resposta da IA no array (índice', i, ')');
            break;
          }
        }
      }
      // Estratégia 3: Objeto com propriedades (chats históricos)
      else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        console.log('📁 Estratégia 3: Processando objeto com propriedades');
        
        // Encontrar todas as propriedades que contêm mensagens
        const messageKeys = Object.keys(data).filter(key => {
          const item = data[key];
          return typeof item === 'object' && item !== null && (item.message || item.type === 'ai');
        });
        
        console.log('🔍 Chaves com mensagens encontradas:', messageKeys);
        
        if (messageKeys.length > 0) {
          // Ordenar por número (maior primeiro) para pegar a última mensagem
          const sortedKeys = messageKeys.sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return isNaN(numA) || isNaN(numB) ? 0 : numB - numA;
          });
          
          console.log('📊 Chaves ordenadas:', sortedKeys);
          
          // Tentar cada chave até encontrar a ÚLTIMA resposta da IA
          for (const key of sortedKeys) {
            const item = data[key];
            if (item && item.message && item.message.type === 'ai' && item.message.content) {
              content = item.message.content;
              found = true;
              console.log('✅ Encontrou resposta da IA na chave:', key, 'Conteúdo:', content.substring(0, 100) + '...');
              break; // Para na primeira mensagem da IA encontrada (que será a mais recente devido à ordenação)
            }
          }
        }
        
        // Se não encontrou nas chaves numeradas, verificar resposta direta no objeto
        if (!found && data.message) {
          const extracted = extractContent(data);
          if (extracted) {
            content = extracted;
            found = true;
            console.log('✅ Encontrou resposta direta no objeto');
          }
        }
      }
      
      // Estratégia 4: Busca genérica em qualquer estrutura
      if (!found && data && typeof data === 'object') {
        console.log('🔍 Estratégia 4: Busca genérica em todas as propriedades');
        
        const searchInObject = (obj, path = '') => {
          const keys = Object.keys(obj);
          for (const key of keys) {
            const currentPath = path ? `${path}.${key}` : key;
            const item = obj[key];
            
            if (typeof item === 'object' && item !== null) {
              // Verificar especificamente por mensagens da IA
              if (item.message && item.message.type === 'ai' && item.message.content) {
                content = item.message.content;
                found = true;
                console.log('✅ Encontrou resposta da IA em:', currentPath, 'Conteúdo:', content.substring(0, 100) + '...');
                return true;
              }
              // Buscar recursivamente
              if (searchInObject(item, currentPath)) {
                return true;
              }
            }
          }
          return false;
        };
        
        searchInObject(data);
      }
      
      // Estratégia 5: Fallbacks para estruturas específicas
      if (!found) {
        console.log('🔄 Estratégia 5: Tentando fallbacks');
        
        if (data && data.message && typeof data.message === 'string') {
          content = data.message;
          found = true;
          console.log('✅ Fallback 1: data.message (string)');
        } else if (data && data.result) {
          content = data.result;
          found = true;
          console.log('✅ Fallback 2: data.result');
        } else if (data && data.content) {
          content = data.content;
          found = true;
          console.log('✅ Fallback 3: data.content');
        }
      }
      
      if (!found) {
        console.log('❌ Nenhuma estratégia funcionou. Estrutura completa:', JSON.stringify(data, null, 2));
        content = 'DEBUG: ' + JSON.stringify(data);
      } else {
        console.log('✅ Resposta da IA extraída com sucesso:', content.substring(0, 100) + '...');
        console.log('📝 Conteúdo completo da resposta:', content);
      }
      
      const labResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: content,
        timestamp: new Date().toISOString()
      };
      console.log('Adicionando resposta da IA ao chat:', labSelectedChatName, 'Conteúdo:', content.substring(0, 100) + '...');
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        const currentMessages = safeGet(newState, chatKey, []);
        safeSet(newState, chatKey, [...currentMessages, labResponse]);
        return newState;
      });
      setLabPendingMessagesByChat(prev => {
        const newState = { ...prev };
        const currentMessages = safeGet(newState, chatKey, []);
        safeSet(newState, chatKey, [...currentMessages, labResponse]);
        return newState;
      });
      
      // Recarregar mensagens da API para garantir sincronização
      if (labSelectedChatName) {
        try {
          console.log('Recarregando mensagens após envio bem-sucedido:', labSelectedChatName);
          await loadChatMessages(labSelectedChatName, false);
        } catch (error) {
          console.error('Erro ao recarregar mensagens após envio:', error);
        }
      } else {
        console.warn('labSelectedChatName não definido, não foi possível recarregar mensagens');
      }
    } catch (error) {
      handleError(error, 'envio de mensagem do laboratório');
      const errorResponse = {
        id: Date.now() + 2,
        role: 'error',
        content: error.message || 'Erro ao processar a solicitação para o laboratório',
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
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Dashboard
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Bem-vindo(a), {currentUser?.name || 'Usuário'}! • Visão geral da sua conta
                </p>
              </div>
              
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema Online</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 transition-colors duration-500"
          >
        
            {/* Statistics Header */}
            <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center space-x-4"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
                  <FaChartLine className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Estatísticas de Uso
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                    Acompanhe seu desempenho e atividade na plataforma
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Statistics Content */}
            <div className="p-8 space-y-6">
              
              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <FaChartLine className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Consultas Hoje
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                          Total de consultas realizadas hoje
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.queries_today || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        <FaCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Tokens Hoje
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                          Tokens processados hoje
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.tokens_today || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <FaClock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Consultas no Mês
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                          Total mensal de consultas
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.queries_this_month || 0}
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <FaCommentDots className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          Total de Consultas
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                          Consultas realizadas no total
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {usageStats?.total_queries || 0}
                    </div>
                  </div>
                </div>
              </motion.div>



              



              {/* Plan Distribution */}
        {queryDistributionData && queryDistributionData.planDistribution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    Usuários por Plano
                  </h3>
                  <div className="space-y-3">
              {queryDistributionData.planDistribution.map((plan, index) => {
                const userCount = typeof plan.user_count === 'number' ? plan.user_count : parseInt(plan.user_count || '0', 10);
                return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: plan.color || '#3b82f6' }}
                            />
                            <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {plan.label || 'Plano'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: plan.color || '#3b82f6' }}
                            >
                      {userCount}
                    </div>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {userCount === 1 ? 'usuário' : 'usuários'}
                            </span>
                    </div>
                  </div>
                );
              })}
                  </div>
                </motion.div>
              )}

              {/* Current Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/60 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Seu Plano Atual
                  </h3>
            {currentUser && currentUser.plan_id && currentUser.plan_id !== 'PRO' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium rounded-full hover:shadow-lg transition-all duration-300"
                    >
                Fazer upgrade
                    </motion.button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: 'rgba(225, 102, 61, 0.1)',
                        color: '#E1663D'
                      }}
                    >
                      {planData.name || 'Free Trial'}
                    </div>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {planData.price || 'Gratuito'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <FaClock className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {planData.maxQueriesPerHour || 100}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          consultas/hora
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCode className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {(planData.maxTokensPerHour || 20000).toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          tokens/hora
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaHistory className="w-4 h-4 text-neutral-500" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
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
      setLabShowSetupModal(false);
      // Não limpar o setup selecionado, apenas fechar o modal
    }
  };

  const handleLabClearChat = () => {
    setLabMessages([]);
    setLabInput('');
    setLabSelectedChatName(null);
    toast.success('Chat do laboratório limpo com sucesso!');
  };

  const handleCreateNewChat = async () => {
    if (!newChatName.trim()) {
      toast.error('Por favor, insira um nome para o chat');
      return;
    }
    
    const chatName = newChatName.trim();
    const userId = currentUser?.user_id || currentUser?.id;
    const sessionId = getCurrentSessionId(userId);
    
    setLabMessages([]);
    setLabInput('');
    setLabSelectedFile(null);
    setLabSelectedConversation(sessionId); // Usar session_id único
    setLabSelectedChatName(chatName); // Salvar o nome do chat
    setNewChatName('');
    setLabShowNewChatModal(false);
    showSuccessToast(`Novo chat "${chatName}" criado com sucesso!`);

    // Salvar no Redis com session_id único e chat_name separado
    if (currentUser) {
      await saveLabChatToRedis(userId, chatName, sessionId);
      // Recarregar histórico
      fetchLabChatsFromRedis(userId).then(chats => setLabChatHistory(chats));
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

  // Função para limpar session_id ao fazer logout
  const clearSessionId = (userId) => {
    const sessionKey = `user:${userId}:current_session`;
    sessionStorage.removeItem(sessionKey);
  };

  const handleInitializeChat = () => {
    if (!initialChatName.trim()) {
      toast.error('Por favor, insira um nome para o chat');
      return;
    }

    const chatName = initialChatName.trim();
    setLabSelectedConversation(chatName);
    setLabSelectedChatName(chatName);
    
    // Adicionar o primeiro chat ao histórico
    setLabChatHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        session_id: chatName,
        name: chatName,
        messages: [],
        createdAt: new Date().toISOString(),
      }
    ]);
    
    setInitialChatName('');
    setLabShowInitialChatModal(false);
    showSuccessToast(`Chat "${chatName}" inicializado com sucesso!`);
  };

  // [4] Atualize loadChatMessages para segmentar por chat
  const loadChatMessages = async (chatName, isSwitchingChat = false) => {
    try {
      console.log('Carregando mensagens do chat:', chatName, 'isSwitchingChat:', isSwitchingChat);
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
      console.log('Mensagens recebidas da API:', data);
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
      
      console.log('Atualizando mensagens do chat:', chatKey, 'Total de mensagens:', mergedMessages.length);
      
      // Sempre atualizar o estado das mensagens, não apenas quando trocando de chat
      setLabMessagesByChat(prev => {
        const newState = { ...prev };
        safeSet(newState, chatKey, mergedMessages);
        return newState;
      });
    } catch (error) {
      handleError(error, 'carregamento de mensagens do chat');
      if (isSwitchingChat) setLabMessages([]);
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

  const renderLaboratoryPanel = () => {
    // Sidebar de sessões do laboratório
    return (
      <div className="flex h-full bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden transition-all duration-500">
        {/* Sidebar de sessões */}
        <div className="w-52 !bg-gradient-to-b !from-white/60 !via-white/50 !to-white/40 dark:!from-neutral-800/60 dark:!via-neutral-800/50 dark:!to-neutral-800/40 !text-neutral-900 dark:!text-white !border-r-2 !border-gradient-to-b !from-amber-200/30 !to-amber-300/30 dark:!from-amber-700/30 dark:!to-amber-600/30 flex flex-col items-stretch p-5 min-h-full box-border gap-5 backdrop-blur-md shadow-inner">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ 
              scale: 1.02
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-600 hover:bg-amber-700 text-white border-0 rounded-xl py-3 px-4 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg mb-6"
            onClick={() => {
              setLabShowNewChatModal(true);
            }}
          >
            <FaPlus className="w-4 h-4" />
            <span>Novo Chat</span>
          </motion.button>
          <div className="flex-1 overflow-hidden">
            <div className="mb-4">
              <div className="flex items-center justify-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center space-x-2">
                  <FaHistory className="w-3 h-3" />
                  <span>Histórico </span>
                </h4>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-600 to-transparent"></div>
            </div>
            
            {labHistoryLoading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-amber-200 dark:border-amber-800 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 animate-pulse">Carregando seus chats...</p>
              </div>
            ) : labChatHistory.length === 0 ? (
              <div className="p-4">
                <EmptyState 
                  type="chats" 
                  action={() => setLabShowNewChatModal(true)} 
                />
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-amber-600 scrollbar-track-transparent scrollbar-thumb-rounded-full">
                {labChatHistory.map((session, idx) => (
                  <motion.div
                    key={session.session_id || session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={`relative cursor-pointer transition-all duration-300 rounded-xl group overflow-hidden ${
                      labSelectedConversation === (session.session_id || session.id) 
                        ? '!bg-gradient-to-r !from-amber-500 !via-amber-600 !to-amber-500 !text-white font-bold shadow-lg shadow-amber-500/30' 
                        : '!bg-gradient-to-r !from-white/60 !via-white/40 !to-white/60 dark:!from-neutral-700/60 dark:!via-neutral-700/40 dark:!to-neutral-700/60 !text-neutral-700 dark:!text-neutral-300 font-medium hover:!from-white/80 hover:!via-white/60 hover:!to-white/80 dark:hover:!from-neutral-600/80 dark:hover:!via-neutral-600/60 dark:hover:!to-neutral-600/80 hover:shadow-md'
                    }`}
                    onClick={() => {
                      const chatName = session.chat_name || session.name;
                      const sessionId = session.session_id || session.id;
                      
                      console.log('Clicou no chat:', chatName, 'Session ID:', sessionId);
                      
                      setLabSelectedConversation(sessionId);
                      setLabSelectedChatName(chatName);
                      
                      // Buscar mensagens do chat específico da API externa
                      loadChatMessages(chatName, true); // use sempre o nome do chat
                      
                      setLabInput('');
                      setLabSelectedFile(null);
                    }}
                    title={`${session.chat_name || session.session_id || session.name}${session.is_current_session ? ' (Sessão atual)' : ''}`}
                  >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    

                    
                    <div className="relative z-10 p-2 flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium truncate">
                              {session.chat_name || session.session_id || session.name}
                            </span>

                          </div>
                          

                        </div>
                      </div>
                      
                      {/* Botão de remover */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/30 border-0 text-red-400 hover:text-red-300 cursor-pointer text-sm p-2 rounded-lg flex items-center justify-center transition-all duration-200 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja remover o chat "${session.chat_name || session.session_id || session.name}"?`)) {
                            handleHideChat(session.session_id || session.id);
                          }
                        }}
                        title="Remover chat"
                      >
                        <FaTrash className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Chat principal do laboratório (igual IA, mas usando estados do laboratório) */}
        <div className="flex-1 min-w-0 !bg-white/30 dark:!bg-neutral-900/30 backdrop-blur-sm">
          <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] !bg-white/60 dark:!bg-neutral-800/60 p-6 pb-8 gap-6 md:p-4 md:pb-6 md:gap-4 md:h-[calc(100vh-3rem)] md:max-h-[calc(100vh-3rem)] sm:p-3 sm:pb-4 sm:gap-3 backdrop-blur-sm">
            <div className="flex flex-col xl:flex-row gap-4 mb-4">
              <div className="flex items-center justify-between gap-4 p-4 lg:p-6 !bg-white/40 dark:!bg-neutral-800/40 !border !border-neutral-200 dark:!border-neutral-700 rounded-xl !text-neutral-700 dark:!text-neutral-300 text-base shadow-sm backdrop-blur-sm md:p-3.5 md:text-sm md:flex-wrap md:gap-3 sm:p-3 sm:text-xs sm:gap-2 hover:!bg-white/60 dark:hover:!bg-neutral-800/60 transition-all duration-300 xl:flex-1">
                <div className="flex items-center gap-2">
                  <FaCog className="text-amber-500" />
                  <span>Setup atual: {labSelectedSetupState?.title || 'Não selecionado'}</span>
                </div>
                <button 
                  onClick={() => setLabShowSetupModal(true)}
                  className="!bg-amber-500 hover:!bg-amber-600 !text-white !border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium shadow-sm hover:shadow-md"
                >
                  Alterar Setup
                </button>
              </div>
              <div className="flex items-center gap-4 p-3 !bg-white/40 dark:!bg-neutral-800/40 rounded-xl !border !border-neutral-200 dark:!border-neutral-700 backdrop-blur-sm hover:!bg-white/60 dark:hover:!bg-neutral-800/60 transition-all duration-300 xl:min-w-fit">
                <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">Manter arquivo anexado após envio</span>
                <ToggleSwitchStyled
                  type="button"
                  data-active={labKeepFileAttached}
                  aria-pressed={labKeepFileAttached}
                  onClick={() => setLabKeepFileAttached(v => !v)}
                >
                  {labKeepFileAttached ? (
                    <SwitchLabel>ON</SwitchLabel>
                  ) : (
                    <SwitchLabelOff>OFF</SwitchLabelOff>
                  )}
                  <SwitchCircle data-active={labKeepFileAttached} />
                </ToggleSwitchStyled>
              </div>
              <div className="xl:min-w-fit">
                <FileUpload onFileUpload={handleLabFileUpload} file={labSelectedFile} />
              </div>
            </div>
            <div className="flex flex-col bg-white dark:bg-neutral-800 rounded-xl shadow-md h-full overflow-hidden border border-neutral-200 dark:border-neutral-700 backdrop-blur-sm mb-8 md:mb-6 sm:mb-4">
              <div className="flex flex-col h-full min-h-0 gap-0">
                <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-xl flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                  <h3 className="text-xl text-neutral-800 dark:text-neutral-200 font-semibold m-0 flex items-center gap-2 md:text-lg">Chat do Laboratório</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleLabClearChat}
                      className="bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 cursor-pointer transition-all duration-200 text-sm flex items-center gap-2 font-medium hover:shadow-md"
                    >
                      <FaTrash className="w-3 h-3" /> Limpar Chat
                    </button>
                  </div>
                </div>
                <div ref={chatScrollRef} className="chat-messages flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-0 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent">
                  {(safeGet(labMessagesByChat, getCurrentLabChatKey(), [])).map((message, index) => (
                    <div 
                      key={`${message.role}-${index}-${message.timestamp}`}
                      className={`flex flex-col w-full mb-4 group ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      } fade-in`}
                    >
                      <div className={`relative max-w-[80%] p-4 rounded-2xl shadow-md backdrop-blur-sm border transition-all duration-300 ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400/30 shadow-amber-500/20' 
                          : message.role === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                          : 'bg-white/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600'
                      } md:max-w-[90%] sm:max-w-[95%]`}>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </div>
                        <div className={`text-xs opacity-60 mt-2 ${
                          message.role === 'user' 
                            ? 'text-right text-white/80' 
                            : 'text-left text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {formatChatTime(message.timestamp)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleCopyMessage(message.content)}
                          title="Copiar mensagem"
                          className="bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 border-0 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-2 rounded-lg text-xs flex items-center gap-1 transition-all duration-200"
                        >
                          <FaCopy className="w-3 h-3" /> Copiar
                        </button>
                      </div>
                    </div>
                  ))}
                  {isLabTyping && (
                    <div className="flex flex-col w-full mb-4 items-start">
                      <div className="relative max-w-[80%] p-4 rounded-2xl shadow-md backdrop-blur-sm border bg-white/80 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-600 transition-all duration-300">
                        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          </div>
                          <span className="text-sm">IA está digitando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={labChatEndRef} />
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLabSendMessage();
                  }}
                  className="flex gap-4 p-6 bg-white dark:bg-neutral-800 rounded-b-xl shadow-md flex-shrink-0 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 backdrop-blur-sm md:gap-3 md:p-4 sm:gap-2 sm:p-3"
                >
                  <textarea
                    value={labInput}
                    onChange={(e) => setLabInput(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleLabSendMessage();
                      }
                    }}
                    className="flex-1 border border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-base resize-none min-h-12 max-h-32 leading-6 bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-inherit transition-all duration-200 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 focus:shadow-lg focus:shadow-amber-200/20 dark:focus:shadow-amber-800/20 focus:bg-white dark:focus:bg-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 md:p-3.5 md:text-sm md:min-h-12 sm:p-3 sm:text-sm sm:min-h-13"
                  />
                  <button 
                    type="submit" 
                    disabled={(!labInput.trim() && !labSelectedFile) || isLabTyping}
                    className="bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-lg p-4 cursor-pointer transition-all duration-200 flex items-center justify-center text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none md:p-3.5 md:min-w-12 md:min-h-12 md:text-sm sm:p-4 sm:min-w-13 sm:min-h-13 sm:text-sm"
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </div>
            {labShowSetupModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 m-0 flex items-center gap-2">
                      <FaCog className="text-amber-500" />
                      Selecione um Setup
                    </h2>
                    <button 
                      onClick={() => setLabShowSetupModal(false)}
                      className="text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer bg-transparent border-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {setups.map((setup, index) => (
                      <div
                        key={index}
                        onClick={() => handleLabSetupSelect(setup)}
                        className={`p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 hover:shadow-lg hover:-translate-y-1 ${
                          labSelectedSetupState?.title === setup.title
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                          {setup.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 leading-relaxed">
                          {setup.when_to_use}
                        </p>
                        <ul className="list-none p-0 m-0">
                          <li className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                            <FaCheck className="text-green-500 flex-shrink-0" />
                            {setup.prompt.split('.')[0]}
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-b-2xl">
                    <button 
                      onClick={() => setLabShowSetupModal(false)}
                      className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleLabSetupConfirm}
                      disabled={!labSelectedSetupState}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium shadow-sm hover:shadow-md"
                    >
                      Confirmar Setup
                    </button>
                  </div>
                </div>
              </div>
            )}
            {labShowNewChatModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 m-0 flex items-center gap-2">
                      <FaPlus className="text-amber-500" />
                      Nomear Novo Chat
                    </h2>
                    <button 
                      onClick={() => {
                        setLabShowNewChatModal(false);
                        setNewChatName('');
                      }}
                      className="text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer bg-transparent border-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <label className="block mb-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Nome do Chat:
                    </label>
                    <input
                      type="text"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="Digite o nome do chat..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 focus:border-amber-500 dark:focus:border-amber-400 transition-all duration-300 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewChat();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-b-2xl">
                    <button onClick={() => {
                      setLabShowNewChatModal(false);
                      setNewChatName('');
                    }}
                    className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleCreateNewChat}
                      disabled={!newChatName.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium shadow-sm hover:shadow-md"
                    >
                      Criar Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
            {labShowInitialChatModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden backdrop-blur-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 m-0 flex items-center gap-2">
                      <FaFlask className="text-amber-500" />
                      Bem-vindo ao Laboratório
                    </h2>
                    <button 
                      onClick={() => {
                        setLabShowInitialChatModal(false);
                        setInitialChatName('');
                      }}
                      className="text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer bg-transparent border-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="mb-6 text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
                      Para começar a usar o Laboratório, você precisa definir um nome para o seu primeiro chat.
                    </p>
                    <label className="block mb-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Nome do Chat:
                    </label>
                    <input
                      type="text"
                      value={initialChatName}
                      onChange={(e) => setInitialChatName(e.target.value)}
                      placeholder="Digite o nome do seu chat..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 focus:border-amber-500 dark:focus:border-amber-400 transition-all duration-300 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInitializeChat();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-b-2xl">
                    <button onClick={() => {
                      setLabShowInitialChatModal(false);
                      setInitialChatName('');
                    }}
                    className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleInitializeChat}
                      disabled={!initialChatName.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 disabled:cursor-not-allowed text-white border-0 rounded-lg px-6 py-3 text-base cursor-pointer transition-all duration-200 md:px-5 md:py-2.5 md:text-sm sm:px-4 sm:py-2 sm:text-xs font-medium shadow-sm hover:shadow-md"
                    >
                      Iniciar Chat
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
    <div className="flex h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 transition-all duration-500">
      <Sidebar 
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeItem={activeItem} 
        setActiveItem={setActiveItem} 
      />
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
        {activeItem === 'dashboard' && renderDashboard()}
        
        
        {activeItem === 'laboratory' && (
          <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative bg-white/40 dark:bg-neutral-800/40 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      Laboratório de IA
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Explore e experimente com nossa inteligência artificial jurídica
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium"
                  >
                    <FaRobot className="w-3 h-3" />
                    <span>IA Ativa</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.header>

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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex items-center justify-between"
                >
          <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      Segurança e Logs
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Monitoramento de acessos e atividades de autenticação
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Sistema Online</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      
    </div>
  );
};

export default Home; 