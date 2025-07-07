import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { appendRow } from '../api/appendRow';
import { useNavigate } from 'react-router-dom';
import { useSheetsData } from '../hooks/useSheetsData';
import { v4 as uuidv4 } from 'uuid';

const AddShotPage = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const spreadsheetId = import.meta.env.VITE_SHEETS_ID;
  const { fields, idToColIndex, loading: sheetsLoading, error: sheetsError } = useSheetsData(spreadsheetId);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("AddShotPage: useEffect triggered. Fields:", fields);
    if (fields && fields.length > 0) {
      const initialFormData = {};
      fields.forEach(field => {
        initialFormData[field.id] = '';
      });
      setFormData(initialFormData);
      console.log("AddShotPage: Initial formData set:", initialFormData);
    }
  }, [fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("AddShotPage: handleSubmit triggered.");
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not available.');
      setLoading(false);
      console.log("AddShotPage: Authentication token not available.");
      return;
    }

    if (!fields || fields.length === 0) {
      setError('Shot headers not loaded. Cannot add shot.');
      setLoading(false);
      console.log("AddShotPage: Fields not loaded.");
      return;
    }

    try {
      console.log("AddShotPage: Constructing newShotData.");
      const newShotData = {};
      fields.forEach(field => {
        newShotData[field.id] = formData[field.id] || '';
      });

      // Generate UUID for shot_id if it's in the headers and not already set
      const shotIdField = fields.find(f => f.label === 'Shot ID');
      if (shotIdField && !newShotData[shotIdField.id]) {
        newShotData[shotIdField.id] = uuidv4();
        console.log("AddShotPage: Generated shot_id:", newShotData[shotIdField.id]);
      }

      // Create an array of values in the correct order based on idToColIndex
      console.log("AddShotPage: Ordering values for appendRow.");
      const orderedValues = new Array(Object.keys(idToColIndex).length).fill('');
      for (const id in newShotData) {
        if (idToColIndex.hasOwnProperty(id)) {
          orderedValues[idToColIndex[id]] = newShotData[id];
        }
      }
      console.log("AddShotPage: Ordered values:", orderedValues);

      console.log("AddShotPage: Calling appendRow.");
      await appendRow({
        sheetId: import.meta.env.VITE_SHEETS_ID,
        token,
        tabName: 'Shots',
        values: orderedValues,
      });
      console.log("AddShotPage: appendRow successful. Navigating to /.");
      navigate('/'); // Redirect to main shot table
    } catch (err) {
      console.error('Failed to add shot:', err);
      setError(err.message || 'Failed to add shot.');
    } finally {
      setLoading(false);
      console.log("AddShotPage: setLoading(false).");
    }
  };

  if (sheetsLoading) {
    return <div className="p-4 text-white">Loading sheet data...</div>;
  }

  if (sheetsError) {
    return <div className="p-4 text-red-500">Error loading sheet data: {sheetsError.message}</div>;
  }

  return (
    <div className="p-4 bg-gray-800 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Add New Shot</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.filter(field => field.label !== 'Shot ID').map(field => (
          <div key={field.id} className="flex flex-col">
            <label htmlFor={field.id} className="mb-1 text-sm font-medium capitalize">
              {field.label}:
            </label>
            {field.type === "select" ? (
              <select
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Select an option</option>
                {Array.isArray(field.options) && field.options.map((option) => (
                  <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>
                    {typeof option === 'object' ? option.label : option}
                  </option>
                ))}
              </select>
            ) : field.type === "date" ? (
              <input
                type="date"
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
            ) : (
              <input
                type="text"
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
            )}
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding Shot...' : 'Add Shot'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="ml-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold disabled:opacity-50"
          disabled={loading}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AddShotPage;