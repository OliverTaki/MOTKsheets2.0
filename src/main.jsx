import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import ShotDetailPage from './components/ShotDetailPage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shot/:id" element={<ShotDetailPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
