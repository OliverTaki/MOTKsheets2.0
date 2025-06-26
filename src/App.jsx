import { useState, useEffect, useMemo } from "react";
import { AuthProvider, useRequireAuth } from "./AuthContext.jsx";
import useSheetsData from "./hooks/useSheetsData";
import ShotTable from "./components/ShotTable.jsx";
import LoginButton from "./components/LoginButton.jsx";
import { updateCell } from "./api/updateCell.js";

const LS_KEY = "motk-shot-presets";

export default function App() {
  const { shots: initial, fields, loading, error } = useSheetsData();

  const [shots, setShots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded && initial.length) {
      setShots(initial);
      setLoaded(true);
    }
  }, [initial, loaded]);

  /* ---------- ソート ---------- */
  const [sortKey, setSortKey] = useState("shot_id");
  const [asc, setAsc] = useState(true);
  const handleSort = (fid) =>
    fid === sortKey ? setAsc(!asc) : (setSortKey(fid), setAsc(true));

  /* ---------- フィルタ ---------- */
  const [filters, setFilters] = useState({});
  const updateFilter = (fid, v) => setFilters((f) => ({ ...f, [fid]: v }));

  /* ---------- 表示行 ---------- */
  const view = useMemo(() => {
    let rows = shots;
    Object.entries(filters).forEach(([fid, v]) => {
      if (v && v !== "all") rows = rows.filter((r) => r[fid] === v);
    });
    return [...rows].sort((a, b) => {
      const A = a[sortKey] ?? "";
      const B = b[sortKey] ?? "";
      return asc ? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A));
    });
  }, [shots, filters, sortKey, asc]);

  /* ---------- セル保存 ---------- */
  const sheetId = import.meta.env.VITE_SHEETS_ID;
  const apiKey = import.meta.env.VITE_SHEETS_API_KEY;
  const tabName = import.meta.env.VITE_TAB_NAME || "SHOTS";
  const token = sessionStorage.getItem("motk_access_token");

  const handleSave = async (shotId, fid, val) => {
    setShots((rows) => rows.map((r) => (r.shot_id === shotId ? { ...r, [fid]: val } : r)));
    try {
      const row = shots.find((r) => r.shot_id === shotId);
      if (!row) throw new Error("row not found");
      const rowNum = row.__rowNum;
      const colNum = fields.findIndex((f) => f.field_id === fid) + 1; // 1-based
      await updateCell({ sheetId, tabName, row: rowNum, col: colNum, value: val, token, apiKey });
    } catch (e) {
      console.error(e);
      // TODO: revert on failure or show toast
    }
  };

  const gate = useRequireAuth();
  if (gate) return gate;

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <AuthProvider>
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
        />
      </div>
    </AuthProvider>
  );
}
