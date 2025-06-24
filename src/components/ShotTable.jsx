import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useAuth }  from '../AuthContext.jsx';
import { updateCell } from '../api/updateCell.js';

const sheetId = import.meta.env.VITE_SHEETS_ID;
const tabName = import.meta.env.VITE_TAB_NAME || 'Sheet1';

export default function ShotTable({
  shots, fields, sortKey, ascending, onSort, onCellSave,
}) {
  const { token }  = useAuth();
  const [editing, setEditing] = useState(null);   // { id, field }

  /* PUT → 失敗時はリロードで巻き戻し */
  async function save(row, field, value) {
    onCellSave(row.shot_id, field, value);        // ① 画面を即更新

    const rowNum = row.__rowNum;
    const colNum = fields.findIndex(f => f.field_id === field) + 1;
    const range  = `${tabName}!${String.fromCharCode(64 + colNum)}${rowNum}`;

    try {
      await updateCell({
        sheetId,
        range,
        value,
        token: token?.access_token,
      });
    } catch {
      alert('Save failed – reloading');
      location.reload();
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-lg select-none">
        <thead className="bg-gray-200 text-xs uppercase">
          <tr>
            {fields.map((f) => (
              <th
                key={f.field_id}
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => onSort && onSort(f.field_id)}
              >
                {f.field_name}
                {sortKey === f.field_id && (ascending ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {shots.map((row) => (
            <tr key={row.shot_id} className="hover:bg-gray-50">
              {fields.map((f) => {
                const isEd =
                  editing &&
                  editing.id === row.shot_id &&
                  editing.field === f.field_id;
                const val = row[f.field_id];

                /* shot_id → 詳細ページリンク */
                if (f.field_id === 'shot_id' && !isEd)
                  return (
                    <td key={f.field_id} className="px-4 py-2">
                      <Link
                        to={`/shot/${row.shot_id}`}
                        className="text-blue-600 underline"
                      >
                        {val}
                      </Link>
                    </td>
                  );

                return (
                  <td key={f.field_id} className="px-4 py-2 relative group">
                    {isEd ? (
                      <input
                        className="border px-1 text-sm w-full"
                        defaultValue={val}
                        autoFocus
                        onBlur={(e) => {
                          const v = e.target.value;
                          setEditing(null);
                          if (v !== val) save(row, f.field_id, v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    ) : (
                      <>
                        {val}
                        {/* 鉛筆アイコン */}
                        {token && (
                          <button
                            className="absolute right-1 top-1/2 -translate-y-1/2
                                       opacity-0 group-hover:opacity-70"
                            title="Edit"
                            onClick={() =>
                              setEditing({ id: row.shot_id, field: f.field_id })}
                          >
                            ✏
                          </button>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}