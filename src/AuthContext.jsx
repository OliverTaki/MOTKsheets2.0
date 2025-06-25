import {
  createContext, useContext, useState, useEffect,
} from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const SS_KEY = 'gis-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);   // {access_token, expires_at}

  /* -------- 初回: sessionStorage から復元 -------- */
  useEffect(() => {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return;
    const t = JSON.parse(raw);
    if (t.expires_at > Date.now()) setToken(t);
  }, []);

  /* -------- ポップアップ Login -------- */
  const loginPopup = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    onSuccess: ({ access_token, expires_in }) => {
      const t = {
        access_token,
        expires_at: Date.now() + expires_in * 1000,
      };
      sessionStorage.setItem(SS_KEY, JSON.stringify(t));
      setToken(t);
    },
  });

  /* -------- Silent refresh (prompt:none) -------- */
  const silent = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    prompt: 'none',
    onSuccess: ({ access_token, expires_in }) => {
      const t = {
        access_token,
        expires_at: Date.now() + expires_in * 1000,
      };
      sessionStorage.setItem(SS_KEY, JSON.stringify(t));
      setToken(t);
    },
  });

  useEffect(() => {
    if (!token) return;
    const ms = token.expires_at - Date.now() - 5 * 60_000; // 5分前
    const id = setTimeout(() => silent(), Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [token, silent]);

  const logout = () => {
    sessionStorage.removeItem(SS_KEY);
    setToken(null);
  };

  return (
    <Ctx.Provider value={{ token, login: loginPopup, logout }}>
      {children}
    </Ctx.Provider>
  );
}
