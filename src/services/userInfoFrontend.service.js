/**
 * Serviço frontend para buscar informações do usuário após login
 */

const API_BASE_URL = 'http://138.197.27.151:5000/api';

/**
 * Busca informações completas do usuário após login
 * @returns {Promise<object>} - Informações completas do usuário
 */
export const getUserCompleteInfo = async () => {
  try {
  
    
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${API_BASE_URL}/user-info/complete`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar informações do usuário');
    }
    
    const data = await response.json();
    
    
    
    return data.data;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar informações completas:', error);
    throw error;
  }
};

/**
 * Busca apenas informações básicas do usuário
 * @returns {Promise<object>} - Informações básicas do usuário
 */
export const getUserBasicInfo = async () => {
  try {
  
    
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${API_BASE_URL}/user-info/basic`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar informações básicas');
    }
    
    const data = await response.json();
    
    
    
    return data.data;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar informações básicas:', error);
    throw error;
  }
};

/**
 * Busca estatísticas do usuário
 * @returns {Promise<object>} - Estatísticas do usuário
 */
export const getUserStats = async () => {
  try {
  
    
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${API_BASE_URL}/user-info/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar estatísticas');
    }
    
    const data = await response.json();
    
    
    
    return data.data;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao buscar estatísticas:', error);
    throw error;
  }
};

/**
 * Atualiza o último login do usuário
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export const updateLastLogin = async () => {
  try {
  
    
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    
    const response = await fetch(`${API_BASE_URL}/user-info/update-last-login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar último login');
    }
    
    const data = await response.json();
    
    
    
    return data.success;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao atualizar último login:', error);
    throw error;
  }
};

/**
 * Função principal para carregar informações do usuário após login
 * @returns {Promise<object>} - Informações completas do usuário
 */
export const loadUserInfoAfterLogin = async () => {
  try {
  
    
    // Buscar informações completas
    const userInfo = await getUserCompleteInfo();
    
    // Salvar no localStorage para uso posterior
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    
    
    
    return userInfo;
    
  } catch (error) {
    console.error('❌ DEBUG: Erro ao carregar informações do usuário:', error);
    throw error;
  }
};

/**
 * Obtém informações do usuário do localStorage
 * @returns {object|null} - Informações do usuário ou null
 */
export const getUserInfoFromStorage = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('❌ DEBUG: Erro ao obter informações do localStorage:', error);
    return null;
  }
};

/**
 * Limpa informações do usuário do localStorage
 */
export const clearUserInfo = () => {
  try {
    localStorage.removeItem('user_info');
  
  } catch (error) {
    console.error('❌ DEBUG: Erro ao limpar informações do localStorage:', error);
  }
};
