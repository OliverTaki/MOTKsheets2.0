// src/components/ShotTable.tsx
import React, { useMemo, useEffect } from 'react';
import { DataGrid, useGridApiContext, useGridApiRef, GridToolbar } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowsProp,
  GridColumnOrderChangeParams,
  GridColumnResizeParams,
  GridCellEditCommitParams,
  GridRowParams,
  GridRowId,
  GridApi,
} from '@mui/x-data-grid';
import { Box, TextField, Checkbox } from '@mui/material';
import type {
  GridRenderEditCellParams,
} from '@mui/x-data-grid';

// Custom Edit Component to handle spacebar
function CustomEditComponent(props: GridRenderEditCellParams) {
  const { id, value, field } = props;
  const apiRef = useGridApiContext();

  const handleRef = (element: HTMLInputElement) => {
    if (element) {
      element.focus();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    apiRef.current.setEditCellValue({ id, field, value: event.target.value });
  };

  return (
    <TextField
      inputRef={handleRef}
      fullWidth
      multiline
      value={value}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.stopPropagation();
        }
      }}
    />
  );
}


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
  onApiRef?: (apiRef: React.MutableRefObject<GridApi>) => void;
}

const safe = (row: any, key: string) => (row && row[key] !== undefined && row[key] !== null ? row[key] : '');

export default function ShotTable({ shots, fields, onCellSave, onColumnOrderChange, onColumnResize, onApiRef }: Props) {
  const [selectionModel, setSelectionModel] = React.useState<GridRowId[]>([]);
  const apiRef = useGridApiRef();

  useEffect(() => {
    if (onApiRef) {
      onApiRef(apiRef);
    }
  }, [apiRef, onApiRef]);
  
  // Build rows, ensuring every field key exists and coercing types for the grid
  const rows: GridRowsProp = useMemo(
    () =>
      shots.map((s) => {
        const r: any = { id: s.shot_id, ...s };
        fields.forEach((f) => {
          if (r[f.id] === undefined || r[f.id] === null) {
            r[f.id] = '';
          }
          // Coerce boolean values for the grid's native boolean column
          if (f.type === 'checkbox') {
            const raw = r[f.id];
            r[f.id] =
              typeof raw === 'boolean'
                ? raw
                : typeof raw === 'string'
                ? ['true', '1'].includes(raw.trim().toLowerCase())
                : raw === 1;
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

  // Handle cell edit commits from the native editing API
  const handleCellEditCommit = (params: GridCellEditCommitParams) => {
    console.log('[ShotTable] handleCellEditCommit triggered for field type:', params.field);
    // For date objects, convert them to a standard format before saving
    if (params.value instanceof Date) {
      onCellSave(String(params.id), params.field, params.value.toISOString().split('T')[0]);
    } else {
      onCellSave(String(params.id), params.field, params.value);
    }
  };

  // Define columns using MUI's native editing features
  const columns: GridColDef[] = useMemo(
    () =>
      fields.map((f) => {
        const base: GridColDef = {
          field: f.id,
          headerName: f.label ?? f.id,
          width: 180,
          sortable: true,
          resizable: true,
          editable: false, // Set editable to false by default
        };
        switch (f.type) {
          case 'date':
            return {
              ...base,
              type: 'date',
              editable: true,
              // The grid expects Date objects for the date type
              valueGetter: (params) => (params.value ? new Date(params.value) : null),
              renderCell: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '';
              },
            };
          case 'select':
            return {
              ...base,
              type: 'singleSelect',
              editable: true,
              // The grid expects valueOptions in a specific format
              valueOptions: f.options?.map((opt) => {
                return typeof opt === 'object' ? opt : { value: opt, label: opt };
              }),
            };
          case 'checkbox':
            return {
              ...base,
              type: 'boolean',
              editable: true,
              renderCell: (params) => (
                <Checkbox
                  checked={params.value}
                  onChange={(e) => {
                    onCellSave(String(params.id), params.field, e.target.checked);
                  }}
                />
              ),
            };
          case 'image':
            return {
              ...base,
              sortable: false,
              filterable: false,
              editable: false, // Images are not editable
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
              editable: true,
            };
          default: // 'string'
            return {
              ...base,
              type: 'string',
              editable: true,
              renderEditCell: (params) => <CustomEditComponent {...params} />,
            };
        }
      }),
    [fields]
  );

  return (
    <Box
      sx={{
        height: 'calc(100vh - 150px)', // Adjust this value as needed
        width: '100%',
        '& .MuiDataGrid-root': {
          border: '1px solid rgba(224,224,224,1)',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid rgba(224,224,224,1)',
          borderRight: '1px solid rgba(224,224,224,1)',
          // Enable text wrapping
          whiteSpace: 'normal',
          wordWrap: 'break-word',
        },
        '& .MuiDataGrid-columnHeaders': {
          borderBottom: '1px solid rgba(224,224,224,1)',
          '& .MuiDataGrid-columnHeader': {
            borderRight: '1px solid rgba(224,224,224,1)',
          },
        },
        '& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type': {
          borderRight: 'none',
        },
      }}
    >
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onColumnOrderChange={onColumnOrderChange}
        onColumnResize={onColumnResize}
        onCellEditCommit={handleCellEditCommit}
        experimentalFeatures={{ newEditingApi: true }}
        // Enable auto-height and multi-selection
        getRowHeight={() => 'auto'}
        checkboxSelection
        onSelectionModelChange={(newSelectionModel) => {
          setSelectionModel(newSelectionModel as GridRowId[]);
        }}
        selectionModel={selectionModel}
        
      />
    </Box>
  );
}
