import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { appendRow } from '../api/appendRow.js';
import { v4 as uuidv4 } from 'uuid';

const sheetId = import.meta.env.VITE_SHEETS_ID;

export default function SaveViewControl({ currentFilters, currentSort }) {
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [status, setStatus] = useState('');

  if (!token) return null;

  const handleSave = async () => {
    if (!viewName.trim()) return;
    setStatus('saving');
    const settings = { filters: currentFilters, sort: currentSort };
    try {
      await appendRow({
        sheetId,
        tabName: 'PAGES',
        token: token.access_token,
        values: [`pg-${uuidv4().slice(0, 8)}`, viewName, JSON.stringify(settings)],
      });
      setStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setStatus('');
        setViewName('');
        alert(`View "${viewName}" saved! Please reload the page to see it in the list.`);
        // Optionally, you could trigger a refetch of pages here instead of reloading
      }, 1500);
    } catch (err) {
      setStatus('error');
      alert(`Error saving view: ${err.message}`);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-sm bg-[#2c2d2f] border border-gray-600 rounded-md shadow-sm flex items-center gap-2 hover:bg-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v4.5h2a.5.5 0 0 1 .354.854l-2.5 2.5a.5.5 0 0 1-.708 0l-2.5-2.5A.5.5 0 0 1 5.5 6.5h2V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>
        Save View
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-[#1e1f20] p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Save Current View</h3>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter a name for this view..."
              className="w-full border border-gray-600 bg-[#2c2d2f] px-3 py-2 rounded-md mb-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm rounded-md border border-gray-600 hover:bg-gray-700">Cancel</button>
              <button onClick={handleSave} disabled={status === 'saving'} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white disabled:bg-blue-400">
                {status === 'saving' ? 'Saving...' : 'Save'}
              </button>
            </div>
            {status === 'success' && <p className="text-green-400 mt-2 text-center">Saved!</p>}
            {status === 'error' && <p className="text-red-400 mt-2 text-center">Failed to save.</p>}
          </div>
        </div>
      )}
    </>
  );
}
