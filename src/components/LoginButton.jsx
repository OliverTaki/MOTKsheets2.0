import React from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function LoginButton() {
  const { auth, login, logout } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {auth.isAuthenticated ? (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Signed In
        </div>
      ) : (
        <div className="text-sm text-gemini-text-secondary">Signed Out</div>
      )}
      {/* ★★★★★ UI修正：ボタンの色を他のボタンと統一 ★★★★★ */}
      <button
        className="px-3 py-1 text-sm bg-gemini-header border border-gemini-border rounded-md shadow-sm hover:bg-gray-600 transition-colors text-gemini-text"
        onClick={auth.isAuthenticated ? logout : login}
      >
        {auth.isAuthenticated ? 'Sign out' : 'Sign in'}
      </button>
    </div>
  );
}
