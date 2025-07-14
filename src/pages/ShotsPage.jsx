import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useSheetsData } from '../hooks/useSheetsData';
import { usePagesData } from '../hooks/usePagesData';
import Home from '../components/Home';
import { SheetsContext } from '../contexts/SheetsContext';

export default function ShotsPage() {
  const { needsReAuth } = useContext(AuthContext);
  const { sheetId, setSheetId } = useContext(SheetsContext);
  const { sheets, fields, loading, error, refreshData, idToColIndex, updateCell, setShots, setFields, updateFieldOptions } = useSheetsData(sheetId);
  const { pages, pagesLoading, pagesError, loadPage, savePage, savePageAs, deletePage, loadedPageId } = usePagesData(sheetId, fields);

  if (loading || pagesLoading) {
    return <div>Loading data...</div>;
  }

  if (error || pagesError) {
    return <div>Error: {error?.message || pagesError?.message || 'Failed to load data.'}</div>;
  }

  return (
    <Home
      sheetId={sheetId}
      setSheetId={setSheetId}
      processedShots={sheets} // This will be processed in AppContainer
      orderedFields={fields} // This will be processed in AppContainer
      visibleFieldIds={fields.map(f => f.id)} // This will be processed in AppContainer
      columnWidths={{}}
      onColumnResize={() => {}}
      onCellSave={updateCell} // Pass the updateCell function
      onUpdateFieldOptions={updateFieldOptions}
      onColumnOrderChange={() => {}}
      handleColResizeMouseDown={() => {}}
      sheets={sheets}
      fields={fields}
      pages={pages}
      pagesLoading={pagesLoading}
      pagesError={pagesError}
      loadPage={loadPage}
      savePage={savePage}
      savePageAs={savePageAs}
      deletePage={deletePage}
      loadedPageId={loadedPageId}
    />
  );
}