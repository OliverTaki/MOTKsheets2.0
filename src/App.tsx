import { useState } from 'react';
import ShotTable from './components/ShotTable';
import useSheetsData from './hooks/useSheetsData';

export default function App() {
  const { shots, fields } = useSheetsData();
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">MOTKsheets2.0 – Shots</h1>

      <ShotTable
        shots={shots}
        fields={fields}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  );
}
