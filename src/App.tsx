import { useState } from 'react';
import ShotTable from './components/ShotTable';
import useMockData from './hooks/useMockData';

export default function App() {
  const { shots, fields } = useMockData();
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">MOTKsheets2.0 – Shots</h1>
      <ShotTable
        shots={shots}
        fields={fields}
        selected={selected}
        onSelect={setSelected}
      />
    </div>
  );
}
