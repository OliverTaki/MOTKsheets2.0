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
    // missingIdsのstateを削除

    const fetchSheetsData = useCallback(async (currentToken) => {
        console.log(`fetchSheetsData called. Token available: ${!!currentToken}`);
        
        if (!currentToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const rangeShots = 'Shots!A:AZ';
        const rangeFields = 'FIELDS!A:C';

        try {
            const params = new URLSearchParams({
                valueRenderOption: 'FORMATTED_VALUE',
                dateTimeRenderOption: 'SERIAL_NUMBER',
            });
            params.append('ranges', rangeShots);
            params.append('ranges', rangeFields);

            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to fetch data');
            }
            
            const data = await response.json();
            const shotsData = data.valueRanges?.[0]?.values;
            const fieldsData = data.valueRanges?.[1]?.values;

            if (!shotsData || !fieldsData) {
              throw new Error("Data not found in spreadsheet. Check sheet names ('Shots', 'FIELDS') and ranges.");
            }

            const parsedFields = parseFields(fieldsData);
            // この行が欠落していました
            const parsedShots = parseShots(shotsData, parsedFields);
            const { shotsWithIds } = missingIdHandler(parsedShots);

            setFields(parsedFields);
            setSheets(shotsWithIds);
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
            setError(new Error("Configuration Error: VITE_SHEETS_ID is not set in your .env file..."));
            setLoading(false);
            return; 
        }
        
        if (isInitialized) {
            if (token) {
                setError(null); 
                fetchSheetsData(token);
            } else {
                setSheets([]);
                setFields([]);
                setLoading(false);
            }
        }
    }, [spreadsheetId, token, isInitialized, fetchSheetsData]);

    // 返り値からmissingIdsとsetMissingIdsを削除
    return { sheets, fields, loading, error };
};

export default useSheetsData;
