import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import ShotDetailPage from './components/ShotDetailPage.jsx';
import { AuthProvider } from './AuthContext.jsx'; // AuthProviderをインポート
import './index.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      {/* ★★★★★ AuthProviderで全体をラップ ★★★★★ */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/page/:page_id" element={<App />} />
            <Route path="/shot/:id" element={<ShotDetailPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
