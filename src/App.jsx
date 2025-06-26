// src/App.jsx  (V8 – stable token‑aware + ID patch)

import { useState, useEffect, useMemo } from 'react';
import { useRequireAuth } from './AuthContext';
import useSheetsData from './hooks/useSheetsData';
import ShotTable from './components/ShotTable.jsx';
import LoginButton from './components/LoginButton.jsx';
import { updateCell } from './api/updateCell.js';
import { detectAndPatchIds } from './utils/missingIdHandler.js';

const LS_KEY = 'motk-shot-presets';

export default function App() {
  /* ---------------- Auth ---------------- */
  const { user, loading: authLoading, signIn, token } = useRequireAuth();

  /* ---------------- Sheets ---------------- */
  const {
    shots: initial,
    fields,
    loading: sheetLoading,
    error,
    mutate: refreshSheets,
  } = useSheetsData();

  const [shots, setShots] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && initial.length) {
      setShots(initial);
      setLoaded(true);
    }
  }, [initial, loaded]);

  /* ➊ ID 欠落行を検出し即パッチ ------------------------------ */
  const sheetId = import.meta.env.VITE_SHEETS_ID;
  const tabName = import.meta.env.VITE_TAB_NAME || 'SHOTS';
  const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

  useEffect(() => {
    if (!token || !loaded) return;
    (async () => {
      const patched = await detectAndPatchIds(shots, sheetId, tabName, token);
      if (patched) refreshSheets();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loaded]);

  /* ---------------- Sort ---------------- */
  const [sortKey, setSortKey] = useState('shot_id');
  const [asc, setAsc] = useState(true);
  const handleSort = (fid) =>
    fid === sortKey ? setAsc(!asc) : (setSortKey(fid), setAsc(true));

  /* ---------------- Filter ---------------- */
  const [filters, setFilters] = useState({});
  const updateFilter = (fid, v) => setFilters((f) => ({ ...f, [fid]: v }));

  /* ---------------- View ---------------- */
  const view = useMemo(() => {
    let rows = shots;
    Object.entries(filters).forEach(([fid, v]) => {
      if (v && v !== 'all') rows = rows.filter((r) => r[fid] === v);
    });
    return [...rows].sort((a, b) => {
      const A = a[sortKey] ?? '';
      const B = b[sortKey] ?? '';
      return asc
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A));
    });
  }, [shots, filters, sortKey, asc]);

  /* ---------------- Save Cell ---------------- */
  const handleSave = async (shotId, fid, val) => {
    setShots((rows) => rows.map((r) => (r.shot_id === shotId ? { ...r, [fid]: val } : r)));
    try {
      const row = shots.find((r) => r.shot_id === shotId);
      if (!row) throw new Error('row not found');
      const rowNum = row.__rowNum;
      const colNum = fields.findIndex((f) => f.field_id === fid) + 1; // 1‑based
      await updateCell({ sheetId, tabName, row: rowNum, col: colNum, value: val, token, apiKey });
    } catch (e) {
      console.error(e);
      // TODO: revert on failure or show toast
    }
  };

  /* ---------------- Gate ---------------- */
  if (authLoading || sheetLoading) return <div className="p-8 text-center">Loading…</div>;
  if (!user)
    return (
      <div className="p-8 text-center">
        <button
          onClick={signIn}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Sign in
        </button>
      </div>
    );
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MOTKsheets2.0 – Shots</h1>
        <LoginButton />
      </div>
      <ShotTable
        shots={view}
        fields={fields}
        sortKey={sortKey}
        ascending={asc}
        onSort={handleSort}
        onCellSave={handleSave}
        updateFilter={updateFilter}
      />
    </div>
  );
}
