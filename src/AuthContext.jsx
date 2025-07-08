import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'google_auth_token';

export const AuthProvider = ({ children, refreshData }) => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';

    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGapiClientReady, setIsGapiClientReady] = useState(false);
    const [error, setError] = useState(null);
    const [tokenClient, setTokenClient] = useState(null);

    const handleTokenResponse = useCallback((tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
            const accessToken = tokenResponse.access_token;
            setToken(accessToken);
            localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
            if (window.gapi?.client) {
                window.gapi.client.setToken({ access_token: accessToken });
            }
            setError(null);
            console.log("Token obtained successfully.");
            if (refreshData) {
                refreshData();
            }
        } else {
            console.error("Token response error", tokenResponse);
            setError({ message: 'Failed to get access token from Google.' });
        }
    }, [refreshData]);

    useEffect(() => {
        let gisScriptLoaded = false;
        let gapiScriptLoaded = false;

        const checkAllLoaded = () => {
            if (gisScriptLoaded && gapiScriptLoaded) {
                try {
                    // Initialize GIS
                    if (!window.google?.accounts) {
                        throw new Error("Google Identity Services library not loaded.");
                    }
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: handleTokenResponse,
                        error_callback: (err) => {
                            console.error("GIS Error Callback:", err);
                            setError({ message: err.type || 'An unknown authentication error occurred.' });
                        }
                    });
                    setTokenClient(client);

                    // Initialize gapi client
                    window.gapi.load('client', () => {
                        window.gapi.client.init({
                            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://sheets.googleapis.com/$discovery/rest?version=v4'],
                        }).then(() => {
                            return Promise.all([
                                window.gapi.client.load('drive', 'v3'),
                                window.gapi.client.load('sheets', 'v4')
                            ]);
                        }).then(() => {
                            setIsGapiClientReady(true);
                            const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                            if (storedToken) {
                                window.gapi.client.setToken({ access_token: storedToken });
                            }
                            setIsInitialized(true); // Set true only when both are ready
                        }).catch((err) => {
                            console.error("Error initializing gapi client:", err);
                            setError(err);
                            setIsInitialized(true); // Set true on error to unblock
                        });
                    });
                } catch (e) {
                    console.error("Error during combined initialization:", e);
                    setError(e);
                    setIsInitialized(true); // Set true on error to unblock
                }
            }
        };

        // GIS script loading
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (gisScript) {
            gisScript.addEventListener('load', () => {
                gisScriptLoaded = true;
                checkAllLoaded();
            });
            // If already loaded (e.g., hot reload)
            if (window.google && window.google.accounts) {
                gisScriptLoaded = true;
            }
        } else {
            setError({ message: "Google Identity Services script tag not found. Please ensure it's included in index.html." });
            setIsInitialized(true);
            return;
        }

        // gapi script loading
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            gapiScriptLoaded = true;
            checkAllLoaded();
        };
        document.head.appendChild(gapiScript);

        // Cleanup
        return () => {
            gisScript.removeEventListener('load', checkAllLoaded);
            gapiScript.remove();
        };
    }, [CLIENT_ID, SCOPES, handleTokenResponse]);

    const signIn = useCallback(() => {
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.error("Token client is not initialized.");
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
    
    const value = { token, signIn, signOut, isInitialized, error, isGapiClientReady, refreshData };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
