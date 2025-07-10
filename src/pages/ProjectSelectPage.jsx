import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriveSheets } from '../hooks/useDriveSheets';
import { toProjectName } from '../utils/id';
import { SheetsContext } from '../contexts/SheetsContext';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

export default function ProjectSelectPage() {
  const { sheets, loading, error } = useDriveSheets();
  const navigate = useNavigate();
  const { sheetId, setSheetId } = useContext(SheetsContext);

  // state が確定したのを確認してから遷移
  useEffect(() => {
    if (sheetId) navigate('/');
  }, [sheetId, navigate]);

  if (loading) return <div className="p-4">Loading project list…</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error while fetching Drive files: {error.message}
      </div>
    );

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Select a Project</h1>

      <FormControl fullWidth>
        <InputLabel id="project-select-label">Project</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={sheets.some(s => s.id === sheetId) ? sheetId : ''}
          label="Project"
          onChange={e => setSheetId(e.target.value)}
        >
          {sheets.length === 0 && (
            <MenuItem value="" disabled>
              No Google Sheets found
            </MenuItem>
          )}
          {sheets
            .sort((a, b) => toProjectName(a).localeCompare(toProjectName(b)))
            .map((file) => (
              <MenuItem key={file.id} value={file.id}>
                {toProjectName(file)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {sheets.length === 0 && !loading && (
        <p className="text-gray-500 mt-4">
          No Google Sheets shared with this account were found.
        </p>
      )}
    </main>
  );
}
