import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { logger } from './utils/logger';
import { initSentry, captureError } from './utils/sentry';
import './index.css';

initSentry();

const reportGlobalError = (kind: 'error' | 'unhandledrejection', payload: unknown) => {
  logger.error(`Global ${kind} captured`, { payload });
  
  if (payload instanceof Error || (payload && typeof payload === 'object' && 'error' in payload && payload.error instanceof Error)) {
    const error = payload instanceof Error ? payload : (payload as { error: Error }).error;
    captureError(error, { kind, timestamp: Date.now() });
  }
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
