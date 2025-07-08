import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// --- local in-memory access-token cache --------------------------
const lastTokenRef      = { current: null };
const tokenIssuedAtRef  = { current: 0   };  // epoch (ms)
const TOKEN_LIFETIME_MS = 50 * 60 * 1000;    // 50分で強制更新;







































export const AuthContext = createContext({});
const TOKEN_STORAGE_KEY = 'google_auth_token';

export const PROMPT_REQUIRED = Symbol('PROMPT_REQUIRED');

export const AuthProvider = ({ children, refreshData }) => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';

    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
    const [tokenInfo, setTokenInfo] = useState(null); // { access_token, expires_at }
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGapiClientReady, setIsGapiClientReady] = useState(false);
    const [error, setError] = useState(null);
    const tokenClientRef = useRef(null);
    const [isReady, setReady] = useState(false); // GSI script load 判定
  const [needsReAuth, setNeedsReAuth] = useState(false);

  /** GSI スクリプトロード完了判定 */
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
    // 何度も silent を叩かないためのフラグ
    const attemptedSilent = useRef(false);
    const authError = useRef(null); // UI 用

    const handleTokenResponse = useCallback((tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
            const accessToken = tokenResponse.access_token;
            const expiresAt = Date.now() + tokenResponse.expires_in * 1000; // Calculate expiration time
            setToken(accessToken);
            setTokenInfo({ access_token: accessToken, expires_at: expiresAt }); // Set tokenInfo
            localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
            if (window.gapi?.client) {
                window.gapi.client.setToken({ access_token: accessToken });
            }
            setError(null);
            setNeedsReAuth(false); // Clear re-auth flag on successful token acquisition
            if (refreshData) refreshData();
        } else {
            setError({ message: 'Failed to get access token from Google.' });
        }
    }, [refreshData]);

    let refreshing = false;
    const waiters = [];
    const PROMPT_REQUIRED = Symbol('PROMPT_REQUIRED');
    const SILENT_TIMEOUT_MS = 1000;

    const ensureValidToken = useCallback(() => {
        if (!isReady) {
            setError({ message: 'Google Sign-in is not ready.' });
            setNeedsReAuth(true);
            throw new Error('GSI not ready');
        }

        if (token && tokenInfo && tokenInfo.expires_at > Date.now()) {
            // Token is valid and not expired
            return token;
        } else {
            // Token is missing or expired
            setNeedsReAuth(true);
            setError({ message: 'Authentication required. Please sign in again.' });
            throw new Error('PROMPT_REQUIRED');
        }
    }, [isReady, token, tokenInfo]);

    useEffect(() => {
        const interceptor = (response) => {
            if (response.status === 401) {
                setNeedsReAuth(true);
            }
            return response;
        };
        if (window.gapi && window.gapi.client) {
            window.gapi.client.interceptors = [interceptor];
        }
    }, []);

    

    const signIn = useCallback(() => {
        const tc = tokenClientRef.current;
        if (!tc) {
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
            return;
        }

        tc.callback = (resp) => {
            if (resp?.error) {
                console.error(resp);
                setNeedsReAuth(true);
                // Fallback to redirect if popup is blocked
                if (resp.type === 'popup_blocked' || resp.error === 'popup_closed_by_user') {
                    window.location.assign(tc.generateAuthUrl());
                }
            } else {
                lastTokenRef.current = resp.access_token;
                tokenIssuedAtRef.current = Date.now();
                setNeedsReAuth(false);
                handleTokenResponse(resp);
            }
        };

        try {
            tc.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
            console.error("Error requesting access token:", e);
            setNeedsReAuth(true);
        }
    }, [tokenClientRef, handleTokenResponse]);

    const signOut = useCallback(() => {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
            window.google.accounts.oauth2.revoke(storedToken, () => {
                setToken(null);
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                if (window.gapi?.client) {
                    window.gapi.client.setToken(null);
                }
            });
        } else {
            setToken(null);
        }
    }, []);

    const value = { token, signIn, signOut, isInitialized, error, isGapiClientReady, refreshData, ensureValidToken, needsReAuth, setNeedsReAuth };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};