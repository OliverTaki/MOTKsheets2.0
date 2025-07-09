import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// ---------- Const -------------------------------------------------
export const AuthContext = createContext({});
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
    const gisScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (gisScript) {
      setError({
        message: 'Required Google API script tag not found in index.html.',
      });
      setIsInitialized(true);
      return;
    }

    const initialize = () => {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: 'redirect',
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
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
      // 自動再ログイン用
      if (token) {
        setNeedsReAuth(true);
      }
      setIsInitialized(true);
      // sign-in helperを expose
      signInRef.current = () =>
        codeClient.requestAccessToken({ prompt: 'consent' });
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