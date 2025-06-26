// src/components/ShotTable.jsx — Ver. 9
import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';

export default function ShotTable({
  shots,
  fields,
  sortKey,
  ascending,
  onSort,
  onCellSave,
}) {
  const [editing, setEditing] = useState(null); // {id,fid}

  /* ---------- セル UI ---------- */
  const Cell = ({ row, field }) => {
    const [draft, setDraft] = useState(row[field.field_id] ?? '');
    const inputRef = useRef(null);
    const isEditing =
      editing &&
      editing.id === row.shot_id &&
      editing.fid === field.field_id;

    /* フォーカス保持 */
    useEffect(() => {
      if (isEditing && inputRef.current) inputRef.current.focus();
    }, [isEditing]);

    const commit = (val = draft) => {
      onCellSave(row.shot_id, field.field_id, val);
      setEditing(null);
    };

    if (isEditing) {
      /* ---- select 型 ---- */
      if (field.type === 'select') {
        return (
          <select
            ref={inputRef}
            className="w-full border rounded px-1 py-0.5 text-sm"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              commit(e.target.value);
            }}
            onBlur={() => commit()}
          >
            {field.options.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      /* ---- text 型 ---- */
      return (
        <input
          ref={inputRef}
          className="w-full border rounded px-1 py-0.5 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(null);
          }}
          onBlur={() => commit()}
        />
      );
    }

    /* ------- 通常表示 ------- */
    return (
      <div className="flex items-center group">
        <span className="flex-1">{row[field.field_id] ?? ''}</span>
        {field.editable && (
          <button
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditing({ id: row.shot_id, fid: field.field_id })}
            title="Edit"
          >
            <PencilIcon className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    );
  };

  /* ---------- ヘッダー ---------- */
  const Header = () => (
    <thead>
      <tr className="bg-gray-100 text-left text-sm">
        {fields.map((f) => (
          <th
            key={f.field_id}
            className="px-2 py-1 cursor-pointer select-none"
            onClick={() => onSort(f.field_id)}
          >
            {f.field_name}
            {sortKey === f.field_id && <span>{ascending ? ' ▲' : ' ▼'}</span>}
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full border-collapse text-sm">
        <Header />
        <tbody>
          {shots.map((row) => (
            <tr
              key={row.__rowNum}
              className="even:bg-gray-50 hover:bg-amber-50 group"
            >
              {fields.map((f) => (
                <td
                  key={`${row.__rowNum}-${f.field_id}`}
                  className="px-2 py-1 align-top"
                >
                  <Cell row={row} field={f} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
