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

// --- local in-memory access-token cache --------------------------
const lastTokenRef      = { current: null };
const tokenIssuedAtRef  = { current: 0   };  // epoch (ms)
const TOKEN_LIFETIME_MS = 50 * 60 * 1000;    // 50分で強制更新;







































export const AuthContext = createContext({});
const TOKEN_STORAGE_KEY = 'google_auth_token';

export const PROMPT_REQUIRED = Symbol('PROMPT_REQUIRED');

export const AuthProvider = ({ children, refreshData }) => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
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

    const ensureValidToken = useCallback(async () => {
        if (!isReady) throw new Error('GSI not ready');

        // ポップアップはユーザ操作トリガ必須
        return new Promise((resolve, reject) => {
            const tc = tokenClientRef.current;
            if (!tc) {
                setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
                return reject(new Error('PROMPT_REQUIRED'));
            }

            tc.callback = (resp) => {
                if (resp?.error) {
                    console.error(resp);
                    setNeedsReAuth(true);
                    reject(resp);
                } else {
                    lastTokenRef.current = resp.access_token;
                    tokenIssuedAtRef.current = Date.now();
                    setNeedsReAuth(false);
                    resolve(resp.access_token);
                }
            };

            // ★ ここではまだ popup を開かず、戻り値としてトリガ関数を返す
            tc.requestAccessToken();
        });
    }, [isReady]);

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

    

    /**
     * ── ユーザ操作で呼ぶ再ログイン用
     *    （prompt:'consent' で確実にポップアップ許可を得る）
     */
    const interactiveLogin = useCallback(() => {
        const tc = tokenClientRef.current;
        if (!tc) {
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
            return;
        }
        tc.callback = (resp) =>
            resp && resp.access_token
                ? (() => {
                    lastTokenRef.current     = resp.access_token;
                    tokenIssuedAtRef.current = Date.now();
                    setNeedsReAuth(false);
                })()
                : setNeedsReAuth(true);
        try {
            tc.requestAccessToken({ prompt: 'consent' });
        } catch {
            setNeedsReAuth(true);
        }
    }, [tokenClientRef]);

    useEffect(() => {
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');

        if (!gisScript || !gapiScript) {
            setError({ message: "Required Google API script tags not found in index.html." });
            setIsInitialized(true);
            return;
        }

        let gapiLoaded = false;
        let gisLoaded = false;

        const initialize = () => {
            if (!gapiLoaded || !gisLoaded) return;

            try {
                // 1. Initialize GAPI client
                window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [
                        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                        'https://sheets.googleapis.com/$discovery/rest?version=v4'
                    ],
                }).then(() => {
                    // 2. Initialize GIS token client
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: handleTokenResponse,
                        error_callback: (err) => {
                            setError({ message: err.type || 'An unknown authentication error occurred.' });
                        }
                    });
                    tokenClientRef.current = client;
                    setIsGapiClientReady(true);

                    // 3. Set token if it exists
                    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                    if (storedToken) {
                        window.gapi.client.setToken({ access_token: storedToken });
                    }
                }).catch((err) => {
                    console.error("Error initializing gapi client:", err);
                    setError(err);
                }).finally(() => {
                    setIsInitialized(true);
                });
            } catch (e) {
                console.error("Error during API initialization:", e);
                setError(e);
                setIsInitialized(true);
            }
        };

        // GAPI load handler
        const handleGapiLoad = () => {
            window.gapi.load('client', () => {
                gapiLoaded = true;
                initialize();
            });
        };

        // GIS load handler
        const handleGisLoad = () => {
            gisLoaded = true;
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


    const signIn = useCallback(() => {
        if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
        } else {
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
        }
    }, [tokenClientRef]);

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

    const value = { token, signIn, signOut, isInitialized, error, isGapiClientReady, refreshData, ensureValidToken, needsReAuth, setNeedsReAuth, interactiveLogin, authError };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};