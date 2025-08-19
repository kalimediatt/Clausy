// Melhorias Essenciais para o Clausy
// Implementação rápida e segura

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// 1. VALIDAÇÕES E TRATAMENTO DE ERROS
export const validateMessage = (message) => {
  if (!message.trim()) {
    return { valid: false, error: 'Mensagem não pode estar vazia' };
  }
  
  if (message.length > 10000) {
    return { valid: false, error: 'Mensagem muito longa (máximo 10.000 caracteres)' };
  }
  
  return { valid: true };
};

export const handleError = (error, context) => {
  console.error(`Erro em ${context}:`, error);
  
  let userMessage = 'Ocorreu um erro inesperado';
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    userMessage = 'Erro de conexão. Verifique sua internet.';
  } else if (error.message.includes('timeout')) {
    userMessage = 'Tempo limite excedido. Tente novamente.';
  } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
    userMessage = 'Sessão expirada. Faça login novamente.';
  } else if (error.message.includes('403')) {
    userMessage = 'Acesso negado. Verifique suas permissões.';
  }
  
  toast.error(userMessage, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px'
    }
  });
};

// 2. TOAST NOTIFICATIONS MELHORADAS
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px'
    }
  });
};

export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px'
    }
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px'
    }
  });
};

// 3. DEBOUNCE PARA PERFORMANCE
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// 4. AUTO-SCROLL INTELIGENTE
export const useAutoScroll = (dependencies) => {
  const scrollRef = useRef(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      const element = scrollRef.current;
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
      
      if (isAtBottom) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, dependencies);
  
  return scrollRef;
};

// 5. ATALHOS DE TECLADO
export const useKeyboardShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Enter para enviar mensagem
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handlers.sendMessage?.();
      }
      
      // Ctrl+N para novo chat
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handlers.newChat?.();
      }
      
      // Ctrl+S para salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlers.save?.();
      }
      
      // Escape para fechar modais
      if (e.key === 'Escape') {
        handlers.escape?.();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handlers]);
};

// 6. COMPONENTES DE UI ESSENCIAIS
export const LoadingSpinner = ({ message = 'Carregando...' }) => (
  <div className="loading-container">
    <div className="spinner"></div>
    <span>{message}</span>
  </div>
);

export const EmptyState = ({ type, action }) => {
  const getEmptyState = () => {
    switch (type) {
      case 'chats':
        return {
          icon: '💬',
          title: 'Nenhum chat encontrado',
          description: 'Crie seu primeiro chat para começar',
          actionText: 'Criar Chat'
        };
      case 'messages':
        return {
          icon: '📝',
          title: 'Nenhuma mensagem',
          description: 'Envie sua primeira mensagem',
          actionText: 'Enviar Mensagem'
        };
      case 'files':
        return {
          icon: '📁',
          title: 'Nenhum arquivo',
          description: 'Faça upload de um arquivo para começar',
          actionText: 'Upload Arquivo'
        };
      default:
        return {
          icon: '📁',
          title: 'Nada encontrado',
          description: 'Tente criar algo novo',
          actionText: 'Criar'
        };
    }
  };
  
  const { icon, title, description, actionText } = getEmptyState();
  
  return (
    <div className="empty-state flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-white/60 to-neutral-50/60 dark:from-neutral-800/60 dark:to-neutral-900/60 backdrop-blur-sm rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg transition-all duration-500">
      <div className="empty-icon text-6xl mb-4 opacity-70">{icon}</div>
      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      {action && (
        <button 
          onClick={action} 
          className="empty-action bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 border-0"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// 7. HOOKS ÚTEIS
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao definir localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// 8. UTILITÁRIOS
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Agora';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h atrás`;
  } else if (diffInHours < 168) { // 7 dias
    return `${Math.floor(diffInHours / 24)}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 9. CSS NECESSÁRIO (adicionar ao seu CSS)
export const essentialStyles = `
.loading-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #64748b;
  justify-content: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.5;
}

.empty-action {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.empty-action:hover {
  background: #2563eb;
}

.message-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.message-status.sending {
  background: #fef3c7;
  color: #92400e;
}

.message-status.sent {
  background: #d1fae5;
  color: #065f46;
}

.message-status.error {
  background: #fee2e2;
  color: #991b1b;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin: 8px 0;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dot {
  width: 4px;
  height: 4px;
  background: #64748b;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
`; 