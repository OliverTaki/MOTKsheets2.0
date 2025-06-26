// src/hooks/useSheetsData.js – v4 (Bearer→fallback API‑key)
//-----------------------------------------------------------------
import { useState, useEffect } from "react";

export default function useSheetsData() {
  const [fields, setFields] = useState([]);
  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sheetId = import.meta.env.VITE_SHEETS_ID;
  const tabName = import.meta.env.VITE_TAB_NAME || "SHOTS";
  const token   = sessionStorage.getItem("motk_access_token");
  const apiKey  = import.meta.env.VITE_SHEETS_API_KEY;

  /* fetch helper – tries Bearer first, falls back to API‑key if 401/403 */
  const fetchRange = async (range) => {
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
    /* 1) Bearer */
    if (token) {
      const r = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) return r.json();
      if (r.status !== 401 && r.status !== 403) throw new Error(r.status);
    }
    /* 2) API key */
    const r2 = await fetch(base + `?key=${apiKey}`);
    if (!r2.ok) throw new Error(r2.status);
    return r2.json();
  };

  useEffect(() => {
    if (!sheetId) return;
    setLoading(true);

    Promise.all([
      fetchRange("FIELDS!A1:Z"),
      fetchRange(`${tabName}!A1:Z`),
    ])
      .then(([fjson, sjson]) => {
        if (!fjson.values) throw new Error("FIELDS empty");
        const [fh, ...frows] = fjson.values;
        const idx = (k) => fh.indexOf(k);
        setFields(
          frows.map((r) => ({
            field_id: r[idx("field_id")],
            field_name: r[idx("field_name")],
            type: r[idx("type")] || "text",
            editable: String(r[idx("editable")]).toLowerCase() === "true",
            options: (r[idx("options")] || "").split(/,/).filter(Boolean),
          }))
        );

        if (!sjson.values) throw new Error("SHOTS empty");
        const [sh, ...srows] = sjson.values;
        setShots(
          srows.map((row, i) =>
            sh.reduce((o, key, col) => ({ ...o, [key]: row[col], __rowNum: i + 2 }), {})
          )
        );
        setError(null);
      })
      .catch((e) => setError(`Failed to fetch Sheets data: ${e.message}`))
      .finally(() => setLoading(false));
  }, [sheetId, tabName, token]);

  return { fields, shots, loading, error };
}
