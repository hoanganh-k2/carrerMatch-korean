import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Không tìm thấy phần tử root trong index.html');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
