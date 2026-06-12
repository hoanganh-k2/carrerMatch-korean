import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/auth-context.tsx';
import './globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Không tìm thấy phần tử root trong index.html');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
