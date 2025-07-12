// src/components/ShotTable.tsx
import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowsProp,
  GridColumnOrderChangeParams,
  GridColumnResizeParams,
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

/** Field definition */
interface Field {
  id: string;
  headerName: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

/** Shot row data */
interface Shot {
  shot_id: string;
  [key: string]: any;
}

interface ShotTableProps {
  shots: Shot[];
  fields: Field[];
  onCellSave: (id: string, field: string, value: any) => void;
  onColumnOrderChange?: (params: GridColumnOrderChangeParams) => void;
  onColumnResize?: (params: GridColumnResizeParams) => void;
}

export default function ShotTable({
  shots,
  fields,
  onCellSave,
  onColumnOrderChange,
  onColumnResize,
}: ShotTableProps) {
  /** Map shots → DataGrid rows */
  const rows: GridRowsProp = useMemo(
    () => shots.map((s) => ({ id: s.shot_id, ...s })),
    [shots],
  );

  /** Map fields → DataGrid columns */
  const columns: GridColDef[] = useMemo(
    () =>
      fields.map((f) => {
        const base: GridColDef = {
          field: f.id,
          headerName: f.headerName,
          width: 150,
          sortable: true,
          resizable: true,
          editable: true,
          type: f.type === 'date' ? 'date' : f.type,
        };

        if (f.type === 'date') {
          base.valueGetter = (params: any) => {
            const raw = params?.row?.[f.id];
            if (!raw) return null;
            // Accept ISO string or timestamp number; fall back to null for invalid
            const date = typeof raw === 'number' ? new Date(raw) : new Date(raw as string);
            return isNaN(date.getTime()) ? null : date;
          };
                    base.valueFormatter = (params: any) => {
            if (!params || !params.value) return '';
            const v: Date | null = params.value as Date;
            return v ? v.toLocaleDateString() : '';
          };
        }
        return base;
      }),
    [fields],
  );

  /** Save edits */
  const handleEditCommit = (params: any) => {
    onCellSave(params.id as string, params.field, params.value);
  };

  const handleOrder = (params: GridColumnOrderChangeParams) => onColumnOrderChange?.(params);
  const handleResize = (params: GridColumnResizeParams) => onColumnResize?.(params);

  return (
    <Box sx={{ height: 'calc(100dvh - 165px)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={handleEditCommit}
        onColumnOrderChange={handleOrder}
        onColumnResize={handleResize}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
      />
    </Box>
  );
}
