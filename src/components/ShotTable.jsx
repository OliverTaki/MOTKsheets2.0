import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { updateCell } from '../api/updateCell.js';

const sheetId = import.meta.env.VITE_SHEETS_ID;
const tabName = import.meta.env.VITE_TAB_NAME || 'SHOTS';

export default function ShotTable({ shots, shotsHeader, fields, sortKey, ascending, onSort, onCellSave }) {
  const { auth } = useAuth();
  // ★★★★★ 編集状態をテーブル全体で管理 ★★★★★
  // { rowId: '...', fieldId: '...' } という形式で、どのセルを編集中かを持つ
  const [editingCell, setEditingCell] = useState(null);

  async function save(shotId, fieldId, value) {
    onCellSave(shotId, fieldId, value);
    const targetShot = shots.find(s => s.shot_id === shotId);
    const colIndex = shotsHeader.indexOf(fieldId);
    if (!targetShot || colIndex === -1) return;
    const rowNum = targetShot.__rowNum;
    let colChar = ''; let n = colIndex; while(n >= 0) { colChar = String.fromCharCode(n % 26 + 65) + colChar; n = Math.floor(n / 26) - 1; }
    const range = `${tabName}!${colChar}${rowNum}`;
    try {
      await updateCell({ sheetId, range, value, token: auth.token?.access_token });
    } catch (e) {
      alert('Save failed: ' + e.message);
      window.location.reload();
    }
  }

  const handleSave = (e, row, field) => {
    setEditingCell(null);
    const newValue = e.target.value;
    if (newValue !== (row[field.field_id] || '')) {
      save(row.shot_id, field.field_id, newValue);
    }
  };

  return (
    <div className="overflow-x-auto bg-gemini-card rounded-lg shadow-lg border border-gemini-border">
      <table className="min-w-full">
        <thead className="bg-gemini-header text-xs uppercase text-gemini-text-secondary select-none">
          <tr>{fields.map((f) => <th key={f.field_id} className="px-4 py-3 text-left font-medium tracking-wider cursor-pointer" onClick={() => onSort && onSort(f.field_id)}>{f.field_name}{sortKey === f.field_id && (ascending ? ' ▲' : ' ▼')}</th>)}</tr>
        </thead>
        <tbody className="text-sm text-gemini-text">
          {shots.map((row, index) => (
            <tr key={row.shot_id} className={index % 2 === 0 ? 'bg-gemini-card' : 'bg-gemini-card-alt'}>
              {fields.map((field) => {
                const isEditing = editingCell?.rowId === row.shot_id && editingCell?.fieldId === field.field_id;
                const canEdit = field.editable && auth.isAuthenticated;

                // ★★★★★ 編集ロジックをここに集約 ★★★★★
                if (isEditing) {
                  if (field.type === 'select') {
                    return (
                      <td key={field.field_id} className="px-4 py-2 border-t border-gemini-border">
                        <select
                          defaultValue={row[field.field_id] || ''}
                          onBlur={(e) => handleSave(e, row, field)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          autoFocus
                          className="w-full bg-gemini-header border border-blue-500 rounded px-2 py-1 text-gemini-text outline-none"
                        >
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                    );
                  }
                  return (
                    <td key={field.field_id} className="px-4 py-2 border-t border-gemini-border">
                      <input
                        type="text"
                        defaultValue={row[field.field_id] || ''}
                        onBlur={(e) => handleSave(e, row, field)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        autoFocus
                        className="w-full bg-gemini-header border border-blue-500 rounded px-2 py-1 text-gemini-text outline-none"
                      />
                    </td>
                  );
                }

                // ★★★★★ 通常表示のセル ★★★★★
                return (
                  <td key={field.field_id} className="px-4 py-2 border-t border-gemini-border">
                    <div 
                      className={`relative group flex items-center min-h-[24px] ${canEdit ? 'cursor-pointer' : ''}`}
                      onClick={() => canEdit && setEditingCell({ rowId: row.shot_id, fieldId: field.field_id })}
                    >
                      {field.field_id === 'shot_code' ? (
                        <Link to={`/shot/${row.shot_id}`} className="text-gemini-link hover:text-gemini-link-hover hover:underline">{row[field.field_id]}</Link>
                      ) : (
                        <span>{row[field.field_id] || '-'}</span>
                      )}
                      {canEdit && <button className="absolute right-0 opacity-0 group-hover:opacity-100 text-gray-400">✏️</button>}
                    </div>
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
