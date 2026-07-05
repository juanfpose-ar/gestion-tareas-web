import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '0.875rem' },
            success: { iconTheme: { primary: '#198754', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc3545', secondary: '#fff' } },
          }}
        />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
