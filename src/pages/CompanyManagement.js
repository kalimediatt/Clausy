import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import axios from 'axios';
import { motion } from 'framer-motion';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #2B2B2B;
  color: #DFDFDF;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #DFDFDF;
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ADADAD;
    color: #2B2B2B;
  }

  th {
    background: #2B2B2B;
    color: #DFDFDF;
  }

  tr:hover {
    background: rgba(140, 75, 53, 0.1);
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 24px;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 1rem;
  &:hover { background: #2563eb; }
`;

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // const { currentUser, api } = useAuth();
  // const [companies, setCompanies] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   const fetchCompanies = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
  //       const response = await axios.get('http://localhost:5000/api/companies', {
  //         headers: {
  //           'x-user-id': currentUser?.user_id
  //         }
  //       });
  //       if (response.data.success) {
  //         setCompanies(response.data.companies);
  //       } else {
  //         setError(response.data.message || 'Erro ao carregar empresas');
  //       }
  //     } catch (err) {
  //       console.error('Erro na requisição:', err);
  //       setError(err.message || 'Erro ao carregar empresas');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   if (currentUser && currentUser.role === 'superadmin') {
  //     fetchCompanies();
  //   }
  // }, [currentUser]);

  // if (!currentUser || currentUser.role !== 'superadmin') {
  //   return <Container><Title>Acesso restrito</Title><p>Esta página é exclusiva para superadmin.</p></Container>;
  // }

  return (
    <Container>
      <Title>Gestão de Empresas</Title>
      <p>Gestão de empresas em desenvolvimento.</p>
    </Container>
  );
};

export default CompanyManagement; 