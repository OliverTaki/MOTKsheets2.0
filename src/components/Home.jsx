import React, { memo } from 'react';
import ProjectSelectPage from '../pages/ProjectSelectPage';
import ShotTable from './ShotTable';
import { useLocation } from 'react-router-dom';

const Home = memo(({
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
  fields
}) => {
  const location = useLocation();

  if (!sheetId) {
    return <ProjectSelectPage setSheetId={setSheetId} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ShotTable
        shots={sheets}
        fields={orderedFields}
        visibleFieldIds={visibleFieldIds}
        columnWidths={columnWidths}
        onColumnResize={onColumnResize}
        onCellSave={onCellSave}
        onUpdateFieldOptions={onUpdateFieldOptions}
        onColumnOrderChange={onColumnOrderChange}
        handleDragEnd={onColumnOrderChange}
        handleColResizeMouseDown={handleColResizeMouseDown}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if processedShots or other critical props change
  return (
    prevProps.sheetId === nextProps.sheetId &&
    prevProps.processedShots === nextProps.processedShots &&
    prevProps.orderedFields === nextProps.orderedFields &&
    prevProps.visibleFieldIds === nextProps.visibleFieldIds &&
    prevProps.columnWidths === nextProps.columnWidths &&
    prevProps.onCellSave === nextProps.onCellSave
  );
});

export default Home;