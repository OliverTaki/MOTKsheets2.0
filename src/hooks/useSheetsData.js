import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';

const useSheetsData = (spreadsheetId) => {
    const { token, isInitialized, clearToken } = useContext(AuthContext);
    const [sheets, setSheets] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSheetsData = useCallback(async (currentToken) => {
        if (!currentToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // APIリクエストのrangesパラメータの書式を修正
            const params = new URLSearchParams({
                valueRenderOption: 'FORMATTED_VALUE',
                dateTimeRenderOption: 'SERIAL_NUMBER',
            });
            params.append('ranges', 'Shots!A:AZ');
            params.append('ranges', 'FIELDS!A:F'); // options列まで取得
            
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
            
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });

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
            const { shotsWithIds } = missingIdHandler(parsedShots);

            setFields(parsedFields);
            setSheets(shotsWithIds);
            console.log('Successfully fetched and parsed data.');
        } catch (err) {
            console.error('Error during fetchSheetsData:', err);
            if (err.status === 401) {
                setError(new Error("Your session has expired. Please sign in again."));
                if (clearToken) {
                    clearToken();
                }
            } else {
                setError(err);
            }
        } finally {
            setLoading(false);
        }
    }, [spreadsheetId, clearToken]);

    useEffect(() => {
        if (!spreadsheetId) {
            setError(new Error("Configuration Error: VITE_SHEETS_ID is not set."));
            setLoading(false);
            return;
        }
        if (isInitialized && token) {
            fetchSheetsData(token);
        } else if (isInitialized) {
            setLoading(false);
        }
    }, [spreadsheetId, token, isInitialized, fetchSheetsData]);

    // データを再読み込みするための関数を返す
    return { sheets, fields, loading, error, refreshData: () => fetchSheetsData(token) };
};

export default useSheetsData;
