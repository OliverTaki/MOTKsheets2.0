// src/components/ShotTable.tsx – clean, compile‑ready version
import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowsProp,
  GridCellEditCommitParams,
  GridColumnOrderChangeParams,
  GridColumnResizeParams,
} from '@mui/x-data-grid';
import { Box, Checkbox } from '@mui/material';

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

/* ------------------------------------------------------------------
 * Helper
 * ------------------------------------------------------------------ */
const safe = (row: any, key: string) => (row && row[key] !== undefined ? row[key] : '');

/* ------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------ */
export default function ShotTable({ shots, fields, onCellSave, onColumnOrderChange, onColumnResize }: Props) {
  /* ---------------- rows ---------------- */
  const rows: GridRowsProp = useMemo(() => {
    return shots.map((s) => {
      const r: any = { id: s.shot_id, ...s };
      fields.forEach((f) => {
        if (r[f.id] === undefined || r[f.id] === null) r[f.id] = '';
      });
      return r;
    });
  }, [shots, fields]);

  /* expose for ad‑hoc debug */
  React.useEffect(() => {
    (window as any).dbgRows = rows;
    (window as any).dbgShots = shots;
    (window as any).dbgFields = fields;
  }, [rows, shots, fields]);

  /* ---------------- columns ---------------- */
  const columns: GridColDef[] = useMemo(() => {
    return fields.map((f): GridColDef => {
      const col: GridColDef = {
        field: f.id,
        headerName: f.label ?? f.id,
        width: 160,
        editable: true,
      };

      switch (f.type) {
        /* -------- date (ISO string) -------- */
                /* -------- date (ISO string) -------- */
        case 'date':
          col.valueGetter = (p) => safe(p.row, f.id);
          col.renderCell = (p) => <span>{safe(p.row, f.id)}</span>;
          col.renderEditCell = (params) => (
            <input
              type="date"
              value={String(params.value ?? '')}
              style={{ width: '100%', border: 'none', background: 'transparent' }}
              onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)}
            />
          );
          break;

        /* -------- checkbox -------- */
                /* -------- checkbox -------- */
                /* -------- checkbox (clickable) -------- */
        case 'checkbox': {
          // non-editable cell, custom clickable checkbox
          const raw = safe;
          return {
            field: f.id,
            headerName: f.label ?? f.id,
            width: 160,
            sortable: false,
            resizable: true,
            renderCell: (p) => (
              <Checkbox
                checked={
                  ((): boolean => {
                    const r = safe(p.row, f.id);
                    if (typeof r === 'boolean') return r;
                    if (typeof r === 'string') {
                      const v = r.trim().toLowerCase();
                      return v === 'true' || v === '1';
                    }
                    if (typeof r === 'number') return r === 1;
                    return false;
                  })()
                }
                onChange={(e) => {
                  const newVal = e.target.checked ? 'TRUE' : 'FALSE';
                  onCellSave(String(p.id), f.id, newVal);
                }}
                size="small"
              />
            ),
          };
        }

        /* -------- select -------- */
                /* -------- select -------- */
        case 'select': {
          const opts = f.options ?? [];
          col.type = 'singleSelect';
          col.valueOptions = opts.map((o) => (typeof o === 'object' ? o.value : o));
          col.valueGetter = (p) => safe(p.row, f.id);
          col.renderCell = (p) => {
            const val = safe(p.row, f.id);
            const found = opts.find((o) => (typeof o === 'object' ? o.value === val : o === val));
            return <span>{typeof found === 'object' ? found.label : val}</span>;
          };
          col.valueFormatter = (p) => {
            const val = p.value;
            const found = opts.find((o) => (typeof o === 'object' ? o.value === val : o === val));
            return typeof found === 'object' ? found.label : val ?? '';
          };
          break;
        }

        /* -------- image -------- */
        case 'image':
          col.sortable = col.filterable = false;
          col.renderCell = (p) => {
            const url = safe(p.row, f.id);
            return typeof url === 'string' && url.startsWith('http') ? (
              <img src={url} alt={f.label ?? f.id} width={120} height={68} style={{ objectFit: 'cover' }} />
            ) : (
              <span>---</span>
            );
          };
          break;

        /* -------- number -------- */
        case 'number':
          col.type = 'number';
          break;

        default:
          break;
      }
      return col;
    });
  }, [fields]);

  /* ---------------- edit commit ---------------- */
  const handleEditCommit = (p: GridCellEditCommitParams) => {
    const meta = fields.find((fd) => fd.id === p.field);
    let val = p.value;
    if (meta?.type === 'checkbox') val = (p.value as boolean) ? 'TRUE' : 'FALSE';
    onCellSave(String(p.id), p.field, val);
  };

  /* ---------------- render ---------------- */
  return (
    <Box sx={{ height: 'calc(100dvh - 165px)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        editMode="cell"
        onCellEditCommit={handleEditCommit}
        onColumnOrderChange={onColumnOrderChange}
        onColumnResize={onColumnResize}
        disableSelectionOnClick
      />
    </Box>
  );
}
