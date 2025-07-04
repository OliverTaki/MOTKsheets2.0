import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSheetsData } from '../hooks/useSheetsData';
import usePagesData from '../hooks/usePagesData';
import ShotTable from './ShotTable';
import Toolbar from './Toolbar';
import LoginButton from './LoginButton';
import { AuthContext } from '../AuthContext';
import ShotDetailPage from './ShotDetailPage';
import AddShotPage from './AddShotPage'; // Import the new component
import { appendField } from '../api/appendField';
import { updateCell } from '../api/updateCell';
import { updateNonUuidIds } from '../api/updateNonUuidIds';
import { appendPage } from '../api/appendPage';
import { updatePage } from '../api/updatePage';
import { deletePage } from '../api/deletePage';
import { v4 as uuidv4 } from 'uuid';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const MainView = ({
  sheets,
  fields,
  pages,
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
  onLoadView,
  onSaveView,
  onSaveViewAs,
  onDeleteView,
  loadedPageId,
  onColumnOrderChange,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        fields={fields}
        pages={pages}
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
        onLoadView={onLoadView}
        onSaveView={onSaveView}
        onSaveViewAs={onSaveViewAs}
        onDeleteView={onDeleteView}
        loadedPageId={loadedPageId}
      />
      <div className="shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
        <ShotTable
          shots={sheets}
          fields={fields.filter(f => visibleFieldIds.includes(f.id))}
          columnWidths={columnWidths}
          onColumnResize={onColumnResize}
          onCellSave={(shotId, fieldId, newValue) => onCellSave(shotId, fieldId, newValue, idToColIndex)}
          onUpdateFieldOptions={onUpdateFieldOptions}
          onColumnOrderChange={onColumnOrderChange}
        />
      </div>
    </div>
  );
};

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const AppContainer = () => {
  const { token, user, isInitialized } = useContext(AuthContext);
  const { sheets, setSheets, fields, loading: fieldsLoading, error: fieldsError, refreshData, updateFieldOptions, idToColIndex } = useSheetsData(spreadsheetId);
  const { pages, loading: pagesLoading, error: pagesError, refreshPages } = usePagesData();

  const [columnWidths, setColumnWidths] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [ascending, setAscending] = useState(true);
  const [visibleFieldIds, setVisibleFieldIds] = useState([]);
  const [loadedPageId, setLoadedPageId] = useState(() => localStorage.getItem('loadedPageId') || null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [orderedFields, setOrderedFields] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);
  const [isInitialViewLoaded, setIsInitialViewLoaded] = useState(false);

  const handleLoadView = useCallback((page) => {
    if (!page) return;
    setColumnWidths(page.columnWidths || {});
    setVisibleFieldIds((page.visibleFieldIds && page.visibleFieldIds.length > 0) ? page.visibleFieldIds : fields.map(f => f.id));
    setActiveFilters(page.filterSettings || {});
    setSortKey(page.sortOrder?.key || '');
    setAscending(page.sortOrder?.ascending ?? true);
    setLoadedPageId(page.page_id);
    localStorage.setItem('loadedPageId', page.page_id);
    const newOrderedFields = page.columnOrder && page.columnOrder.length > 0
      ? page.columnOrder.map(id => fields.find(f => f.id === id)).filter(Boolean)
      : fields;
    setOrderedFields(newOrderedFields);
    setColumnOrder(page.columnOrder || []);
  }, [fields]);

  useEffect(() => {
    console.log(`AppContainer useEffect: isInitialized=${isInitialized}, fieldsLoading=${fieldsLoading}, pagesLoading=${pagesLoading}`);
    if (isInitialized && !fieldsLoading && !pagesLoading) {
      setIsAppReady(true);
      console.log("App is ready!");
    } else {
      setIsAppReady(false);
      console.log("App is NOT ready.");
    }
  }, [isInitialized, fieldsLoading, pagesLoading]);

  useEffect(() => {
    if (isAppReady && pages.length > 0 && !isInitialViewLoaded) {
      const pageIdToLoad = loadedPageId || 'default';
      const pageToLoad = pages.find(p => p.page_id === pageIdToLoad) || pages.find(p => p.page_id === 'default');
      
      if (pageToLoad) {
        handleLoadView(pageToLoad);
      } else if (fields.length > 0) {
        // Fallback to default field visibility if no page is loaded
        setVisibleFieldIds(fields.map(f => f.id));
        setOrderedFields(fields);
      }
      setIsInitialViewLoaded(true);
    }
  }, [isAppReady, pages, fields, handleLoadView, isInitialViewLoaded]);

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

  const getCurrentView = () => ({
    columnWidths,
    visibleFieldIds,
    activeFilters,
    sortOrder: { key: sortKey, ascending },
    author: user?.email || 'Unknown',
    columnOrder: orderedFields.map(f => f.id),
  });

  const handleSaveView = useCallback(async () => {
    if (!loadedPageId) {
      alert("No view loaded. Use 'Save As' to create a new view.");
      return;
    }
    const currentView = getCurrentView();
    const existingPage = pages.find(p => p.page_id === loadedPageId);
    await updatePage(spreadsheetId, token, loadedPageId, { ...existingPage, ...currentView });
    alert('View saved successfully!');
    refreshPages();
  }, [loadedPageId, token, pages, getCurrentView, refreshPages]);

  const handleSaveViewAs = useCallback(async (title) => {
    const page_id = uuidv4();
    const currentView = { ...getCurrentView(), page_id, title };
    await appendPage(spreadsheetId, token, currentView);
    setLoadedPageId(page_id);
    alert(`View "${title}" saved successfully!`);
    refreshPages();
  }, [token, getCurrentView, refreshPages]);

  const handleDeleteView = useCallback(async (pageId) => {
    if (pageId === 'default') {
      alert("You cannot delete the default view.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this view?')) {
      await deletePage(spreadsheetId, token, pageId);
      if (loadedPageId === pageId) {
        setLoadedPageId(null);
        localStorage.removeItem('loadedPageId');
      }
      alert('View deleted successfully!');
      refreshPages();
    }
  }, [token, loadedPageId, refreshPages]);

  const handleColumnOrderChange = (newOrder) => {
    setOrderedFields(newOrder);
    setColumnOrder(newOrder.map(f => f.id));
  };

  if (!isAppReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">MOTK Sheets 2.0</h1>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow z-10">
          <h1 className="text-2xl font-bold">MOTK Sheets 2.0</h1>
          <LoginButton />
        </header>

        <main className="p-4">
          {(fieldsError || pagesError) && <p className="text-red-500 text-center">Error: {fieldsError?.message || pagesError?.message}</p>}
          {!fieldsError && !pagesError && (
            <Routes>
              <Route path="/" element={
                <MainView
                  sheets={processedShots}
                  fields={orderedFields}
                  pages={pages}
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
                  onLoadView={handleLoadView}
                  onSaveView={handleSaveView}
                  onSaveViewAs={handleSaveViewAs}
                  onDeleteView={handleDeleteView}
                  loadedPageId={loadedPageId}
                  onColumnOrderChange={handleColumnOrderChange}
                />
              } />
              <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={orderedFields} />} />
              <Route path="/shots/new" element={<AddShotPage />} />
              <Route path="/shots/new" element={<AddShotPage />} />
            </Routes>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};