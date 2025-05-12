import React, { createContext, useContext, useState, useEffect } from 'react';

// Serviço para registrar logs de autenticação
const authLogger = {
  // Simula a obtenção do IP (em um ambiente real, isso viria do backend)
  getIP: async () => {
    try {
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      // Em um ambiente real, isso seria obtido do servidor
      return '192.168.15.' + Math.floor(Math.random() * 255);
    } catch (error) {
      console.error('Erro ao obter IP:', error);
      return 'unknown';
    }
  },

  // Registra tentativa de login
  logAuthAttempt: async (username, success) => {
    try {
      const ip = await authLogger.getIP();
      const timestamp = new Date().toISOString();
      const logEntry = {
        username,
        timestamp,
        ip,
        success,
        userAgent: navigator.userAgent
      };

      // Recuperar logs existentes ou iniciar um novo array
      const existingLogs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
      existingLogs.push(logEntry);
      
      // Limitar a 100 entradas para não sobrecarregar o localStorage
      if (existingLogs.length > 100) {
        existingLogs.shift(); // Remove o log mais antigo
      }

      // Salvar no localStorage (em um ambiente real, enviaríamos para um servidor)
      localStorage.setItem('auth_logs', JSON.stringify(existingLogs));
      
      console.log(`Log de autenticação: ${username} - ${success ? 'Sucesso' : 'Falha'} - IP: ${ip}`);
      return logEntry;
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  },

  // Obter todos os logs
  getLogs: () => {
    return JSON.parse(localStorage.getItem('auth_logs') || '[]');
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLogs, setAuthLogs] = useState([]);

  // Carregar logs ao iniciar
  useEffect(() => {
    setAuthLogs(authLogger.getLogs());
  }, []);

  const login = async (username, password) => {
    // Verifica credenciais específicas
    const isValid = username === 'teste@judai.com.br' && password === 'teste123';
    
    // Registrar a tentativa independente do resultado
    await authLogger.logAuthAttempt(username, isValid);
    
    // Atualizar os logs na interface
    setAuthLogs(authLogger.getLogs());
    
    if (isValid) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (isAuthenticated) {
      // Registrar o logout como uma ação bem-sucedida
      await authLogger.logAuthAttempt('logout', true);
      setAuthLogs(authLogger.getLogs());
    }
    setIsAuthenticated(false);
  };

  // Expor logs para componentes que precisem acessá-los
  const getAuthLogs = () => {
    return authLogs;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      authLogs,
      getAuthLogs 
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