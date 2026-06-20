import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import { AuthProvider } from './context/auth-context.tsx';
import { SmoothScroll } from './components/motion/smooth-scroll.tsx';
import './globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Không tìm thấy phần tử root trong index.html');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <SmoothScroll>
            <App />
          </SmoothScroll>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>,
);
