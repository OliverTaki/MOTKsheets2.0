// src/components/ShotTableDG.tsx
import React, { useMemo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridCellEditCommitParams,
  GridColumnOrderChangeParams,
  GridColumnResizeParams
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

type Field = { id: string; headerName: string; type?: 'string' | 'number' | 'date' | 'boolean' };
type Shot = { shot_id: string; [key: string]: any };

type ShotTableProps = {
  shots: Shot[];
  fields: Field[];
  onCellSave: (id: string, field: string, value: any) => void;
  onColumnOrderChange?: (params: GridColumnOrderChangeParams) => void;
  onColumnResize?: (params: GridColumnResizeParams) => void;
};

export default function ShotTableDG({
  shots,
  fields,
  onCellSave,
  onColumnOrderChange,
  onColumnResize
}: ShotTableProps) {
  // Memoize rows and columns
  const rows: GridRowsProp = useMemo(
    () => shots.map(s => ({ id: s.shot_id, ...s })),
    [shots]
  );

  const columns: GridColDef[] = useMemo(
    () =>
      fields.map(f => ({
        field: f.id,
        headerName: f.headerName,
        width: 150,
        sortable: true,
        resizable: true,
        editable: true,
        type: f.type,
        flex: undefined
      })),
    [fields]
  );

  // Handle cell edit commit
  const handleEditCommit = (params: GridCellEditCommitParams) => {
    onCellSave(params.id as string, params.field, params.value);
  };

  // Handle column reorder
  const handleColumnOrderChange = (params: GridColumnOrderChangeParams) => {
    if (onColumnOrderChange) onColumnOrderChange(params);
  };

  // Handle column resizing
  const handleColumnResize = (params: GridColumnResizeParams) => {
    if (onColumnResize) onColumnResize(params);
  };

  return (
    <Box sx={{ height: 'calc(100dvh - 165px)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={handleEditCommit}
        onColumnOrderChange={handleColumnOrderChange}
        onColumnResize={handleColumnResize}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
      />
    </Box>
  );
}
