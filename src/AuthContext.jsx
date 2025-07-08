import React, { createContext, useState, useEffect, useCallback } from 'react';

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
    const [tokenClient, setTokenClient] = useState(null);
    const [needsReAuth, setNeedsReAuth] = useState(false);

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

    const ensureValidToken = useCallback(async () => {
        if (needsReAuth) return Promise.reject(PROMPT_REQUIRED);
        const now = Date.now();
        if (tokenInfo && now < tokenInfo.expires_at - 60_000) {
            return tokenInfo.access_token; // Return current token if still valid for at least 1 minute
        }

        if (refreshing) {
            return new Promise(resolve => waiters.push(resolve));
        }

        refreshing = true;

        return new Promise((resolve, reject) => {
            const saveAndResolve = (resp) => {
                const exp = Date.now() + resp.expires_in * 1000;
                setTokenInfo({ access_token: resp.access_token, expires_at: exp });
                window.gapi.client.setToken({ access_token: resp.access_token });
                refreshing = false;
                flushingWaiters(resp.access_token);
                resolve(resp.access_token);
            };

            const flushingWaiters = (val) => {
                waiters.forEach(w => w(val));
                waiters.length = 0;
            };

            const fail = (err) => {
                console.warn('Silent token refresh failed', err);
                refreshing = false;
                setNeedsReAuth(true);
                flushingWaiters(PROMPT_REQUIRED);
                reject(PROMPT_REQUIRED);
            };

            try {
                tokenClient.requestAccessToken({
                    prompt: '', // silent
                    callback: (resp) => {
                        refreshing = false;
                        if (resp.error) return fail(resp.error);
                        saveAndResolve(resp);
                    },
                    error_callback: fail,
                });
            } catch (syncErr) {
                fail(syncErr); // unify path
            }
        });
    }, [tokenInfo, tokenClient, needsReAuth]);

    const interactiveSignIn = useCallback(() => {
        if (!tokenClient) {
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
            return;
        }
        tokenClient.requestAccessToken({
            prompt: 'consent',
            callback: (resp) => {
                if (resp.error) {
                    console.error(resp);
                    setError({ message: resp.error.message || 'An unknown authentication error occurred during interactive sign-in.' });
                } else {
                    const exp = Date.now() + resp.expires_in * 1000;
                    setTokenInfo({ access_token: resp.access_token, expires_at: exp });
                    window.gapi.client.setToken({ access_token: resp.access_token });
                    setNeedsReAuth(false);
                    setError(null);
                    if (refreshData) refreshData();
                }
            },
        });
    }, [tokenClient, refreshData]);

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
                    setTokenClient(client);
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
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
        }
    }, [tokenClient]);

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

    const value = { token, signIn, signOut, isInitialized, error, isGapiClientReady, refreshData, ensureValidToken, needsReAuth, setNeedsReAuth, interactiveSignIn };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};