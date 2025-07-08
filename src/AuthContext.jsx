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
        console.log('[Auth] mount -> Initializing Google APIs');
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');

        if (!gisScript || !gapiScript) {
            setError({ message: "Required Google API script tags not found in index.html." });
            setIsInitialized(true); // Set true even on error to unblock UI
            return;
        }

        let gapiLoaded = false;
        let gisLoaded = false;

        const initialize = () => {
            if (!gapiLoaded || !gisLoaded) return;
            console.log('[Auth] Both GAPI and GIS scripts loaded. Initializing clients...');

            try {
                // 1. Initialize GAPI client
                window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [
                        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                        'https://sheets.googleapis.com/$discovery/rest?version=v4'
                    ],
                }).then(() => {
                    console.log('[Auth] GAPI client initialized.');
                    // 2. Initialize GIS token client
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: handleTokenResponse,
                        error_callback: (err) => {
                            console.error('[Auth] GIS token client error:', err);
                            setError({ message: err.type || 'An unknown authentication error occurred.' });
                            setIsInitialized(true); // Set true even on error to unblock UI
                        }
                    });
                    tokenClientRef.current = client;
                    setIsGapiClientReady(true);
                    console.log('[Auth] GIS token client initialized.');

                    // 3. Set token if it exists
                    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                    if (storedToken) {
                        window.gapi.client.setToken({ access_token: storedToken });
                        console.log('[Auth] Stored token set to gapi client.');
                    }
                    setIsInitialized(true); // Set true on successful initialization
                }).catch((err) => {
                    console.error("Error initializing gapi client:", err);
                    setError(err);
                    setIsInitialized(true); // Set true even on error to unblock UI
                });
            } catch (e) {
                console.error("Error during API initialization:", e);
                setError(e);
                setIsInitialized(true); // Set true even on error to unblock UI
            }
        };

        // GAPI load handler
        const handleGapiLoad = () => {
            window.gapi.load('client', () => {
                gapiLoaded = true;
                console.log('[Auth] GAPI script loaded.');
                initialize();
            });
        };

        // GIS load handler
        const handleGisLoad = () => {
            gisLoaded = true;
            console.log('[Auth] GIS script loaded.');
            initialize();
        };

        // Attach listeners or run handlers if already loaded
        if (window.gapi && window.gapi.load) {
            handleGapiLoad();
        } else {
            gapiScript.onload = handleGapiLoad;
        }

        if (window.google && window.google.accounts) {
            handleGisLoad();
        } else {
            gisScript.onload = handleGisLoad;
        }

    }, [CLIENT_ID, API_KEY, SCOPES, handleTokenResponse]);

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