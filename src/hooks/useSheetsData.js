import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext, PROMPT_REQUIRED } from '../AuthContext';
import { parseShots, parseFields } from '../utils/parse';
import { missingIdHandler } from '../utils/missingIdHandler';
import { updateCell } from '../api/updateCell';
import { fetchGoogle } from '../utils/google';

export const useSheetsData = (sheetId) => {
  const { needsReAuth, ensureValidToken, setNeedsReAuth, token } = useContext(AuthContext);
  const [shots, setShots] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idToColIndex, setIdToColIndex] = useState({});

  const refreshData = useCallback(async () => {
    if (!sheetId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGoogle(`spreadsheets/${sheetId}/values:batchGet`, token, ensureValidToken, {
        ranges: ['Shots!A:AZ', 'FIELDS!A:F'],
      });
      console.log('useSheetsData: API response', res);
      const { valueRanges } = res;

      if (!valueRanges || valueRanges.length < 2 || !valueRanges[0].values || !valueRanges[1].values) {
        throw new Error("Data not found in spreadsheet. Check sheet names ('Shots', 'FIELDS') and ranges.");
      }

      const shotsDataValues = valueRanges[0].values;
      console.log('useSheetsData: shotsDataValues', shotsDataValues);
      const fieldsDataValues = valueRanges[1].values;

      const shotsHeader = shotsDataValues?.[0] || [];
      const shotIdUuid = shotsHeader?.[0] || 'shot_id'; // Fallback to a default ID if undefined
      const shotCodeUuid = shotsHeader?.[1] || 'shot_code'; // Fallback to a default ID if undefined

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
      if (e === PROMPT_REQUIRED) {
        setNeedsReAuth(true); // show dialog
        return;
      }
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [sheetId, token, setNeedsReAuth]);

  const updateFieldOptions = useCallback(async (fieldId, newOption) => {
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

      await updateCell(sheetId, token, setNeedsReAuth, range, updatedOptionsString, ensureValidToken);

      setFields(prevFields => prevFields.map(f =>
        f.id === fieldId ? { ...f, options: updatedOptionsString } : f
      ));
      console.log(`Field options for ${fieldId} updated successfully in Google Sheet.`);
    } catch (err) {
      console.error('Error updating field options:', err);
      if (err === PROMPT_REQUIRED) {
        setNeedsReAuth(true); // show dialog
        return;
      } else {
        alert(`Error updating field options: ${err.message}`);
      }
    }
  }, [sheetId, fields, token, setNeedsReAuth]);

  useEffect(() => {
    if (sheetId) {
      refreshData();
    }
  }, [sheetId, refreshData]);

  if (needsReAuth) return { sheets: [], fields: [], loading: false, error: 'NEEDS_REAUTH' };

  return {
    sheets: shots, // Renamed shots to sheets for consistency with AuthContext
    setShots, // Expose setShots for optimistic updates
    fields,
    setFields, // Expose setFields for optimistic updates
    loading,
    error,
    refreshData,
    updateFieldOptions,
    idToColIndex,
    updateIdToColIndex: (id, index) => {
      setIdToColIndex(prev => ({ ...prev, [id]: index }));
    },
    updateCell: (range, value) => updateCell(sheetId, token, setNeedsReAuth, range, value, ensureValidToken),
  };
};