import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import useSheetsData from './hooks/useSheetsData';
import ShotTable from './components/ShotTable';
import Toolbar from './components/Toolbar';
import LoginButton from './components/LoginButton';
import { AuthContext } from './AuthContext';
import ShotDetailPage from './components/ShotDetailPage';
import FieldManager from './components/FieldManager';
import { appendField } from './api/appendField';
import { updateCell } from './api/updateCell';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

// MainViewに、全ての機能のpropsを渡すように修正
const MainView = ({ sheets, fields, columnWidths, onColumnResize, activeFilters, onFilterChange, allShots, sortKey, ascending, onSort, visibleFieldIds, onVisibilityChange, onAddField, onCellSave }) => {
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
      />
      <div className="flex-1 overflow-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <ShotTable
            shots={sheets}
            fields={fields.filter(f => visibleFieldIds.includes(f.id))}
            columnWidths={columnWidths}
            onColumnResize={onColumnResize}
            onCellSave={onCellSave}
          />
      </div>
    </div>
  );
};

const NewShotPage = () => <div className="p-8"><h2>Add New Shot (WIP)</h2></div>;

function App() {
  const { token, isInitialized } = useContext(AuthContext);
  const { sheets, setSheets, fields, loading, error, refreshData } = useSheetsData(spreadsheetId);
  const [columnWidths, setColumnWidths] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [ascending, setAscending] = useState(true);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);

  useEffect(() => {
      if(fields.length > 0) {
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
            if (field.id === 'shot_id')      initialWidths[field.id] = 200;
            else if (field.id === 'shot_code')   initialWidths[field.id] = 120;
            else if (field.id === 'status')      initialWidths[field.id] = 100;
            else if (field.id === 'version')     initialWidths[field.id] = 80;
            else if (field.id === 'thumbnail')   initialWidths[field.id] = 160;
            else if (field.id === 'memo')        initialWidths[field.id] = 400;
            else                                 initialWidths[field.id] = 150;
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
        if(refreshData) refreshData();
    } catch (err) {
        console.error("Failed to add field:", err);
        alert(`Error: ${err.message}`);
    }
  }, [token, fields, refreshData]);

  const handleCellSave = useCallback(async (shotId, fieldId, newValue) => {
    if (!token) { alert("Authentication required."); return; }

    const originalRowIndex = sheets.findIndex(s => s.shot_id === shotId);
    if (originalRowIndex === -1) {
        console.error("Could not find shot to update");
        return;
    }
    const sheetRowIndex = originalRowIndex + 2;

    const sheetColumnIndex = fields.findIndex(f => f.id === fieldId);
    if (sheetColumnIndex === -1) {
        console.error("Could not find field to update");
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
  }, [token, sheets, fields, setSheets]);


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
    <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow z-10">
        <h1 className="text-2xl font-bold">MOTK Sheets 2.0</h1>
        <LoginButton />
      </header>

      <main className="p-4 flex-1 overflow-hidden">
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
              />
            } />
            <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={fields} />} />
            <Route path="/shots/new" element={<NewShotPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
