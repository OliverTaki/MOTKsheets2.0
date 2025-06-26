// src/AuthContext.jsx  (token refresh enabled)

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

/**
 * AuthContext – Google OAuth + Sheets Token 自動更新
 * ----------------------------------------------------
 * - GIS tokenClient を保持し、401/invalid_token を検出したら再発行
 * - scope に drive.readonly 追加 (共有ドライブ対応)
 * - token は sessionStorage に保存
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');
const TOKEN_KEY = 'motk_access_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenClientRef = useRef(null);

  /* ------------------ GIS loader ------------------ */
  const loadGis = () =>
    new Promise((res, rej) => {
      if (window.google?.accounts?.oauth2) return res(window.google.accounts.oauth2);
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => res(window.google.accounts.oauth2);
      s.onerror = rej;
      document.head.appendChild(s);
    });

  /* ---------------- token refresh ---------------- */
  const refreshToken = useCallback(async () => {
    if (!tokenClientRef.current) return false;
    return new Promise((res) => {
      tokenClientRef.current.callback = (resp) => {
        if (resp.error || !resp.access_token) return res(false);
        sessionStorage.setItem(TOKEN_KEY, resp.access_token);
        setToken(resp.access_token);
        res(true);
      };
      tokenClientRef.current.requestAccessToken({ prompt: '' }); // silent
    });
  }, []);

  /* ------------------- signIn -------------------- */
  const signIn = useCallback(async () => {
    setLoading(true);
    const gis = await loadGis();

    tokenClientRef.current = gis.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) return setLoading(false);
        sessionStorage.setItem(TOKEN_KEY, resp.access_token);
        setToken(resp.access_token);
        setUser({ uid: 'google', displayName: 'Google User' });
        setLoading(false);
      },
    });

    tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
  }, []);

  /* ------------------- signOut ------------------- */
  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  /* ----------- init from sessionStorage ---------- */
  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      setUser({ uid: 'google', displayName: 'Google User' });
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const useRequireAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
};
