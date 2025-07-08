import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';

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
    const [needsReAuth, setNeedsReAuth] = useState(false);
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
        if (needsReAuth) return Promise.reject(PROMPT_REQUIRED);
        if (tokenInfo && Date.now() < tokenInfo.expires_at - 60_000) {
            return tokenInfo.access_token;
        }
        if (refreshing) return new Promise(r => waiters.push(r));
        refreshing = true;
        return new Promise((resolve, reject) => {
            const flush = (val) => { waiters.forEach(w => w(val)); waiters.length = 0; };
            const fail = (reason) => {
                console.warn('Silent token refresh failed:', reason);
                refreshing = false;
                authError.current = reason ?? 'TIMEOUT';
                setNeedsReAuth(true);
                flush(PROMPT_REQUIRED);
                reject(PROMPT_REQUIRED);
            };
            const timer = setTimeout(() => fail('timeout'), SILENT_TIMEOUT_MS);
            try {
                tokenClientRef.current.requestAccessToken({
                    prompt: '',
                    callback: (resp) => {
                        clearTimeout(timer);
                        refreshing = false;
                        if (resp.error) {
                            console.warn('silent refresh failed', resp);
                            authError.current = resp.error ?? 'TIMEOUT';
                            setNeedsReAuth(true);
                            return;
                        }
                        const exp = Date.now() + resp.expires_in * 1000;
                        setTokenInfo({ access_token: resp.access_token, expires_at: exp });
                        window.gapi.client.setToken({ access_token: resp.access_token });
                        flush(resp.access_token);
                        resolve(resp.access_token);
                    },
                    error_callback: (err) => {
                        clearTimeout(timer);
                        console.warn('silent error', err);
                        authError.current = err.error ?? 'ERROR';
                        setNeedsReAuth(true);
                    },
                });
            } catch (syncErr) {
                clearTimeout(timer);
                fail(syncErr);
            }
        });
    }, [tokenInfo, tokenClientRef, needsReAuth]);

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

    // ↓1 回だけ silent 取得を試みる
    useEffect(() => {
        if (!tokenClientRef.current || attemptedSilent.current) return;
        attemptedSilent.current = true;
        const tc = tokenClientRef.current;
        tc.callback = (resp) =>
            resp && resp.access_token ? setNeedsReAuth(false) : setNeedsReAuth(true);
        try {
            tc.requestAccessToken({ prompt: '' }); // silent
        } catch {
            setNeedsReAuth(true);
        }
    }, [tokenClientRef.current]);

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
            resp && resp.access_token ? setNeedsReAuth(false) : setNeedsReAuth(true);
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