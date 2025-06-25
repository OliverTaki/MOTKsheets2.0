import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

// Contextの作成
const AuthContext = createContext(null);

// Contextを簡単に利用するためのカスタムフック
export const useAuth = () => useContext(AuthContext);

const SESSION_KEY = 'motk-google-auth-token';

/**
 * アプリケーション全体に認証情報を提供するプロバイダー (バグ修正版)
 */
export function AuthProvider({ children }) {
  // ★★★★★ 認証状態をより明確に管理 (isLoadingを追加) ★★★★★
  const [auth, setAuth] = useState({
    token: null,
    isAuthenticated: false,
    isLoading: true, // 初回ロード時にセッションを確認するまでローディング状態
  });

  // ログアウト処理
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuth({ token: null, isAuthenticated: false, isLoading: false });
  }, []);
  
  // ログイン成功時の処理
  const handleLoginSuccess = useCallback((tokenResponse) => {
    const expires_at = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
    const tokenData = {
      access_token: tokenResponse.access_token,
      expires_at: expires_at,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(tokenData));
    setAuth({ token: tokenData, isAuthenticated: true, isLoading: false });
  }, []);

  // useGoogleLoginフックでログイン関数を生成
  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: (error) => console.error('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // 初回マウント時にセッションストレージからトークンを復元
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem(SESSION_KEY);
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        // トークンの有効期限をチェック
        if (tokenData.expires_at > Date.now()) {
          setAuth({ token: tokenData, isAuthenticated: true, isLoading: false });
        } else {
          logout(); // 期限切れの場合はログアウト
        }
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Could not parse stored token", error);
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, [logout]);
  
  const value = { auth, login, logout };

  // ★★★★★ 認証状態が確定するまで子コンポーネントを描画しない ★★★★★
  // これが編集機能が動かなかった根本原因の対策
  if (auth.isLoading) {
    return <div className="p-8 text-center text-gray-400">Authenticating...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
