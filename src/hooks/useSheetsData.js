import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';
import mockShots from '../mock/shots.json';
import mockFields from '../mock/fields.json';

const useSheetsData = (spreadsheetId, useMock = false) => {
    const { token, isInitialized } = useContext(AuthContext);
    const [sheets, setSheets] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [missingIds, setMissingIds] = useState([]);

    const fetchSheetsData = useCallback(async (currentToken) => {
        console.log(`fetchSheetsData called. Token available: ${!!currentToken}`);
        
        if (!currentToken) {
            console.log("No token provided to fetchSheetsData, aborting.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const rangeShots = 'Shots!A:AZ';
        const rangeFields = 'FIELDS!A:C';

        try {
            // Google Sheets APIの仕様に合わせて、rangesパラメータを個別に設定します
            const params = new URLSearchParams({
                valueRenderOption: 'FORMATTED_VALUE',
                dateTimeRenderOption: 'SERIAL_NUMBER',
            });
            params.append('ranges', rangeShots);
            params.append('ranges', rangeFields);

            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
            
            console.log("Fetching URL:", url);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                const err = new Error(errorData.error.message || 'Failed to fetch data');
                err.status = response.status;
                throw err;
            }
            
            const data = await response.json();
            const shotsData = data.valueRanges?.[0]?.values;
            const fieldsData = data.valueRanges?.[1]?.values;

            if (!shotsData || !fieldsData) {
              throw new Error("Data not found in spreadsheet. Check sheet names ('Shots', 'FIELDS') and ranges.");
            }

            const parsedFields = parseFields(fieldsData);
            const parsedShots = parseShots(shotsData, parsedFields);
            const { shotsWithIds, missingIdsFound } = missingIdHandler(parsedShots);

            setFields(parsedFields);
            setSheets(shotsWithIds);
            if (missingIdsFound.length > 0) setMissingIds(missingIdsFound);
            console.log('Successfully fetched and parsed data.');
        } catch (err) {
            console.error('Error during fetchSheetsData:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [spreadsheetId]);

    useEffect(() => {
        if (!spreadsheetId) {
            setError(new Error("Configuration Error: VITE_SHEETS_ID is not set in your .env file. Please ensure the file exists and you have restarted the development server."));
            setLoading(false);
            return; 
        }

        if (useMock) {
            return;
        }
        
        if (isInitialized) {
            if (token) {
                setError(null); 
                fetchSheetsData(token);
            } else {
                console.log("Auth is initialized, but user is not signed in. Waiting for login.");
                setSheets([]);
                setFields([]);
                setLoading(false);
            }
        } else {
             console.log(`Waiting for auth initialization...`);
        }
    }, [spreadsheetId, token, useMock, isInitialized, fetchSheetsData]);

    return { sheets, fields, loading, error, missingIds, setSheets, setMissingIds };
};

export default useSheetsData;
