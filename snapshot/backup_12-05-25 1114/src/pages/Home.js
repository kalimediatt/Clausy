import React, { useState } from 'react';
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

const Home = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    { id: 'profile', icon: <FaUser />, text: 'Perfil' },
    { id: 'settings', icon: <FaCog />, text: 'Configurações' },
    { id: 'reports', icon: <FaChartBar />, text: 'Relatórios' },
    { id: 'users', icon: <FaUsers />, text: 'Usuários' },
  ];

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
      </Content>
    </Container>
  );
};

export default Home; 