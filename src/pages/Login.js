import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSun, FaMoon } from "react-icons/fa";
import { GoogleIcon, GitHubIcon } from "./icons";
import WhiteLogo from '../logos/white.png';
import BlackLogo from '../logos/black.png';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';


const LoginPremium = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 5 ? 2 : 1;
  const strengthColor = ["bg-red-400","bg-orange-400","bg-yellow-400","bg-green-400"][passwordStrength-1];
  const strengthLabel = ["Fraca", "Média", "Forte", "Muito Forte"][passwordStrength-1];

useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return; // Prevenir cliques duplos

    setLoading(true);
    setError('');
    setNewPassword('');

    try {
      // Usar a função de login do contexto, que é a fonte única da verdade
      const result = await login(email, password);

      if (result.success) {
        if (result.newPassword) {
          // Cenário de atualização de senha
          setNewPassword(result.newPassword);
          toast.success(result.message || 'Sua senha foi atualizada com sucesso!');
        } else {
          // Login bem-sucedido, AuthContext cuidará do estado
          // A navegação já é tratada pelo useEffect
          toast.success('Login realizado com sucesso!');
        }
      } else {
        // Exibir erro retornado pelo contexto
        setError(result.message || 'E-mail ou senha inválidos.');
        toast.error(result.message || 'E-mail ou senha inválidos.');
      }
      
    } catch (err) {
      // Erro inesperado na comunicação ou lógica
      const errorMessage = err.message || 'Ocorreu um erro inesperado. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
 };
  const sso = (provider) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Login com ${provider}`);
    }, 1000);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500
      bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      
      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-600 to-brown-500 text-white shadow-lg shadow-orange-500/25">
            
          <div className="flex justify-center mb-6">
            {/* Logo Light NAO ALTERAR*/}
            <img src={BlackLogo} alt="Logo Black" className="h-10 w-auto dark:hidden" />

            {/* Logo Dark NAO ALTERAR*/}
            <img src={WhiteLogo} alt="Logo White" className="h-10 w-auto hidden dark:block" />
          </div>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Clausy</p>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">IA Jurídico</h1>
          </div>
        </div>

        {/* Botão Dark Mode */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur hover:bg-white dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 transition-all duration-300"
            aria-label="Alternar tema"
          >
            <span className="relative w-4 h-4">
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaMoon className="w-4 h-4 text-yellow-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaSun className="w-4 h-4 text-orange-400" />
                </motion.div>
              )}
            </span>
            {theme === "dark" ? "Escuro" : "Claro"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 pb-16 pt-2 md:grid-cols-2">
        {/* Hero */}
        <section className="order-2 hidden md:order-1 md:block">
          <div className="mx-auto max-w-md">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Bem-vindo(a) à Clausy sua Central de IA Jurídica
            </h2>
            <p className="mb-6 text-neutral-600 dark:text-neutral-300">
              Identifica riscos e automatiza tarefas repetitivas, aumentando eficiência e agilidade nos processos.
            </p>
            <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
              <li>✓ Criptografia em trânsito e em repouso</li>
              <li>✓ Políticas de senha & 2FA (opcional)</li>
              <li>✓ Login social (Google, GitHub)</li>
            </ul>
          </div>
        </section>

        {/* Auth Card */}
        <section className="order-1 md:order-2">
          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white/60 backdrop-blur-lg p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60 transition-colors duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-4">Acessar conta</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Entre para continuar na plataforma
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-sm dark:bg-neutral-800">
              <button type="button" onClick={() => setTab("password")}
                className={`rounded-lg px-3 py-2 font-medium transition ${tab === "password" ? "bg-white shadow dark:bg-neutral-900 dark:text-white" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"}`}>
                Senha
              </button>
              <button type="button" onClick={() => setTab("magic")}
                className={`rounded-lg px-3 py-2 font-medium transition ${tab === "magic" ? "bg-white shadow dark:bg-neutral-900 dark:text-white" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"}`}>
                Quick Link
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${status.type === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300" : "border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-300"}`}>
                {status.message}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" required
                className="w-full rounded-xl border bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 dark:bg-neutral-950 dark:text-neutral-100 border-neutral-200 focus:border-indigo-500 focus:ring-indigo-200/60 dark:border-neutral-800"/>
            </div>

            {/* Password */}
            {tab === "password" && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Senha</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mín. 8 caracteres" required
                  className="w-full rounded-xl border bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 dark:bg-neutral-950 dark:text-neutral-100 border-neutral-200 focus:border-indigo-500 focus:ring-indigo-200/60 dark:border-neutral-800"/>
                
                {/* Força da senha - Comentado */}
                {/* 
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className={`h-2 rounded-full ${strengthColor}`} style={{width: `${(passwordStrength/4)*100}%`}}></div>
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{strengthLabel}</span>
                </div>
                */}
              </div>
            )}

            {/* Remember + Submit */}
            <div className="flex justify-between items-center mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-700"/>
                Lembrar-me
              </label>
            </div>

            <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-gradient-to-br from-accent2 to-accent2 px-4 py-2.5 text-white shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Processando..." : tab === "password" ? "Entrar" : "Enviar link"}
            </button>

            {/* Social login - Botões comentados */}
            {/* 
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-4 mb-2">ou continue com</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => sso("google")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:scale-105 transition-transform dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                <GoogleIcon /> Google
              </button>
              <button type="button" onClick={() => sso("github")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:scale-105 transition-transform dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                <GitHubIcon /> GitHub
              </button>
            </div>
            */}
          </motion.form>
        </section>
      </main>

    </div>
  );
};

export default LoginPremium;
