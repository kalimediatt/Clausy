import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaRobot, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #2B2B2B;
  position: relative;
  overflow: hidden;
`;

const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const LoginForm = styled(motion.form)`
  background: #DFDFDF;
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  z-index: 2;
  border: 1px solid #ADADAD;
`;

const Title = styled(motion.h1)`
  text-align: center;
  color: #2B2B2B;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  background: linear-gradient(45deg, #8C4B35, #2B2B2B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const InputContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: #DFDFDF;
  border: 1px solid #ADADAD;
  border-radius: 10px;
  color: #2B2B2B;
  font-size: 1rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: #ADADAD;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(140, 75, 53, 0.3);
    background: #DFDFDF;
  }
`;

const Icon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #8C4B35;
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: #8C4B35;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #2B2B2B;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const InfoText = styled.div`
  margin-top: 2rem;
  color: #ADADAD;
  font-size: 0.875rem;
  text-align: center;
  
  p {
    margin-bottom: 0.5rem;
  }
  
  strong {
    color: #8C4B35;
  }
`;

const RobotIcon = styled(motion.div)`
  font-size: 3rem;
  color: #8C4B35;
  text-align: center;
  margin-bottom: 1rem;
`;

const NewPasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const NewPasswordTitle = styled.h2`
  color: #8C4B35;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const NewPasswordText = styled.p`
  color: #2B2B2B;
  text-align: center;
  margin-bottom: 1rem;
`;

const NewPasswordValue = styled.div`
  background: #2B2B2B;
  color: #DFDFDF;
  padding: 1rem;
  border-radius: 10px;
  font-family: monospace;
  font-size: 1.2rem;
  margin: 1rem 0;
  width: 100%;
  text-align: center;
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNewPassword('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.newPassword) {
          // Se houver uma nova senha, exibir ela
          setNewPassword(data.newPassword);
          toast.success(data.message);
        } else {
          // Login normal
      const success = await login(email, password);
      if (success) {
        const redirectUrl = location.state?.from?.pathname || '/';
        navigate(redirectUrl);
          }
        }
      } else {
        setError(data.message || 'Erro ao fazer login');
        toast.error(data.message || 'Erro ao fazer login');
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  return (
    <LoginContainer>
      <ParticlesContainer>
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: {
              color: {
                value: "#2B2B2B",
              },
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push",
                },
                onHover: {
                  enable: true,
                  mode: "repulse",
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 200,
                  duration: 0.4,
                },
                },
              },
            particles: {
              color: {
                value: "#8C4B35",
              },
              links: {
                color: "#8C4B35",
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 2,
                straight: false,
            },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
                },
              opacity: {
                value: 0.5,
              },
              shape: {
                type: "circle",
                },
              size: {
                value: { min: 1, max: 5 },
              },
            },
            detectRetina: true,
          }}
        />
      </ParticlesContainer>
      <LoginForm
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <RobotIcon
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <FaRobot />
        </RobotIcon>
        <Title
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Clausy
        </Title>
        {newPassword ? (
          <NewPasswordContainer>
            <NewPasswordTitle>Sua senha foi atualizada</NewPasswordTitle>
            <NewPasswordText>
              Por questões de segurança, sua senha foi atualizada. Use a nova senha para fazer login:
            </NewPasswordText>
            <NewPasswordValue>{newPassword}</NewPasswordValue>
            <Button
              onClick={() => {
                setNewPassword('');
                setPassword('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Fazer Login com Nova Senha
            </Button>
          </NewPasswordContainer>
        ) : (
          <>
        <InputContainer>
          <Icon>
            <FaEnvelope />
          </Icon>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputContainer>
        <InputContainer>
          <Icon>
            <FaLock />
          </Icon>
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </InputContainer>
        <Button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        
        <InfoText>
          <p>Use suas credenciais para acessar o sistema</p>
        </InfoText>
          </>
        )}
      </LoginForm>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </LoginContainer>
  );
};

export default Login; 