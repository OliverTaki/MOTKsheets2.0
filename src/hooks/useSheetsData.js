import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';
import { updateCell } from '../api/updateCell';

const useSheetsData = (spreadsheetId) => {
    const { token, isInitialized, clearToken } = useContext(AuthContext);
    const [sheets, setSheets] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [idToColIndex, setIdToColIndex] = useState({});

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
            console.log("useSheetsData: parsedFields (from parseFields):", parsedFields);
            const shotsDataValues = data.valueRanges?.[0]?.values;
            const shotsHeader = shotsDataValues?.[0] || []; // This is the UUID row
            console.log("useSheetsData: shotsHeader (UUID row):", shotsHeader);
            const shotIdUuid = shotsHeader?.[0];
            const shotCodeUuid = shotsHeader?.[1];
            console.log("useSheetsData: shotIdUuid:", shotIdUuid, "shotCodeUuid:", shotCodeUuid);

            const finalFields = [
                // Manually prepend fields that are not in the FIELDS sheet but are in the Shots sheet.
                { id: shotIdUuid, label: 'Shot ID', type: 'text', editable: false },
                { id: shotCodeUuid, label: 'Shot Code', type: 'text', editable: true }, // Set shot_code as editable
                ...parsedFields.filter(f => f.id !== shotIdUuid && f.id !== shotCodeUuid)
            ];

            const parsedShots = parseShots(shotsDataValues, finalFields, shotIdUuid);
            const { shotsWithIds } = missingIdHandler(parsedShots);

            // Create the idToColIndex map from the actual sheet header (UUIDs)
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
    }, [spreadsheetId, clearToken]);

    const updateFieldOptions = useCallback(async (fieldId, newOption) => {
        if (!token) {
            alert("Authentication required to update field options.");
            return;
        }
        try {
            // Find the field in the current fields state
            const fieldToUpdate = fields.find(f => f.id === fieldId);
            if (!fieldToUpdate) {
                throw new Error(`Field with ID ${fieldId} not found.`);
            }

            // Get the current options and append the new one
            const currentOptions = fieldToUpdate.options ? fieldToUpdate.options.split(',') : [];
            if (!currentOptions.includes(newOption)) {
                currentOptions.push(newOption);
            }
            const updatedOptionsString = currentOptions.join(',');

            // Determine the row index for the field in the FIELDS sheet
            // Assuming FIELDS sheet starts from row 1 (header) and data starts from row 2
            // And assuming field.id corresponds to the first column (A)
            const fieldRowIndex = fields.findIndex(f => f.id === fieldId) + 2; // +1 for 0-based to 1-based, +1 for header row

            // Determine the column index for 'options' in the FIELDS sheet
            // This is a bit brittle, ideally we'd get this from the parsed header
            // For now, let's assume 'options' is column F (index 5, 0-based)
            // Based on parse.js, it's the 5th column (0-indexed) if it exists.
            // A=0, B=1, C=2, D=3, E=4, F=5
            const optionsColumnLetter = 'F'; // Assuming 'options' is in column F

            const range = `FIELDS!${optionsColumnLetter}${fieldRowIndex}`;

            await updateCell(spreadsheetId, token, range, updatedOptionsString);

            // Optimistically update the local state
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
    }, [spreadsheetId, token, fields]);

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
    const shotsHeader = sheets.length > 0 ? Object.keys(sheets[0]) : [];
    return { sheets, setSheets, fields, shotsHeader, loading, error, refreshData: () => fetchSheetsData(token), updateFieldOptions, idToColIndex };
};

export { useSheetsData };
