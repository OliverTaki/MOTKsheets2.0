import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './AuthContext'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ReAuthDialog from './components/ReAuthDialog.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  {/* <React.StrictMode> */}
    {/* アプリケーション全体をBrowserRouterでラップします */}
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <App />
          <ReAuthDialog />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  {/* </React.StrictMode> */},
)
