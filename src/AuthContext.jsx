import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// ---------- Const -------------------------------------------------
export const AuthContext = createContext({});

// useDriveSheets が参照するエラーコードを公開
export const PROMPT_REQUIRED = 'user_interaction_required';
export const POPUP_BLOCKED   = 'popup_blocked_by_browser';

const TOKEN_STORAGE_KEY = 'google_auth_token';
const SCOPES =  'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';

// ---------- Provider ----------------------------------------------
export const AuthProvider = ({ children, refreshData }) => {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // --- state ------------------------------------------------------
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsReAuth, setNeedsReAuth] = useState(false);
  const [error, setError] = useState(null);

  // --- GIS ready flag ---------------------------------------------
  const [isReady, setReady] = useState(false);
  useEffect(() => {
    if (window.google?.accounts?.oauth2) setReady(true);
    const id = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setReady(true);
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  // ---------- GIS init --------------------------------------------
  useEffect(() => {
    let gisScript = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]',
    );

    // なければ動的に注入
    if (gisScript) {
      gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      document.head.appendChild(gisScript);
    }

    const initialize = () => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp?.error) {
            setNeedsReAuth(true);
          } else if (resp?.access_token) {
            setToken(resp.access_token);
            localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token);
            setNeedsReAuth(false);
            if (refreshData) refreshData();
          }
        },
      });

      // sign-in helper を expose
      signInRef.current = () =>
        tokenClient.requestAccessToken({ prompt: 'consent' });

      // ─── デバッグ専用グローバル ─────────────────
      if (window.__MOTK_DEBUG) window.__MOTK_DEBUG = {};
      window.__MOTK_DEBUG.requestAccess = () => {
        console.log('[DEBUG] 手動で GIS ポップアップを開きます');
        tokenClient.requestAccessToken({ prompt: 'consent' });
      };
    };

    if (window.google && window.google.accounts) {
      initialize();
    } else {
      gisScript.onload = initialize;
    }
  }, [CLIENT_ID, refreshData, token]);

  // ---------- Helpers ---------------------------------------------
  const signInRef = useRef(() => {});
  const signIn = useCallback(() => signInRef.current(), []);

  const signOut = useCallback(() => {
    if (token) {
      window.google.accounts.oauth2.revoke(token, () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      });
    }
  }, [token]);

  // ---------- Context value ---------------------------------------
  const value = {
    token,
    signIn,
    signOut,
    isInitialized,
    needsReAuth,
    setNeedsReAuth,
    error,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};