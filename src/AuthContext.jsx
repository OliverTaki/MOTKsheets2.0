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

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/* ──────────── Provider ────────────────────── */
export const AuthProvider = ({ children, refreshData }) => {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* ---- state -------------------------------------------------- */
  const [token,   setToken]   = useState(() =>
    JSON.parse(localStorage.getItem('motk:token') || 'null')
  );
  const [expires, setExpires] = useState(() =>
    Number(localStorage.getItem('motk:tokenExp') || '0')
  );
  const [isInitialized, setInit]    = useState(false);
  const [needsReAuth, setReAuth]    = useState(false);
  const [error, setError]           = useState(null);
  const [gisReady, setGisReady]     = useState(false);

  /* ---- 永続化 ------------------------------------------------------- */
  useEffect(() => {
    if (token) {
      localStorage.setItem('motk:token',    JSON.stringify(token));
      localStorage.setItem('motk:tokenExp', expires.toString());
    }
  }, [token, expires]);

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
        localStorage.removeItem('motk:token');
        localStorage.removeItem('motk:tokenExp');
        setToken(null);
        setExpires(0);
        setReAuth(true);       // ★ ← ログインパネル再表示
      });
    }
  }, [token]);

  /* ---- GIS 初期化 -------------------------------------------- */
  useEffect(() => {
    /** step 1: スクリプトタグを確実に読み込む */
    let gsi = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!gsi) {
      gsi = document.createElement('script');
      gsi.src = 'https://accounts.google.com/gsi/client';
      gsi.async = true;
      gsi.defer = true;
      document.head.appendChild(gsi);
    }

    /** step 2: GIS init → tokenClient を生成 */
    const init = () => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope    : SCOPES,
        prompt: '',                         // silent refresh
        callback : (resp) => {
          setToken(resp.access_token);
          setExpires(Date.now() + resp.expires_in * 1000);
        },
      });

      // signInRef は “関数” に戻す（既存 UI 互換）
      signInRef.current = () => {
        try {
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
          console.error("Error requesting access token:", e);
          if (e.type === 'popup_blocked_by_browser') {
            setError(POPUP_BLOCKED);
            setReAuth(true);
          } else {
            setError(e.message || 'Authentication failed');
          }
        }
      };

      /* Console から強制発火できるデバッグ用 */
      window.__MOTK_DEBUG = {
        requestAccess: () => {
          console.log('[DEBUG] GIS pop-up forced');
          try {
            tokenClient.requestAccessToken({ prompt: 'consent' });
          } catch (e) {
            console.error("Error forcing access token request:", e);
            if (e.type === 'popup_blocked_by_browser') {
              setError(POPUP_BLOCKED);
              setReAuth(true);
            } else {
              setError(e.message || 'Authentication failed');
            }
          }
        },
      };
      setInit(true);                       // GIS ready
    };

    /** step 3: スクリプトロード済なら即 init */
    if (window.google?.accounts?.oauth2) init();
    else gsi.onload = init;
  }, [CLIENT_ID, refreshData]);

  // ---- 使い回すヘルパ ---------
  const ensureValidToken = useCallback(async (force = false) => {
    if (force && token && Date.now() < expires - 60_000) {
      return token;                     // 60 秒マージン
    }
    return new Promise((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        prompt: '',                         // silent refresh
        callback: (resp) => {
          if (resp.error) {
            console.error("Silent token refresh failed:", resp.error);
            if (resp.error === 'popup_blocked_by_browser') {
              setError(POPUP_BLOCKED);
              setReAuth(true);
            } else if (resp.error === 'user_interaction_required') {
              setError(PROMPT_REQUIRED);
              setReAuth(true);
            } else {
              setError(resp.error);
            }
            reject(new Error(resp.error));
          } else {
            setToken(resp.access_token);
            setExpires(Date.now() + resp.expires_in * 1000);
            resolve(resp.access_token);
          }
        },
      });
      try {
        tokenClient.requestAccessToken(); // silent => callback 上書き
      } catch (e) {
        console.error("Error during silent token request:", e);
        if (e.type === 'popup_blocked_by_browser') {
          setError(POPUP_BLOCKED);
          setReAuth(true);
        } else {
          setError(e.message || 'Authentication failed');
        }
        reject(e);
      }
    });
  }, [token, expires, CLIENT_ID, setReAuth]);

  /* ---- 起動時にローカル token があれば即セット -------------- */
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const payload = parseJwt(stored);
      if (payload && payload.exp * 1000 > Date.now()) {
        console.log('[Auth] found stored token');
        setToken(stored);
        setInit(true);
      } else {
        console.log('[Auth] token expired or invalid');
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setReAuth(true);
      }
    } else {
      // If no token, we're still "initialized" enough to show the login page.
      setInit(true);
    }
  }, []);

  /* ---- Context value ------------------------------------------ */
  const ctx = {
    token,
    signIn,
    signOut,
    isInitialized,
    needsReAuth,
    setNeedsReAuth: setReAuth,
    error,
    ensureValidToken,
  };

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
};