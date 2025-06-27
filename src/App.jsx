import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import useSheetsData from './hooks/useSheetsData';
import ShotTable from './components/ShotTable';
import Toolbar from './components/Toolbar';
import LoginButton from './components/LoginButton';
import { AuthContext } from './AuthContext';
import ShotDetailPage from './components/ShotDetailPage';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

const MainView = ({ sheets, fields, onFilterChange, allShots, columnWidths, onColumnResize }) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <Toolbar onFilterChange={onFilterChange} allShots={allShots} fields={fields} />
      <div className="flex-1 overflow-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <ShotTable
            shots={sheets}
            fields={fields}
            columnWidths={columnWidths}
            onColumnResize={onColumnResize}
          />
      </div>
    </div>
  );
};

const NewShotPage = () => {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-700 rounded-lg shadow">
        <h2 className="text-2xl font-bold">Add New Shot</h2>
        <p className="mt-2">この機能は現在開発中です。</p>
      </div>
    );
}

function App() {
  const { token, isInitialized } = useContext(AuthContext);
  const { sheets, fields, loading, error } = useSheetsData(spreadsheetId);
  const [filteredShots, setFilteredShots] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});

  useEffect(() => {
    setFilteredShots(sheets);
  }, [sheets]);

  useEffect(() => {
    if (fields.length > 0) {
        const initialWidths = {};
        fields.forEach(field => {
            if (field.id === 'shot_id')      initialWidths[field.id] = 200;
            else if (field.id === 'shot_code')   initialWidths[field.id] = 120;
            else if (field.id === 'status')      initialWidths[field.id] = 100;
            else if (field.id === 'version')     initialWidths[field.id] = 80;
            else if (field.id === 'thumbnail')   initialWidths[field.id] = 160;
            else if (field.id === 'memo')        initialWidths[field.id] = 400;
            else                                 initialWidths[field.id] = 150;
        });
        setColumnWidths(initialWidths);
    }
  }, [fields]);

  const handleColumnResize = useCallback((fieldId, newWidth) => {
    setColumnWidths(prevWidths => ({
        ...prevWidths,
        [fieldId]: newWidth < 60 ? 60 : newWidth
    }));
  }, []);

  if (!isInitialized) {
      return (
          <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">MOTK Sheets 2.0</h1>
                <p className="text-xl">Initializing Authentication...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="App bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow z-10">
        <h1 className="text-2xl font-bold">MOTK Sheets 2.0</h1>
        <LoginButton />
      </header>

      <main className="p-4 flex-1 overflow-hidden">
        {loading && <p className="text-center">Loading sheet data...</p>}
        {error && <p className="text-red-500 text-center">Error: {error.message}</p>}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={
              <MainView
                sheets={filteredShots} // ソートされていないリストを渡します
                fields={fields}
                onFilterChange={setFilteredShots}
                allShots={sheets}
                columnWidths={columnWidths}
                onColumnResize={handleColumnResize}
              />
            } />
            <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={fields} />} />
            <Route path="/shots/new" element={<NewShotPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
