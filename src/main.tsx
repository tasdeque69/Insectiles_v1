import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { logger } from './utils/logger';
import './index.css';

const reportGlobalError = (kind: 'error' | 'unhandledrejection', payload: unknown) => {
  logger.error(`Global ${kind} captured`, { payload });
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportGlobalError('error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportGlobalError('unhandledrejection', {
      reason: event.reason,
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
