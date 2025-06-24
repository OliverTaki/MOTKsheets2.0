import { useState, useEffect, useMemo } from 'react';
import { AuthProvider } from './AuthContext.jsx';
import useSheetsData   from './hooks/useSheetsData';
import ShotTable       from './components/ShotTable.jsx';
import LoginButton     from './components/LoginButton.jsx';

/* 保存済みプリセット用キー（今回は未使用だが維持） */
const LS_KEY = 'motk-shot-presets';

export default function App() {
  /* ---- Sheets 読込 ---- */
  const { shots: initial, fields } = useSheetsData();

  /* 初回読み込みが終わったら setShots。以後は触らない */
  const [shots, setShots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded && initial.length) {
      setShots(initial);
      setLoaded(true);
    }
  }, [initial, loaded]);

  /* ---------- ソート ---------- */
  const [sortKey, setSortKey] = useState('shot_id');
  const [asc,     setAsc]     = useState(true);
  const handleSort = (fid) =>
    fid === sortKey ? setAsc(!asc) : (setSortKey(fid), setAsc(true));

  /* ---------- フィルタ（列=値 の単純一致） ---------- */
  const [filters, setFilters] = useState({});
  const updateFilter = (fid, v) =>
    setFilters((f) => ({ ...f, [fid]: v }));

  /* ---------- 表示行 ---------- */
  const view = useMemo(() => {
    let rows = shots;
    Object.entries(filters).forEach(([fid, v]) => {
      if (v && v !== 'all') rows = rows.filter((r) => r[fid] === v);
    });
    return [...rows].sort((a, b) => {
      const A = a[sortKey] ?? '', B = b[sortKey] ?? '';
      return asc
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A));
    });
  }, [shots, filters, sortKey, asc]);

  return (
    <AuthProvider>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">MOTKsheets2.0 – Shots</h1>
          <LoginButton />
        </div>

        {/* ここにフィルタ UI を後で追加しても OK */}

        <ShotTable
          shots={view}
          fields={fields}
          sortKey={sortKey}
          ascending={asc}
          onSort={handleSort}
          /* ---- ★ 楽観的更新 ---- */
          onCellSave={(id, field, val) =>
            setShots((rows) =>
              rows.map((r) =>
                r.shot_id === id ? { ...r, [field]: val } : r))}
        />
      </div>
    </AuthProvider>
  );
}