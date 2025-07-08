import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import { updateCell } from '../api/updateCell';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const ShotDetailPage = () => {
  const { shotId } = useParams();
  const { token } } = useContext(AuthContext);
  const { sheets, fields, idToColIndex, refreshData } = useContext(SheetsDataContext);
  const [shot, setShot] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const currentShot = shots.find(s => String(s.shot_id) === String(shotId));
    setShot(currentShot);
    if (currentShot) {
      const initialEditValues = {};
      fields.forEach(field => {
        initialEditValues[field.id] = currentShot[field.id] || '';
      });
      setEditValues(initialEditValues);
    }
  }, [shotId, shots, fields]);

  const handleChange = (fieldId, value) => {
    setEditValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = async (fieldId) => {
    if (!shot || !token) {
      setSaveError('Cannot save. No shot data or user is not authenticated.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const newValue = editValues[fieldId];

    // Find the row index in the Google Sheet (assuming header is row 1, UUIDs are row 2, data starts row 3)
    const originalShotIndex = sheets.findIndex(s => String(s.shot_id) === String(shot.shot_id));
    if (originalShotIndex === -1) {
      setSaveError("Error: Could not find the shot's row in the sheet data.");
      setSaving(false);
      return;
    }
    const sheetRowIndex = originalShotIndex + 3; // +1 for 1-based, +1 for header, +1 for UUID row

    // Find the column index in the Google Sheet
    const fieldColumnIndex = idToColIndex[fieldId];
    if (fieldColumnIndex === undefined) {
      setSaveError(`Error: Could not find column for field: ${fieldId}.`);
      setSaving(false);
      return;
    }
    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + fieldColumnIndex);
    const range = `Shots!${columnLetter}${sheetRowIndex}`;

    try {
      await updateCell(spreadsheetId, token, range, newValue);
      setShot(prevShot => ({ ...prevShot, [fieldId]: newValue }));
      setSaveSuccess(true);
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Failed to update cell:', err);
      setSaveError(err.message || 'Failed to save data.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2 seconds
    }
  };

  if (!shot) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading shot details or shot not found...</Typography>
        <Button component={Link} to="/" variant="outlined" sx={{ mt: 3 }}>
          Back to Shot List
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button component={Link} to="/" variant="outlined" sx={{ mb: 3 }}>
        &larr; Back to Shot List
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>
        Shot Detail: {shot.shot_code || shot.shot_id}
      </Typography>
      <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
        {fields.map(field => (
          <FormControl fullWidth margin="normal" key={field.id}>
            {field.type === 'select' ? (
              <>
                <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
                <Select
                  labelId={`${field.id}-label`}
                  id={field.id}
                  name={field.id}
                  value={editValues[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  onBlur={() => field.editable && handleSave(field.id)}
                  label={field.label}
                  disabled={!field.editable || saving}
                >
                  {field.options && field.options.split(',').map(option => (
                    <MenuItem key={option} value={option.trim()}>
                      {option.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </>
            ) : (
              <TextField
                label={field.label}
                name={field.id}
                value={editValues[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => field.editable && handleSave(field.id)}
                fullWidth
                margin="normal"
                type={field.type === 'number' ? 'number' : 'text'}
                disabled={!field.editable || saving}
                InputProps={{
                  readOnly: !field.editable,
                }}
              />
            )}
          </FormControl>
        ))}
        {saving && <CircularProgress size={24} sx={{ mt: 2 }} />}
        {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
        {saveSuccess && <Alert severity="success" sx={{ mt: 2 }}>Saved successfully!</Alert>}
      </Box>
    </Container>
  );
};

export default ShotDetailPage;