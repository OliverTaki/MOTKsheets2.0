import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriveSheets } from '../hooks/useDriveSheets';
import { AuthContext } from '../AuthContext';
import { useContext } from 'react';

export default function ProjectSelectPage() {
  const { sheets, loading, error } = useDriveSheets();
  const { setSheetId } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id) => {
    setSheetId(id);
    localStorage.setItem('motk:lastSheetId', id);
    navigate('/'); // Shots (既存ルート) へ
  };

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

      {sheets.length === 0 && (
        <p className="text-gray-500">
          No Google Sheets shared with this account were found.
        </p>
      )}

      <ul className="space-y-2">
        {sheets.map((file) => (
          <li
            key={file.id}
            onClick={() => handleSelect(file.id)}
            className="cursor-pointer border rounded-xl px-4 py-3 hover:bg-gray-50"
          >
            <div className="font-medium">{file.name}</div>
            <div className="text-sm text-gray-500">
              Owner: {file.owners?.[0]?.displayName ?? 'unknown'}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
