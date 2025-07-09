import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

/* ──────────── 定数 ───────────────────────── */
export const AuthContext = createContext({});
export const PROMPT_REQUIRED = 'user_interaction_required';
export const POPUP_BLOCKED   = 'popup_blocked_by_browser';

const TOKEN_STORAGE_KEY = 'google_auth_token';
const SCOPES = 
  'https://www.googleapis.com/auth/spreadsheets ' +
  'https://www.googleapis.com/auth/drive.metadata.readonly';

/* ──────────── Provider ────────────────────── */
export const AuthProvider = ({ children, refreshData }) => {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* ---- state -------------------------------------------------- */
  const [token, setToken]           = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isInitialized, setInit]    = useState(false);
  const [needsReAuth, setReAuth]    = useState(false);
  const [error, setError]           = useState(null);
  const [gisReady, setGisReady]     = useState(false);

  /* ---- GIS スクリプトロード判定 ------------------------------ */
  useEffect(() => {
    if (window.google?.accounts?.oauth2) setGisReady(true);
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true);
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  /* ---- signIn 呼び出し口を ref で公開 ------------------------- */
  const signInRef = useRef(() => {});
  const signIn  = useCallback(() => signInRef.current(), []);
  const signOut = useCallback(() => {
    if (token) {
      window.google.accounts.oauth2.revoke(token, () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setInit(false);        // ★ ← 初期化を解除
        setReAuth(true);       // ★ ← ログインパネル再表示
      });
    }
  }, [token]);

  /* ---- GIS 初期化 -------------------------------------------- */
  useEffect(() => {
    /** step 1: スクリプトタグを確実に読み込む */
    let gsi  = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (gsi) {
      gsi       = document.createElement('script');
      gsi.src   = 'https://accounts.google.com/gsi/client';
      gsi.async = true;
      gsi.defer = true;
      document.head.appendChild(gsi);
    }

    /** step 2: GIS init → tokenClient を生成 */
    const init = () => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope    : SCOPES,
        callback : (resp) => {
          console.log('[Auth] token callback', resp);
          if (resp && resp.access_token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
            setToken(resp.access_token);
            setReAuth(false);
            if (refreshData) refreshData();
          } else {
            console.error('[Auth] token callback error', resp);
            setReAuth(true);
          }
          setInit(true);                       // ← 成功・失敗に関わらず初期化完了
        },
      });

      // signInRef は “関数” に戻す（既存 UI 互換）
      signInRef.current = () =>
        tokenClient.requestAccessToken({ prompt: 'consent' });

      /* Console から強制発火できるデバッグ用 */
      /* Console から強制発火できるデバッグ用 */
      window.__MOTK_DEBUG = {
        requestAccess: () => {
          console.log('[DEBUG] GIS pop-up forced');
          tokenClient.requestAccessToken({ prompt: 'consent' });
        },
      };
    };

    /** step 3: スクリプトロード済なら即 init */
    if (window.google?.accounts?.oauth2) init();
    else gsi.onload = init;
  }, [CLIENT_ID, refreshData]);

  /* ---- 起動時にローカル token があれば即セット -------------- */
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored && token) {
      console.log('[Auth] found stored token');
      setToken(stored);
      setInit(true);
    }
  }, [token]);

  /* ---- Context value ------------------------------------------ */
  const ctx = {
    token,
    signIn,
    signOut,
    isInitialized,
    needsReAuth,
    setNeedsReAuth: setReAuth,
    error,
  };

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
};