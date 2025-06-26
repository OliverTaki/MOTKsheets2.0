import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import useSheetsData from './hooks/useSheetsData';
import { updateSheetWithNewIds } from './utils/sheetSync';
import ShotTable from './components/ShotTable';
import Toolbar from './components/Toolbar';
import LoginButton from './components/LoginButton';
import { AuthContext } from './AuthContext';
import MissingIdDialog from './components/MissingIdDialog';
import ShotDetailPage from './components/ShotDetailPage';

// 環境変数名を .env ファイルに合わせて修正
const spreadsheetId = import.meta.env.VITE_SHEETS_ID;

// メインのテーブルビューをコンポーネントとして分離
const MainView = ({ sheets, fields, onSort, onCellSave, sortKey, ascending, onFilterChange, allShots }) => {
  return (
    <>
      <Toolbar onFilterChange={onFilterChange} allShots={allShots} fields={fields} />
      <ShotTable
        shots={sheets}
        fields={fields}
        sortKey={sortKey}
        ascending={ascending}
        onSort={onSort}
        onCellSave={onCellSave}
      />
    </>
  );
};

// 「新しいショットを追加」ページ用のプレースホルダー
const NewShotPage = () => {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-700 rounded-lg shadow">
        <h2 className="text-2xl font-bold">Add New Shot</h2>
        <p className="mt-2">この機能は現在開発中です。</p>
      </div>
    );
}

function App() {
  const [sortKey, setSortKey] = useState('id');
  const [ascending, setAscending] = useState(true);
  const { token, isInitialized } = useContext(AuthContext);
  // useSheetsDataフックに正しいspreadsheetIdを渡す
  const { sheets, fields, loading, error, missingIds, setSheets, setMissingIds } = useSheetsData(spreadsheetId);
  const [filteredShots, setFilteredShots] = useState([]);

  useEffect(() => {
    setFilteredShots(sheets);
  }, [sheets]);

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

  const handleSort = (key) => {
    if (sortKey === key) {
      setAscending(!ascending);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  };

  const handleCellSave = async (rowIndex, fieldId, value) => {
    console.log(`Saving row ${rowIndex}, field ${fieldId} with value: ${value}`);
    // セル更新APIの呼び出しをここに実装
  };

  const handleConfirmPatch = async () => {
    if (!token) {
        alert("認証が必要です。サインインしてください。");
        return;
    }
    if (missingIds.length > 0) {
        try {
            await updateSheetWithNewIds(spreadsheetId, 'Shots', token, missingIds, fields);
            alert('シートが新しいIDで正常に更新されました。');
            setMissingIds([]);
        } catch (err) {
            console.error('シートの更新に失敗しました:', err);
            alert(`エラー: ${err.message}`);
        }
    }
  };

  const handleCancelPatch = () => {
    setMissingIds([]);
    alert('更新はキャンセルされました。');
  };

  const sortedShots = [...filteredShots].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });

  return (
    <div className="App bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <h1 className="text-2xl font-bold">MOTK Sheets 2.0</h1>
        <LoginButton />
      </header>

      <main className="p-4">
        {loading && <p className="text-center">Loading sheet data...</p>}
        {error && <p className="text-red-500 text-center">Error: {error.message}</p>}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={
              <MainView
                sheets={sortedShots}
                fields={fields}
                onSort={handleSort}
                onCellSave={handleCellSave}
                sortKey={sortKey}
                ascending={ascending}
                onFilterChange={setFilteredShots}
                allShots={sheets}
              />
            } />
            <Route path="/shot/:shotId" element={<ShotDetailPage shots={sheets} fields={fields} />} />
            <Route path="/shots/new" element={<NewShotPage />} />
          </Routes>
        )}
      </main>
      
      <MissingIdDialog
        isOpen={missingIds.length > 0}
        onConfirm={handleConfirmPatch}
        onCancel={handleCancelPatch}
        missingCount={missingIds.length}
      />
    </div>
  );
}

export default App;
