import React, { useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../AuthContext';
import { appendPage } from '../api/appendPage';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const SaveViewControl = ({
  columnWidths,
  visibleFieldIds,
  activeFilters,
  sortKey,
  ascending,
  onSave,
}) => {
  const [viewName, setViewName] = useState('');
  const { token } = useContext(AuthContext);

  const handleSave = async () => {
    if (!viewName.trim()) {
      alert('Please enter a name for this view.');
      return;
    }

    const pageData = {
      page_id: uuidv4(),
      title: viewName,
      columnWidths,
      columnOrder: visibleFieldIds, // Assuming order is managed by visibility for now
      filterSettings: activeFilters,
      fieldVisibility: visibleFieldIds,
      sortOrder: { key: sortKey, ascending },
    };

    try {
      await appendPage(spreadsheetId, token, pageData);
      alert(`View "${viewName}" saved successfully!`);
      if (onSave) {
        onSave(pageData);
      }
      setViewName('');
    } catch (error) {
      console.error('Failed to save view:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        placeholder="Save current view as..."
        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Save View
      </button>
    </div>
  );
};

export default SaveViewControl;
