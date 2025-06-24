import { useState } from 'react';
import ShotTable from './components/ShotTable';
import useMockData from './hooks/useMockData';
import LoginButton from './components/LoginButton';   // ★追加

export default function App() {
  const { shots, fields } = useMockData();
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MOTKsheets2.0 – Shots</h1>
        <LoginButton />                                {/* ★追加 */}
      </div>

      <ShotTable
        shots={shots}
        fields={fields}
        onSelect={setSelected}
      />

      {/* 既存の Drawer or Row 展開がある場合はここに残す */}
    </div>
  );
}
