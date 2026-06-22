import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle and swallow benign WebSocket/HMR connection rejections in the sandboxed dev environment
if (typeof window !== 'undefined') {
  const isViteSocketError = (errAny: any) => {
    const message = errAny?.message || String(errAny || '');
    return (
      message.includes('WebSocket') ||
      message.includes('vite') ||
      message.includes('ws://') ||
      message.includes('wss://')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteSocketError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteSocketError(event.error || event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
