import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';
import { updateCell } from '../api/updateCell';

export const useSheetsData = () => {
  const { sheetId: ctxSheetId, token, isGapiClientReady } = useContext(AuthContext);
  const SHEET_ID = ctxSheetId || import.meta.env.VITE_SHEETS_ID;
  const [shots, setShots] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idToColIndex, setIdToColIndex] = useState({});

  const refreshData = useCallback(async () => {
    if (!SHEET_ID || !token || !isGapiClientReady || !window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await window.gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: SHEET_ID,
        ranges: ['Shots!A:AZ', 'FIELDS!A:F'],
      });
      const { valueRanges } = res.result;

      if (!valueRanges || valueRanges.length < 2 || !valueRanges[0].values || !valueRanges[1].values) {
        throw new Error("Data not found in spreadsheet. Check sheet names ('Shots', 'FIELDS') and ranges.");
      }

      const shotsDataValues = valueRanges[0].values;
      const fieldsDataValues = valueRanges[1].values;

      const shotsHeader = shotsDataValues?.[0] || [];
      const shotIdUuid = shotsHeader?.[0];
      const shotCodeUuid = shotsHeader?.[1];

      const parsedFields = parseFields(fieldsDataValues);
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

      setShots(shotsWithIds);
      setFields(finalFields);

    } catch (e) {
      console.error("Error fetching sheets data:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [SHEET_ID, token, isGapiClientReady]);

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
    }
  }, [SHEET_ID, token, fields]);

  useEffect(() => {
    setShots([]); // Clear cache on sheetId switch
    setFields([]); // Clear cache on sheetId switch
    refreshData();
  }, [refreshData]);

  return { sheets: shots, fields, loading, error, refreshData, updateFieldOptions, idToColIndex };
};
