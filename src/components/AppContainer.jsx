import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ProtectedRoutes from '../routes/ProtectedRoutes';
import Home from './Home';
import { useSheetsData } from '../hooks/useSheetsData';
import { usePagesData } from '../hooks/usePagesData';
import GlobalNav from './GlobalNav';
import Toolbar from './Toolbar';
import LoginButton from './LoginButton';
import { AuthContext, AuthProvider } from '../AuthContext';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import ShotDetailPage from './ShotDetailPage';
import AddShotPage from './AddShotPage'; // Import the new component
import { appendField } from '../api/appendField';
import { updateCell } from '../api/updateCell';
import { updateNonUuidIds } from '../api/updateNonUuidIds';
import { appendPage } from '../api/appendPage';
import { updatePage } from '../api/updatePage';
import { deletePage } from '../api/deletePage';
import { v4 as uuidv4 } from 'uuid';
import UpdateNonUuidIdsDialog from './UpdateNonUuidIdsDialog';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;



const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const AppContainer = () => {
  const { token, user, isInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  const [sheetId, setSheetId] = useState(() => {
    return localStorage.getItem('motk:lastSheetId') || null;
  });

  const { sheets, fields, loading: fieldsLoading, error: fieldsError, refreshData, updateFieldOptions, idToColIndex } = useSheetsData(sheetId);
  const { pages, loading: pagesLoading, error: pagesError, refreshPages } = usePagesData(sheetId);

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
  const [isUpdateNonUuidIdsDialogOpen, setUpdateNonUuidIdsDialogOpen] = useState(false);

  const handleLoadView = useCallback((page) => {
    if (!page) return;
    setColumnWidths(page.columnWidths || {});
    setVisibleFieldIds((page.visibleFieldIds && page.visibleFieldIds.length > 0) ? page.visibleFieldIds : fields.map(f => f.id));
    setActiveFilters(page.filterSettings || {});
    setSortKey(page.sortOrder?.key || '');
    setAscending(page.sortOrder?.ascending ?? true);
    setLoadedPageId(page.page_id);
    localStorage.setItem('loadedPageId', page.page_id);

    // Start with the ordered fields from the saved view.
    const baseOrderedFields = page.columnOrder && page.columnOrder.length > 0
      ? page.columnOrder.map(id => fields.find(f => f.id === id)).filter(Boolean)
      : fields; // Or all fields if no order is saved.

    const baseFieldIds = new Set(baseOrderedFields.map(f => f.id));
    
    // Find any fields that exist in the master list but not in the view's order.
    const newFields = fields.filter(f => !baseFieldIds.has(f.id));

    // Append the new fields to the end of the ordered list.
    const finalOrderedFields = [...baseOrderedFields, ...newFields];
    
    setOrderedFields(finalOrderedFields);
    setColumnOrder(finalOrderedFields.map(f => f.id));
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
  }, [isAppReady, pages, fields, handleLoadView, isInitialViewLoaded, loadedPageId]);

  const processedShots = useMemo(() => {
    let filtered = sheets;
    const activeFilterKeys = Object.keys(activeFilters);

    if (activeFilterKeys.length > 0) {
      filtered = sheets.filter(shot => {
        return activeFilterKeys.every(fieldId => {
          const rule = activeFilters[fieldId];
          if (!rule) return true; // If filter is unchecked, don't apply it

          const shotValue = String(shot[fieldId] || '').toLowerCase();
          const filterValue = String(rule.value || '').toLowerCase();

          switch (rule.operator) {
            case 'is':
              return shotValue === filterValue;
            case 'is not':
              return shotValue !== filterValue;
            case 'contains':
              return shotValue.includes(filterValue);
            case 'does not contain':
              return !shotValue.includes(filterValue);
            default:
              return true;
          }
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
    setActiveFilters(prev => {
      if (fieldId === null) { // Clear all filters
        return {};
      } else if (value === null) { // Remove filter for a specific field
        const newFilters = { ...prev };
        delete newFilters[fieldId];
        return newFilters;
      } else { // Set or update filter for a specific field
        return { ...prev, [fieldId]: value };
      }
    });
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
      const newField = await appendField(sheetId, token, newFieldDetails, fields);
      alert(`Field "${newField.label}" added successfully!`);

      // Instead of a full refresh, which can be slow and reset the UI,
      // we can optimistically update the local state. This makes the app feel faster.
      const newFields = [...fields, newField];
      setOrderedFields(newFields);
      setVisibleFieldIds(prev => [...prev, newField.id]);

      // We still need to trigger a background refresh to get the updated
      // idToColIndex map, which is crucial for editing cells in the new column.
      if (refreshData) {
        refreshData();
      }

    } catch (err) {
      console.error("Failed to add field:", err);
      alert(`Error: ${err.message}`);
    }
  }, [token, fields, refreshData, sheetId]);

  const handleCellSave = useCallback(async (shotId, fieldId, newValue) => {
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
      await updateCell(sheetId, token, range, newValue);
      refreshData(); // Refresh data after successful save
      console.log(`Cell ${range} updated successfully.`);
    } catch (err) {
      console.error("Failed to update cell:", err);
      alert(`Error: ${err.message}`);
    }
  }, [token, sheets, sheetId, idToColIndex, refreshData]);

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
    await updatePage(sheetId, token, loadedPageId, { ...existingPage, ...currentView });
    alert('View saved successfully!');
    refreshPages();
  }, [loadedPageId, token, pages, getCurrentView, refreshPages, sheetId]);

  const handleSaveViewAs = useCallback(async (title) => {
    const page_id = uuidv4();
    const currentView = { ...getCurrentView(), page_id, title };
    await appendPage(sheetId, token, currentView);
    setLoadedPageId(page_id);
    alert(`View "${title}" saved successfully!`);
    refreshPages();
  }, [token, getCurrentView, refreshPages, sheetId]);

  const handleDeleteView = useCallback(async (pageId) => {
    if (pageId === 'default') {
      alert("You cannot delete the default view.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this view?')) {
      await deletePage(sheetId, token, pageId);
      if (loadedPageId === pageId) {
        setLoadedPageId(null);
        localStorage.removeItem('loadedPageId');
      }
      alert('View deleted successfully!');
      refreshPages();
    }
  }, [token, loadedPageId, refreshPages, sheetId]);

  const handleColumnOrderChange = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems;
      });
    }
  };

  const handleColResizeMouseDown = (e, fieldId) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[fieldId] ?? 150;

    const handleMouseMove = (moveEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth > 50) { // Minimum column width
        setColumnWidths((prev) => ({ ...prevWidths, [fieldId]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  

  if (!isAppReady && token && sheetId) { // Only show loading if token and sheetId exist
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
      <AuthProvider refreshData={refreshData}>
        <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
          <GlobalNav sheetId={sheetId} setSheetId={setSheetId} />
          {token && sheetId && ( // Only show project navigation and toolbar if token and sheetId exist
            <>
              <div className="sticky top-[48px] z-20 bg-gray-800">
                <Toolbar
                  fields={fields}
                  pages={pages}
                  activeFilters={activeFilters}
                  onFilterChange={handleFilterChange}
                  allShots={sheets}
                  sortKey={sortKey}
                  ascending={ascending}
                  onSort={handleSort}
                  visibleFieldIds={visibleFieldIds}
                  onVisibilityChange={handleVisibilityChange}
                  onAddField={handleAddField}
                  onLoadView={handleLoadView}
                  onSaveView={handleSaveView}
                  onSaveViewAs={handleSaveViewAs}
                  onDeleteView={handleDeleteView}
                  loadedPageId={loadedPageId}
                  onOpenUpdateNonUuidIdsDialog={() => setUpdateNonUuidIdsDialogOpen(true)}
                />
              </div>
            </>
          )}
          <main className="flex-grow bg-gray-800" style={{ flex: 1 }}>
            {(fieldsError || pagesError) && <p className="text-red-500 text-center">Error: {fieldsError?.message || pagesError?.message}</p>}
            {!fieldsError && !pagesError && (
              <SheetsDataContext.Provider value={{ sheets, fields, loading: fieldsLoading, error: fieldsError, refreshData, updateFieldOptions, idToColIndex }}>
                <Routes>
                  <Route path="/signin" element={<LoginButton />} />
                  {!sheetId ? (
                    <Route path="/" element={<ProjectSelectPage setSheetId={setSheetId} />} />
                  ) : (
                    <Route element={<ProtectedRoutes />}>
                      <Route path="/" element={
                    <Home
                      sheetId={sheetId}
                      setSheetId={setSheetId}
                      processedShots={processedShots}
                      orderedFields={orderedFields}
                      visibleFieldIds={visibleFieldIds}
                      columnWidths={columnWidths}
                      onColumnResize={handleColumnResize}
                      onCellSave={handleCellSave}
                      onUpdateFieldOptions={updateFieldOptions}
                      onColumnOrderChange={handleColumnOrderChange}
                      handleColResizeMouseDown={handleColResizeMouseDown}
                      sheets={sheets}
                      fields={fields}
                    />
                  } />
                      <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={orderedFields} idToColIndex={idToColIndex} />} />
                      <Route path="/shots/new" element={<AddShotPage />} />
                    </Route>
                  )}
                </Routes>
              </SheetsDataContext.Provider>
            )}
          </main>
          <footer className="sticky bottom-0 bg-gray-200 dark:bg-gray-700 z-10 flex-shrink-0" style={{ height: '24px' }}>
            {/* Status Bar */}
          </footer>
          <UpdateNonUuidIdsDialog
            open={isUpdateNonUuidIdsDialogOpen}
            onClose={() => setUpdateNonUuidIdsDialogOpen(false)}
            sheets={sheets}
            fields={fields}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};