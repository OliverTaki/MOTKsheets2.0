import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';
import { updateCell } from '../api/updateCell';

const useSheetsData = () => {
    const { token, isInitialized, clearToken, sheetId: ctxSheetId } = useContext(AuthContext);
    const SHEET_ID = ctxSheetId || import.meta.env.VITE_SHEETS_ID;
    const [sheets, setSheets] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [idToColIndex, setIdToColIndex] = useState({});

    const fetchSheetsData = useCallback(async (currentToken) => {
        if (!currentToken || !SHEET_ID) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                valueRenderOption: 'FORMATTED_VALUE',
                dateTimeRenderOption: 'SERIAL_NUMBER',
            });
            params.append('ranges', 'Shots!A:AZ');
            params.append('ranges', 'FIELDS!A:F');
            
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?${params.toString()}`;
            
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
            console.log("useSheetsData: parsedFields (from parseFields):", parsedFields);
            const shotsDataValues = data.valueRanges?.[0]?.values;
            const shotsHeader = shotsDataValues?.[0] || [];
            console.log("useSheetsData: shotsHeader (UUID row):", shotsHeader);
            const shotIdUuid = shotsHeader?.[0];
            const shotCodeUuid = shotsHeader?.[1];
            console.log("useSheetsData: shotIdUuid:", shotIdUuid, "shotCodeUuid:", shotCodeUuid);

            const finalFields = [
                { id: shotIdUuid, label: 'Shot ID', type: 'text', editable: false },
                { id: shotCodeUuid, label: 'Shot Code', type: 'text', editable: false },
                ...parsedFields.filter(f => f.id !== shotIdUuid && f.id !== shotCodeUuid)
            ];

            const parsedShots = parseShots(shotsDataValues, finalFields, shotIdUuid);
            const { shotsWithIds } = missingIdHandler(parsedShots);

            const newIdToColIndex = shotsHeader.reduce((acc, id, index) => {
                if (id) {
                    acc[id.trim()] = index;
                }
                return acc;
            }, {});
            setIdToColIndex(newIdToColIndex);
            console.log("useSheetsData: idToColIndex:", newIdToColIndex);

            setFields(finalFields);
            console.log("useSheetsData: finalFields (set to state):", finalFields);
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
    }, [SHEET_ID, clearToken]);

    const updateFieldOptions = useCallback(async (fieldId, newOption) => {
        if (!token) {
            alert("Authentication required to update field options.");
            return;
        }
        try {
            const fieldToUpdate = fields.find(f => f.id === fieldId);
            if (!fieldToUpdate) {
                throw new Error(`Field with ID ${fieldId} not found.`);
            }

            const currentOptions = fieldToUpdate.options ? fieldToUpdate.options.split(',') : [];
            if (!currentOptions.includes(newOption)) {
                currentOptions.push(newOption);
            }
            const updatedOptionsString = currentOptions.join(',');

            const fieldRowIndex = fields.findIndex(f => f.id === fieldId) + 2;

            const optionsColumnLetter = 'F';

            const range = `FIELDS!${optionsColumnLetter}${fieldRowIndex}`;

            await updateCell(SHEET_ID, token, range, updatedOptionsString);

            setFields(prevFields => prevFields.map(f =>
                f.id === fieldId ? { ...f, options: updatedOptionsString } : f
            ));
            console.log(`Field options for ${fieldId} updated successfully in Google Sheet.`);
        } catch (err) {
            console.error('Error updating field options:', err);
            alert(`Error updating field options: ${err.message}`);
            if (err.status === 401) {
                if (clearToken) {
                    clearToken();
                }
            }
        }
    }, [SHEET_ID, token, fields]);

    useEffect(() => {
        if (!SHEET_ID) {
            setError(new Error("Configuration Error: VITE_SHEETS_ID is not set."));
            setLoading(false);
            return;
        }
        if (isInitialized && token) {
            setSheets([]); // Clear cache on sheetId switch
            setFields([]); // Clear cache on sheetId switch
            fetchSheetsData(token);
        } else if (isInitialized) {
            setLoading(false);
        }
    }, [SHEET_ID, token, isInitialized, fetchSheetsData]);

    const shotsHeader = sheets.length > 0 ? Object.keys(sheets[0]) : [];
    return { sheets, setSheets, fields, shotsHeader, loading, error, refreshData: () => fetchSheetsData(token), updateFieldOptions, idToColIndex };
};

export { useSheetsData };