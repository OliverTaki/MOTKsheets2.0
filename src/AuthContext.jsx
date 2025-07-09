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
    const [error, setError] = useState(null);
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
            setError(null);
            setNeedsReAuth(false); // Clear re-auth flag on successful token acquisition
            if (refreshData) refreshData();
        } else {
            setError({ message: 'Failed to get access token from Google.' });
        }
    }, [refreshData]);

    let refreshing = false;
    const waiters = [];
    const SILENT_TIMEOUT_MS = 1000;

    const ensureValidToken = useCallback(() => {
        if (!isReady) {
            setError({ message: 'Google Sign-in is not ready.' });
            console.log('ensureValidToken: Setting needsReAuth to true because GIS is not ready.');
            setNeedsReAuth(true);
            return null;
        }

        if (token && tokenInfo && tokenInfo.expires_at > Date.now()) {
            // Token is valid and not expired
            return token;
        } else {
            // Token is missing or expired
            console.log('ensureValidToken: Setting needsReAuth to true because token is missing or expired.');
            setNeedsReAuth(true);
            setError({ message: 'Authentication required. Please sign in again.' });
            return null;
        }
    }, [isReady, token, tokenInfo]);

    useEffect(() => {
        console.log('[Auth] mount -> Initializing Google APIs');
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

        if (!gisScript) {
            setError({ message: "Required Google API script tags not found in index.html." });
            setIsInitialized(true); // Set true even on error to unblock UI
            return;
        }

        let gisLoaded = false;

        const withTimeout = (p, ms, tag) =>
            Promise.race([
                p,
                new Promise((_, rej) =>
                    setTimeout(() => rej(new Error(tag + ' timeout')), ms)
                ),
            ]);

        const initialize = async () => {
            if (!gisLoaded) return;
            console.log('[Auth] GIS script loaded. Initializing clients...');

            try {
                console.log('[Auth] initClients start');

                // 3. Initialize GIS code client for interactive sign-in (redirect flow)
                const codeClient = window.google.accounts.oauth2.initCodeClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    ux_mode: 'redirect',
                    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
                });
                console.log('[Auth] GIS code client initialized.');

                // 3. Set token if it exists
                const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                if (storedToken) {
                    console.log('[Auth] Stored token set.');
                }
            } catch (e) {
                console.error('[Auth] initClients failed', e);
                setError(e); // Also set general error
                setIsInitialized(true); // エラーが出ても ready フラグは上げる
            } finally {
                setIsInitialized(true); // Always set true to unblock UI
            }
        };

        // GIS load handler
        const handleGisLoad = () => {
            gisLoaded = true;
            console.log('[Auth] GIS script loaded.');
            initialize();
        };

        // Attach listeners or run handlers if already loaded
        if (window.google && window.google.accounts) {
            handleGisLoad();
        } else {
            gisScript.onload = handleGisLoad;
        }