import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './AuthContext'
import { SheetsProvider } from './contexts/SheetsContext';
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ReAuthDialog from './components/ReAuthDialog.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <AuthProvider>
        <SheetsProvider>
          <App />
          <ReAuthDialog />
        </SheetsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>,
)
