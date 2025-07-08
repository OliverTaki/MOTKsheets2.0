import React, { createContext, useState, useEffect, useCallback } from 'react';

import { toProjectName } from './utils/id';

export const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'google_auth_token';
const LAST_SHEET_ID_STORAGE_KEY = 'motk:lastSheetId';

export const AuthProvider = ({ children, sheets = [], fields = [], refreshData }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGapiClientReady, setIsGapiClientReady] = useState(false);
    const [error, setError] = useState(null);
    const [tokenClient, setTokenClient] = useState(null);
    const defaultSheet = localStorage.getItem(LAST_SHEET_ID_STORAGE_KEY) || import.meta.env.VITE_SHEETS_ID || null;
    const [sheetId, setSheetId] = useState(defaultSheet);
    const [displayName, setDisplayName] = useState(null);

    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.metadata.readonly';

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
                            localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
                            if (window.gapi && window.gapi.client) {
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
                    },
                    error_callback: (err) => {
                        console.error("GIS Error Callback:", err);
                        setError({ message: err.type || 'An unknown authentication error occurred.' });
                    }
                });
                setTokenClient(client);
                setIsInitialized(true);
                console.log("Google Identity Services client initialized. isInitialized:", true);
            } catch (e) {
                console.error("Error initializing GIS client:", e);
                setError(e);
                setIsInitialized(true);
            }
        };

        if (window.google && window.google.accounts) {
            initializeGis();
        } else {
            // Ensure the GIS script is loaded before initializing
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (script) {
                script.addEventListener('load', initializeGis);
                return () => script.removeEventListener('load', initializeGis);
            } else {
                console.error("GSI script tag not found in the document.");
                setError({ message: "Google Identity Services script tag not found. Please ensure it's included in index.html." });
                setIsInitialized(true);
            }
        }
    }, [CLIENT_ID, SCOPES, refreshData]);

    // Initialize gapi client
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client', () => {
                window.gapi.client.init({
                    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://sheets.googleapis.com/$discovery/rest?version=v4'],
                }).then(() => {
                    // Explicitly load Drive and Sheets APIs after gapi.client.init
                    return Promise.all([
                        window.gapi.client.load('drive', 'v3'),
                        window.gapi.client.load('sheets', 'v4')
                    ]);
                }).then(() => {
                    console.log("gapi client initialized and Drive/Sheets APIs loaded.");
                    setIsGapiClientReady(true);
                    // Set token if already available from localStorage
                    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                    if (storedToken) {
                        window.gapi.client.setToken({ access_token: storedToken });
                    }
                }).catch((err) => {
                    console.error("Error initializing gapi client:", err);
                    setError(err);
                });
            });
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script if component unmounts
            script.remove();
        };
    }, []);

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
                if (window.gapi && window.gapi.client) {
                    window.gapi.client.setToken('');
                }
                console.log('Token revoked and user signed out.');
            });
        } else {
            setToken(null);
        }
    }, []);

    const clearToken = useCallback(() => {
        setToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        console.log('Local token cleared.');
    }, []);

    useEffect(() => {
        if (sheetId && Array.isArray(sheets) && sheets.length > 0) {
            const currentSheet = sheets.find(sheet => sheet.id === sheetId);
            if (currentSheet) {
                setDisplayName(toProjectName(currentSheet));
            } else {
                setDisplayName(null);
            }
        } else {
            setDisplayName(null);
        }
    }, [sheetId, sheets]);

    const value = { token, signIn, signOut, isInitialized, error, clearToken, sheets, fields, refreshData, sheetId, setSheetId, isGapiClientReady, setIsGapiClientReady, displayName };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
