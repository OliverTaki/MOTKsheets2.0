import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'google_auth_token';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY)); // 初期値としてlocalStorageから読み込む
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState(null);
    const [tokenClient, setTokenClient] = useState(null);

    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

    useEffect(() => {
        const initializeGis = () => {
            try {
                if (!window.google || !window.google.accounts) {
                    throw new Error("Google Identity Services library not loaded.");
                }
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            const accessToken = tokenResponse.access_token;
                            setToken(accessToken);
                            localStorage.setItem(TOKEN_STORAGE_KEY, accessToken); // トークンをlocalStorageに保存
                            setError(null);
                            console.log("Token obtained successfully.");
                        } else {
                            console.error("Token response error", tokenResponse);
                            setError({ message: 'Failed to get access token from Google.' });
                        }
                    },
                    error_callback: (err) => {
                        console.error("GIS Error Callback:", err);
                        setError({ message: err.type || 'An unknown authentication error occurred.' });
                    }
                });
                setTokenClient(client);
                setIsInitialized(true);
                console.log("Google Identity Services client initialized.");
            } catch (e) {
                console.error("Error initializing GIS client:", e);
                setError(e);
                setIsInitialized(true);
            }
        };

        if (window.google && window.google.accounts) {
            initializeGis();
        } else {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (script) {
                script.addEventListener('load', initializeGis);
                return () => script.removeEventListener('load', initializeGis);
            } else {
                setError({ message: "GSI script tag not found." });
                setIsInitialized(true);
            }
        }
    }, [CLIENT_ID, SCOPES]);

    const signIn = useCallback(() => {
        if (tokenClient) {
            if (token) {
                // すでにトークンがある場合は、不要なポップアップを避ける
                tokenClient.requestAccessToken({ prompt: '' });
            } else {
                // トークンがない場合のみ同意画面を要求
                tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        } else {
            console.error("Token client is not initialized.");
            setError({ message: 'Authentication service is not ready. Please try again in a moment.' });
        }
    }, [tokenClient, token]);

    const signOut = useCallback(() => {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
            window.google.accounts.oauth2.revoke(storedToken, () => {
                setToken(null);
                localStorage.removeItem(TOKEN_STORAGE_KEY); // localStorageからトークンを削除
                console.log('Token revoked and user signed out.');
            });
        } else {
            setToken(null);
        }
    }, []);

    const value = { token, signIn, signOut, isInitialized, error };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
