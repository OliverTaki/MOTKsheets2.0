import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import useSheetsData from '../hooks/useSheetsData';
import usePagesData from '../hooks/usePagesData';
import ShotTable from './ShotTable';
import Toolbar from './Toolbar';
import LoginButton from './LoginButton';
import { AuthContext } from '../AuthContext';
import ShotDetailPage from './ShotDetailPage';
import FieldManager from './FieldManager';
import { appendField } from '../api/appendField';
import { updateCell } from '../api/updateCell';
import { updateNonUuidIds } from '../api/updateNonUuidIds';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const MainView = ({
  sheets,
  fields,
  columnWidths,
  onColumnResize,
  activeFilters,
  onFilterChange,
  allShots,
  sortKey,
  ascending,
  onSort,
  visibleFieldIds,
  onVisibilityChange,
  onAddField,
  onCellSave,
  onUpdateFieldOptions,
  onUpdateNonUuidIds,
  idToColIndex,
  onSaveView,
  onLoadView, // Pass onLoadView
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <Toolbar
        fields={fields}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        allShots={allShots}
        sortKey={sortKey}
        ascending={ascending}
        onSort={onSort}
        visibleFieldIds={visibleFieldIds}
        onVisibilityChange={onVisibilityChange}
        onAddField={onAddField}
        onUpdateNonUuidIds={onUpdateNonUuidIds}
        columnWidths={columnWidths}
        onSaveView={onSaveView}
        onLoadView={onLoadView} // Pass onLoadView
      />
      <div className="shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
        <ShotTable
          shots={sheets}
          fields={fields.filter(f => visibleFieldIds.includes(f.id))}
          columnWidths={columnWidths}
          onColumnResize={onColumnResize}
          onCellSave={(shotId, fieldId, newValue) => onCellSave(shotId, fieldId, newValue, idToColIndex)}
          onUpdateFieldOptions={onUpdateFieldOptions}
        />
      </div>
    </div>
  );
};

