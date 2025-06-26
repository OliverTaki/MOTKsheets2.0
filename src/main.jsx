// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// ✅ 別名 alias を使わず相対パスで参照
import { AuthProvider } from './AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
