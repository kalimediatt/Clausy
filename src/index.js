import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { createGlobalStyle } from 'styled-components';
import { SetupProvider } from './contexts/SetupContext';
import './index.css';
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

// Force light mode globally
try {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', 'light');
  }
} catch (_) {
  // ignore
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyle />
    <SetupProvider>
      <RouterProvider 
        router={router}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
          v7_normalizeFormMethod: true
        }}
      />
    </SetupProvider>
  </React.StrictMode>
); 