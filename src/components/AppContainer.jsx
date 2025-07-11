import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Home';
import { useSheetsData } from '../hooks/useSheetsData';
import { usePagesData } from '../hooks/usePagesData';
import GlobalNav from './GlobalNav';
import Toolbar from './Toolbar';
import LoginButton from './LoginButton';
import { AuthContext, AuthProvider } from '../AuthContext';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import { SheetsContext } from '../contexts/SheetsContext';
import ShotDetailPage from './ShotDetailPage';
import AddShotPage from './AddShotPage'; // Import the new component
import ProjectSelectPage from '../pages/ProjectSelectPage';
import { appendField } from '../api/appendField';
import { updateCell } from '../api/updateCell';
import { updateNonUuidIds } from '../api/updateNonUuidIds';
import { appendPage } from '../api/appendPage';
import { updatePage } from '../api/updatePage';
import { deletePage } from '../api/deletePage';
import { v4 as uuidv4 } from 'uuid';
import UpdateNonUuidIdsDialog from './UpdateNonUuidIdsDialog';
import FullScreenSpinner from './FullScreenSpinner';


const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const AppContainer = () => {
  const { token, user, isInitialized, needsReAuth, signIn, ensureValidToken, setNeedsReAuth, error: authError } = useContext(AuthContext);
  console.log('AppContainer: token', token ? 'present' : 'null');
  const navigate = useNavigate();

  const { sheetId, setSheetId } = useContext(SheetsContext);
  console.log('AppContainer: sheetId', sheetId);

  // Hooks should not be called if sheetId is not yet available.
  if (!sheetId) {
    // You might want to render a loading state or something similar here
    // For now, just preventing the hooks from running with null.
    return <FullScreenSpinner />;
  }

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
  const sheetsRef = useRef(sheets);

  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  const handleLoadView = useCallback((page) => {
    if (!page) return;
    setColumnWidths(page.columnWidths || {});
    setVisibleFieldIds((page.visibleFieldIds && page.visibleFieldIds.length > 0) ? page.visibleFieldIds : fields.map(f => f.id));
    setActiveFilters(page.filterSettings || {});
    setSortKey(page.sortOrder?.key || '');
    setAscending(page.sortOrder?.ascending ?? true);
    setLoadedPageId(page.page_id);
    localStorage.setItem('loadedPageId', page.page_id);

    const baseOrderedFields = page.columnOrder && page.columnOrder.length > 0
      ? page.columnOrder.map(id => fields.find(f => f.id === id)).filter(Boolean)
      : fields;

    const baseFieldIds = new Set(baseOrderedFields.map(f => f.id));
    const newFields = fields.filter(f => !baseFieldIds.has(f.id));
    const finalOrderedFields = [...baseOrderedFields, ...newFields];
    
    setOrderedFields(finalOrderedFields);
    setColumnOrder(finalOrderedFields.map(f => f.id));
  }, [fields]);

  useEffect(() => {
    const ready = isInitialized && !fieldsLoading && !pagesLoading && !needsReAuth;
    setIsAppReady(ready);
  }, [isInitialized, fieldsLoading, pagesLoading, needsReAuth]);

  useEffect(() => {
    if (isAppReady && pages.length > 0 && !isInitialViewLoaded) {
      const pageIdToLoad = loadedPageId || 'default';
      const pageToLoad = pages.find(p => p.page_id === pageIdToLoad) || pages.find(p => p.page_id === 'default');
      
      if (pageToLoad) {
        handleLoadView(pageToLoad);
      } else if (fields.length > 0) {
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
          if (!rule) return true;

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
      if (fieldId === null) {
        return {};
      } else if (value === null) {
        const newFilters = { ...prev };
        delete newFilters[fieldId];
        return newFilters;
      } else {
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
    try {
      const newField = await appendField(sheetId, token, setNeedsReAuth, newFieldDetails, fields, ensureValidToken);
      alert(`Field "${newField.label}" added successfully!`);

      // Optimistically update fields state
      setFields(prevFields => {
        const updatedFields = [...prevFields, newField];
        // Also update orderedFields and visibleFieldIds to reflect the new field immediately
        setOrderedFields(updatedFields);
        setVisibleFieldIds(prevVisible => [...prevVisible, newField.id]);

        // Update idToColIndex for the new field
        updateIdToColIndex(newField.id, fields.length); // fields.length is the new column index

        return updatedFields;
      });

      // No need to refreshData() here, as setFields updates the UI
      // and idToColIndex will be updated on next full data fetch (e.g., page load)
      // If idToColIndex is critical for immediate editing of the *new* column,
      // a partial update to idToColIndex would be needed here.
      // For now, relying on next full fetch for idToColIndex consistency.

    } catch (err) {
      console.error("Failed to add field:", err);
      alert(`Error: ${err.message}`);
    }
  }, [fields, setFields, sheetId, ensureValidToken, token, setNeedsReAuth]);

  const handleCellSave = useCallback(async (shotId, fieldId, newValue) => {
    const currentSheets = sheetsRef.current; // Use ref to get current sheets
    const originalRowIndex = currentSheets.findIndex(s => s.shot_id === shotId);
    if (originalRowIndex === -1) {
      console.error("Could not find shot to update");
      return;
    }

    const originalValue = currentSheets[originalRowIndex][fieldId];

    // Optimistically update the UI
    const updatedShots = [...currentSheets];
    updatedShots[originalRowIndex] = { ...updatedShots[originalRowIndex], [fieldId]: newValue };
    ReactDOM.flushSync(() => {
      setShots(updatedShots);
    });

    const sheetRowIndex = originalRowIndex + 3;
    const sheetColumnIndex = idToColIndex[fieldId];
    if (sheetColumnIndex === undefined) {
      console.error("Could not find column for fieldId:", fieldId);
      // Revert optimistic update
      setShots(currentSheets);
      return;
    }
    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + sheetColumnIndex);
    const range = `Shots!${columnLetter}${sheetRowIndex}`;

    try {
      await updateCell(sheetId, token, setNeedsReAuth, range, newValue, ensureValidToken);
      console.log(`Cell ${range} updated successfully.`);
    } catch (err) {
      console.error("Failed to update cell:", err);
      alert(`Error: ${err.message}`); // Show alert on failure
      // Revert optimistic update on failure
      const revertedShots = [...currentSheets];
      revertedShots[originalRowIndex] = { ...revertedShots[originalRowIndex], [fieldId]: originalValue };
      setShots(revertedShots);

      if (err.message.includes("401")) {
        setNeedsReAuth(true);
      }
    }
  }, [setShots, sheetId, idToColIndex, ensureValidToken, token, setNeedsReAuth]);

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
    await updatePage(sheetId, token, setNeedsReAuth, loadedPageId, { ...existingPage, ...currentView }, ensureValidToken);
    alert('View saved successfully!');
    refreshPages();
  }, [loadedPageId, pages, getCurrentView, refreshPages, sheetId, ensureValidToken]);

  const handleSaveViewAs = useCallback(async (title) => {
    const page_id = uuidv4();
    const currentView = { ...getCurrentView(), page_id, title };
    await appendPage(sheetId, token, setNeedsReAuth, currentView, ensureValidToken);
    setLoadedPageId(page_id);
    alert(`View "${title}" saved successfully!`);
    refreshPages();
  }, [getCurrentView, refreshPages, sheetId, ensureValidToken]);

  const handleDeleteView = useCallback(async (pageId) => {
    if (pageId === 'default') {
      alert("You cannot delete the default view.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this view?')) {
      await deletePage(sheetId, token, setNeedsReAuth, pageId, ensureValidToken);
      if (loadedPageId === pageId) {
        setLoadedPageId(null);
        localStorage.removeItem('loadedPageId');
      }
      alert('View deleted successfully!');
      refreshPages();
    }
  }, [loadedPageId, refreshPages, sheetId, ensureValidToken]);

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

  const handleColResizeMouseDown = (fieldId, startX) => {
    const startWidth = columnWidths[fieldId] ?? 150;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [fieldId]: newWidth }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (needsReAuth) {
    signIn();
    return <FullScreenSpinner />;
  }

  if (!isAppReady) {
    return <FullScreenSpinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
        <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
          <GlobalNav sheetId={sheetId} />
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
            {(fieldsError || pagesError || authError) && (
              <p className="text-red-500 text-center">
                Error: {fieldsError?.message || pagesError?.message || authError?.message}
              </p>
            )}
            {!fieldsError && !pagesError && (
              <SheetsDataContext.Provider value={{ sheetId, setSheetId, sheets, fields, loading: fieldsLoading, error: fieldsError, refreshData, updateFieldOptions, idToColIndex }}>
                <Routes>
                  <Route path="/signin" element={<LoginButton />} />
                  <Route path="/select" element={<ProjectSelectPage />} />
                  
                  <Route path="/" element={sheetId ? <Home
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
                      sheets={sheets} // Ensure sheets prop is passed and triggers re-render
                      fields={fields}
                    /> : <ProjectSelectPage />} />
                  <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={orderedFields} idToColIndex={idToColIndex} />} />
                  <Route path="/shots/new" element={<AddShotPage />} />
                </Routes>
              </SheetsDataContext.Provider>
            )}
          </main>
          <footer className="sticky bottom-0 bg-gray-200 dark:bg-gray-700 z-10 flex-shrink-0" style={{ height: '24px' }}>
            {/* Status Bar */}
          </footer>
          {isUpdateNonUuidIdsDialogOpen && (
            <UpdateNonUuidIdsDialog
              open={isUpdateNonUuidIdsDialogOpen}
              onClose={() => setUpdateNonUuidIdsDialogOpen(false)}
              sheets={sheets}
              fields={fields}
            />
          )}
        </div>
      
    </ThemeProvider>
  );
};