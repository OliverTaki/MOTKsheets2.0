import { useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useSheetsData } from '../hooks/useSheetsData';
import { usePagesData } from '../hooks/usePagesData';
import ShotTable from '../components/ShotTable';
import Toolbar from '../components/Toolbar';
import AppContainer from '../components/AppContainer';
import { SheetsContext } from '../contexts/SheetsContext';

export default function ShotsPage() {
  const { needsReAuth, setNeedsReAuth } = useContext(AuthContext);
  const { sheetId } = useContext(SheetsContext);
  const { sheets, fields, loading, error, refreshData, idToColIndex, updateCell } = useSheetsData(sheetId);
  const { pages, pagesLoading, pagesError, loadPage, savePage, savePageAs, deletePage, loadedPageId } = usePagesData(sheetId, fields);

  useEffect(() => {
    if (needsReAuth) return;
    refreshData();
  }, [refreshData, needsReAuth]);

  if (loading || pagesLoading) {
    return <div>Loading data...</div>;
  }

  if (error || pagesError) {
    return <div>Error: {error?.message || pagesError?.message || 'Failed to load data.'}</div>;
  }

  

  return (
    <AppContainer>
      <Toolbar
        fields={fields}
        pages={pages}
        pagesLoading={pagesLoading}
        pagesError={pagesError}
        onLoadView={loadPage}
        onSaveView={savePage}
        onSaveViewAs={savePageAs}
        onDeleteView={deletePage}
        loadedPageId={loadedPageId}
      />
      <ShotTable shots={sheets} fields={fields} idToColIndex={idToColIndex} onCellSave={handleCellSave} />
    </AppContainer>
  );
}