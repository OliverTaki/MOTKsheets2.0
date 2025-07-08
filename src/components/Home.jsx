import React from 'react';
import ProjectSelectPage from '../pages/ProjectSelectPage';
import ShotTable from './ShotTable';
import { useLocation } from 'react-router-dom';

const Home = ({
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
        shots={processedShots}
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
};

export default Home;