const NewShotPage = () => <div className="p-8"><h2>Add New Shot (WIP)</h2></div>;

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const AppContainer = () => {
  const { token, isInitialized } = useContext(AuthContext);
  const { sheets, setSheets, fields, loading, error, refreshData, updateFieldOptions, idToColIndex } = useSheetsData(spreadsheetId);
  const { pages, refreshPages } = usePagesData();

  console.log('App: loading=', loading, 'error=', error);
  const [columnWidths, setColumnWidths] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [ascending, setAscending] = useState(true);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);

  useEffect(() => {
    if (fields.length > 0) {
      setVisibleFieldIds(fields.map(f => f.id));
    }
  }, [fields]);

  const processedShots = useMemo(() => {
    let filtered = sheets;
    const activeFilterKeys = Object.keys(activeFilters).filter(key => activeFilters[key] && activeFilters[key].length > 0);
    if (activeFilterKeys.length > 0) {
      filtered = sheets.filter(shot => {
        return activeFilterKeys.every(fieldId => {
          const selectedValues = activeFilters[fieldId];
          return selectedValues.includes(shot[fieldId]);
        });
      });
    }
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
  }, [activeFilters, sheets, sortKey, ascending]);

  useEffect(() => {
    if (fields.length > 0) {
      const initialWidths = {};
      fields.forEach(field => {
        if (field.id === 'shot_id') initialWidths[field.id] = 200;
        else if (field.id === 'shot_code') initialWidths[field.id] = 120;
        else if (field.id === 'status') initialWidths[field.id] = 100;
        else if (field.id === 'version') initialWidths[field.id] = 80;
        else if (field.id === 'thumbnail') initialWidths[field.id] = 160;
        else if (field.id === 'memo') initialWidths[field.id] = 400;
        else initialWidths[field.id] = 150;
      });
      setColumnWidths(initialWidths);
    }
  }, [fields]);

  const handleColumnResize = useCallback((fieldId, newWidth) => {
    setColumnWidths(prevWidths => ({ ...prevWidths, [fieldId]: newWidth < 60 ? 60 : newWidth }));
  }, []);

  const handleSort = (key) => {
    if (!key) return;
    if (key === sortKey) setAscending(!ascending);
    else { setSortKey(key); setAscending(true); }
  };

  const handleFilterChange = useCallback((fieldId, value) => {
    if (fieldId === null) setActiveFilters({});
    else setActiveFilters(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleVisibilityChange = useCallback((fieldId) => {
    setVisibleFieldIds(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  }, []);

  const handleAddField = useCallback(async (newFieldDetails) => {
    if (!token) { alert("Authentication required."); return; }
    try {
      await appendField(spreadsheetId, token, newFieldDetails, fields);
      alert(`Field "${newFieldDetails.label}" added successfully!`);
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Failed to add field:", err);
      alert(`Error: ${err.message}`);
    }
  }, [token, fields, refreshData]);

  const handleCellSave = useCallback(async (shotId, fieldId, newValue, idToColIndex) => {
    if (!token) { alert("Authentication required."); return; }

    const originalRowIndex = sheets.findIndex(s => s.shot_id === shotId);
    if (originalRowIndex === -1) {
      console.error("Could not find shot to update");
      return;
    }
    const sheetRowIndex = originalRowIndex + 3;

    const sheetColumnIndex = idToColIndex[fieldId];
    if (sheetColumnIndex === undefined) {
      console.error("Could not find column for fieldId:", fieldId);
      return;
    }
    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + sheetColumnIndex);
    const range = `Shots!${columnLetter}${sheetRowIndex}`;

    try {
      await updateCell(spreadsheetId, token, range, newValue);
      setSheets(prevSheets =>
        prevSheets.map(shot =>
          shot.shot_id === shotId ? { ...shot, [fieldId]: newValue } : shot
        )
      );
      console.log(`Cell ${range} updated successfully.`);
    } catch (err) {
      console.error("Failed to update cell:", err);
      alert(`Error: ${err.message}`);
    }
  }, [token, sheets, setSheets]);

  const handleUpdateNonUuidIds = useCallback(async () => {
    if (!token) { alert("Authentication required."); return; }
    if (!confirm("This will replace all non-UUID Shot and Field IDs with new UUIDs. This action is irreversible and may break external references. Are you sure?")) {
      return;
    }
    try {
      await updateNonUuidIds(spreadsheetId, token, sheets, fields);
      alert("Non-UUID IDs updated successfully!");
      refreshData();
    } catch (err) {
      console.error("Failed to update non-UUID IDs:", err);
      alert(`Error: ${err.message}`);
    }
  }, [spreadsheetId, token, sheets, fields, refreshData]);

  const handleSaveView = useCallback(() => {
    if (refreshPages) {
      refreshPages();
    }
  }, [refreshPages]);

  const handleLoadView = useCallback((page) => {
    setColumnWidths(page.columnWidths || {});
    setVisibleFieldIds(page.fieldVisibility || fields.map(f => f.id));
    setActiveFilters(page.filterSettings || {});
    setSortKey(page.sortOrder?.key || '');
    setAscending(page.sortOrder?.ascending ?? true);
  }, [fields]);

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">MOTK Sheets 2.0</h1>
          <p className="text-xl">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow z-10">
          <h1 className="text-2xl font-bold">MOTK Sheets 2.0</h1>
          <LoginButton />
        </header>

        <main className="p-4 overflow-hidden">
          {loading && <p className="text-center">Loading sheet data...</p>}
          {error && <p className="text-red-500 text-center">Error: {error.message}</p>}
          {!loading && !error && (
            <Routes>
              <Route path="/" element={
                <MainView
                  sheets={processedShots}
                  fields={fields}
                  columnWidths={columnWidths}
                  onColumnResize={handleColumnResize}
                  activeFilters={activeFilters}
                  onFilterChange={handleFilterChange}
                  allShots={sheets}
                  sortKey={sortKey}
                  ascending={ascending}
                  onSort={handleSort}
                  visibleFieldIds={visibleFieldIds}
                  onVisibilityChange={handleVisibilityChange}
                  onAddField={handleAddField}
                  onCellSave={handleCellSave}
                  onUpdateFieldOptions={updateFieldOptions}
                  onUpdateNonUuidIds={handleUpdateNonUuidIds}
                  idToColIndex={idToColIndex}
                  onSaveView={handleSaveView}
                  onLoadView={handleLoadView} // Pass handler
                />
              } />
              <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={fields} />} />
              <Route path="/shots/new" element={<NewShotPage />} />
            </Routes>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};
