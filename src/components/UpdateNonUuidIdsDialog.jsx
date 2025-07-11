import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { AuthContext } from '../AuthContext';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import { getNonUuidIds, updateNonUuidIds } from '../api/updateNonUuidIds';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const UpdateNonUuidIdsDialog = ({ open, onClose, sheets = [], fields: fieldsProp = [] }) => {
  const { token, sheetId, ensureValidToken, setNeedsReAuth } = useContext(AuthContext);
  const { refreshData } = useContext(SheetsDataContext);
  const memoFields = useMemo(() => fieldsProp, [fieldsProp]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonUuidShotIds, setNonUuidShotIds] = useState([]);
  const [nonUuidFieldIds, setNonUuidFieldIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Find the UUIDs for shot_code and shot_name from the fields array
  const shotCodeField = memoFields.find(f => f.label === 'Shot Code');
  const shotCodeUuid = shotCodeField ? shotCodeField.id : null;

  const shotNameField = memoFields.find(f => f.label === 'Shot Name');
  const shotNameUuid = shotNameField ? shotNameField.id : null;

  useEffect(() => {
    console.log("UpdateNonUuidIdsDialog: useEffect triggered.");
    const fetchIds = async () => {
      console.log("UpdateNonUuidIdsDialog: fetchIds called. open:", open, "token:", token ? "present" : "missing", "sheets:", sheets ? "present" : "missing", "fields:", fields ? "present" : "missing");
      if (!token || !sheets || !memoFields || !sheetId) {
        console.log("UpdateNonUuidIdsDialog: fetchIds returning early due to missing dependencies.");
        return;
      }
      console.log("Sheets data passed to dialog:", sheets);
      console.log("Fields data passed to dialog:", fields);
      setLoading(true);
      setError(null);
      try {
        const { nonUuidShotIds, nonUuidFieldIds } = await getNonUuidIds(sheetId, sheets, memoFields);
        setNonUuidShotIds(nonUuidShotIds);
        setNonUuidFieldIds(nonUuidFieldIds);
        setSelectedIds(new Set([...nonUuidShotIds, ...nonUuidFieldIds])); // Select all by default
      } catch (err) {
        console.error("Failed to fetch non-UUID IDs:", err);
        setError(err.message || 'Failed to load non-UUID IDs.');
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      fetchIds();
    }
  }, [open, token, sheets, memoFields]);

  const handleToggle = (id) => {
    setSelectedIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set([...nonUuidShotIds, ...nonUuidFieldIds]));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleUpdateSelected = async () => {
    if (selectedIds.size === 0) {
      alert("No IDs selected for update.");
      return;
    }
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      await updateNonUuidIds(sheetId, token, setNeedsReAuth, sheets, memoFields, Array.from(selectedIds));
      setUpdateSuccess(true);
      // Refresh data in AppContainer after successful update
      if (refreshData) refreshData();
      // Re-fetch IDs to show updated state (should be empty if all updated)
      const { nonUuidShotIds: newShotIds, nonUuidFieldIds: newFieldIds } = await getNonUuidIds(sheetId, sheets, memoFields);
      setNonUuidShotIds(newShotIds);
      setNonUuidFieldIds(newFieldIds);
      setSelectedIds(new Set([...newShotIds, ...newFieldIds]));
    } catch (err) {
      console.error("Failed to update selected IDs:", err);
      setUpdateError(err.message || 'Failed to update selected IDs.');
    } finally {
      setUpdating(false);
      setTimeout(() => setUpdateSuccess(false), 3000); // Hide success message after 3 seconds
    }
  };

  const allIds = [...nonUuidShotIds, ...nonUuidFieldIds];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Update Non-UUID IDs</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading non-UUID IDs...</Typography>
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && allIds.length === 0 && (
          <Typography>No non-UUID IDs found. All IDs are valid UUIDs.</Typography>
        )}
        {!loading && !error && allIds.length > 0 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Button onClick={handleSelectAll} disabled={selectedIds.size === allIds.length}>Select All</Button>
              <Button onClick={handleDeselectAll} disabled={selectedIds.size === 0} sx={{ ml: 1 }}>Deselect All</Button>
            </Box>
            <List dense component="div" role="list">
              {nonUuidShotIds.length > 0 && (
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Shot IDs:</Typography>
              )}
              {nonUuidShotIds.map((id) => {
                const shot = sheets.find(s => s.shot_id === id);
                console.log(`Processing shot ID: ${id}, Shot object:`, shot);
                const display = shot ? (shot[shotCodeUuid] || shot[shotNameUuid] || `(No code/name for ${id})`) : `(Shot ID: ${id})`;
                return (
                  <ListItem key={id} role="listitem" button onClick={() => handleToggle(id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.has(id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={display} secondary={`Original ID: ${id}`} />
                  </ListItem>
                );
              })}
              {nonUuidFieldIds.length > 0 && (
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Field IDs:</Typography>
              )}
              {nonUuidFieldIds.map((id) => {
                const field = memoFields.find(f => f.id === id);
                console.log(`Processing field ID: ${id}, Field object:`, field);
                const display = field ? (field.label || `(No label for ${id})`) : `(Field ID: ${id})`;
                return (
                  <ListItem key={id} role="listitem" button onClick={() => handleToggle(id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.has(id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={display} secondary={`Original ID: ${id}`} />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
        {updating && <CircularProgress size={24} sx={{ mt: 2 }} />}
        {updateError && <Alert severity="error" sx={{ mt: 2 }}>{updateError}</Alert>}
        {updateSuccess && <Alert severity="success" sx={{ mt: 2 }}>Selected IDs updated successfully!</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updating}>Close</Button>
        <Button onClick={handleUpdateSelected} disabled={selectedIds.size === 0 || updating} variant="contained">
          Update Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateNonUuidIdsDialog;
