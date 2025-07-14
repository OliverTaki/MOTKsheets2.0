import React, { forwardRef } from 'react';
import ProjectSelectPage from '../pages/ProjectSelectPage';
import ShotTable from './ShotTable';
import Toolbar from './Toolbar';
import { useLocation } from 'react-router-dom';

const Home = forwardRef(({
  sheetId,
  setSheetId,
  processedShots,
  orderedFields,
  visibleFieldIds,
  columnWidths,
  onColumnResize,
  onCellSave,
  onUpdateFieldOptions,
  onColumnOrderChange,
  handleColResizeMouseDown,
  sheets,
  fields,
  pages,
  pagesLoading,
  pagesError,
  loadPage,
  savePage,
  savePageAs,
  deletePage,
  loadedPageId
}, ref) => {
  const location = useLocation();

  if (!sheetId) {
    return <ProjectSelectPage setSheetId={setSheetId} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} ref={ref}>
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
      <ShotTable
        shots={sheets}
        fields={orderedFields}
        visibleFieldIds={visibleFieldIds}
        columnWidths={columnWidths}
        onColumnResize={onColumnResize}
        onCellSave={onCellSave}
        onUpdateFieldOptions={onUpdateFieldOptions}
        onColumnOrderChange={onColumnOrderChange}
      />
    </div>
  );
});

export default Home;
