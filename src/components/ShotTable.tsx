// src/components/ShotTable.tsx
import React, { useMemo, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowsProp,
  GridCellEditCommitParams,
  GridColumnOrderChangeParams,
  GridColumnResizeParams,
} from '@mui/x-data-grid';
import { Box, Checkbox, Select, MenuItem } from '@mui/material';

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface Field {
  id: string;
  label?: string;
  type?: 'string' | 'number' | 'date' | 'checkbox' | 'image' | 'select';
  options?: Array<string | { value: string; label: string }>;
}
interface Shot {
  shot_id: string;
  [key: string]: any;
}
interface Props {
  shots: Shot[];
  fields: Field[];
  onCellSave: (id: string, field: string, value: any) => void;
  onColumnOrderChange?: (p: GridColumnOrderChangeParams) => void;
  onColumnResize?: (p: GridColumnResizeParams) => void;
}

const safe = (row: any, key: string) => (row && row[key] !== undefined && row[key] !== null ? row[key] : '');

export default function ShotTable({ shots, fields, onCellSave, onColumnOrderChange, onColumnResize }: Props) {
  // Build rows, ensuring every field key exists
  const rows: GridRowsProp = useMemo(
    () =>
      shots.map((s) => {
        const r: any = { id: s.shot_id, ...s };
        fields.forEach((f) => {
          if (r[f.id] === undefined || r[f.id] === null) {
            r[f.id] = '';
          }
        });
        return r;
      }),
    [shots, fields]
  );

  // Expose for debugging
  useEffect(() => {
    (window as any).dbgShots = shots;
    (window as any).dbgRows = rows;
    (window as any).dbgFields = fields;
  }, [shots, rows, fields]);

  // Define columns with inline editors
  const columns: GridColDef[] = useMemo(
    () =>
      fields.map((f) => {
        // Common column base
        const base: GridColDef = {
          field: f.id,
          headerName: f.label ?? f.id,
          width: 160,
        };
        switch (f.type) {
          case 'date':
            return {
              ...base,
              renderCell: (params) => (
                <input
                  type="date"
                  value={String(safe(params.row, f.id))}
                  onChange={(e) => onCellSave(String(params.id), f.id, e.target.value)}
                  style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
                />
              ),
            };
          case 'select':
            return {
              ...base,
              renderCell: (params) => (
                <Select
                  value={safe(params.row, f.id)}
                  onChange={(e) => onCellSave(String(params.id), f.id, e.target.value)}
                  variant="standard"
                  fullWidth
                >
                  {f.options?.map((opt) => {
                    const value = typeof opt === 'object' ? opt.value : opt;
                    const label = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              ),
            };
          case 'checkbox':
            return {
              ...base,
              renderCell: (params) => {
                const raw = safe(params.row, f.id);
                const checked =
                  typeof raw === 'boolean'
                    ? raw
                    : typeof raw === 'string'
                    ? ['true', '1'].includes(raw.trim().toLowerCase())
                    : raw === 1;
                return (
                  <Checkbox
                    checked={checked}
                    onChange={(e) => onCellSave(String(params.id), f.id, e.target.checked ? 'TRUE' : 'FALSE')}
                    size="small"
                  />
                );
              },
            };
          case 'image':
            return {
              ...base,
              sortable: false,
              filterable: false,
              renderCell: (params) => {
                const url = safe(params.row, f.id);
                return typeof url === 'string' && url.startsWith('http') ? (
                  <img src={url} alt={f.label ?? f.id} width={120} height={68} style={{ objectFit: 'cover' }} />
                ) : (
                  <span>---</span>
                );
              },
            };
          case 'number':
            return {
              ...base,
              type: 'number',
            };
          default:
            return {
              ...base,
              renderCell: (params) => <span>{String(safe(params.row, f.id))}</span>,
            };
        }
      }),
    [fields, onCellSave]
  );

  return (
    <Box sx={{ height: 'calc(100dvh - 165px)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onColumnOrderChange={onColumnOrderChange}
        onColumnResize={onColumnResize}
        disableSelectionOnClick
      />
    </Box>
  );
}
