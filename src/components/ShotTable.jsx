import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { updateCell } from '../api/updateCell.js';

const sheetId = import.meta.env.VITE_SHEETS_ID;
const tabName = import.meta.env.VITE_TAB_NAME || 'SHOTS';

const EditableCell = ({ shot, field, onSave }) => {
  const { auth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(shot[field.field_id] || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentValue(shot[field.field_id] || '');
  }, [shot, field.field_id]);
  
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);
  
  const canEdit = field.editable && auth.isAuthenticated;

  const handleEditClick = () => { if (canEdit) setIsEditing(true); };
  const handleSave = () => {
    if (isEditing) {
      setIsEditing(false);
      if (currentValue !== (shot[field.field_id] || '')) {
        onSave(shot.shot_id, field.field_id, currentValue);
      }
    }
  };
  const handleCancel = () => {
    setCurrentValue(shot[field.field_id] || '');
    setIsEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };
  
  if (isEditing) {
    const commonProps = {
      ref: inputRef,
      value: currentValue,
      onChange: (e) => setCurrentValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: "w-full bg-gemini-header border border-blue-500 rounded shadow-inner px-2 py-1 text-sm text-gemini-text outline-none",
    };
    if (field.type === 'select') return <select {...commonProps}>{field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>;
    return <input {...commonProps} />;
  }

  const displayValue = shot[field.field_id] || <span className="text-gemini-text-secondary">-</span>;
  
  return (
    <div className={`relative group flex items-center justify-between min-h-[24px] w-full ${canEdit ? 'cursor-pointer rounded -m-2 p-2' : ''}`} onClick={handleEditClick}>
      {field.type === 'image' && shot[field.field_id] ? <img src={shot[field.field_id]} alt={shot.shot_code} className="h-10 w-auto rounded" /> : <span>{displayValue}</span>}
      {field.editable && !auth.isAuthenticated && <span className="text-gemini-text-secondary cursor-not-allowed" title="Sign in to edit">🔒</span>}
      {canEdit && <button className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white" title="Edit">✏️</button>}
    </div>
  );
};

export default function ShotTable({ shots, shotsHeader, fields, sortKey, ascending, onSort, onCellSave }) {
  const { auth } = useAuth();
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

  return (
    <div className="overflow-x-auto bg-gemini-card rounded-lg shadow-lg border border-gemini-border">
      <table className="min-w-full">
        <thead className="bg-gemini-header text-xs uppercase text-gemini-text-secondary select-none">
          <tr>{fields.map((f) => <th key={f.field_id} className="px-4 py-3 text-left font-medium tracking-wider cursor-pointer" onClick={() => onSort && onSort(f.field_id)}>{f.field_name}{sortKey === f.field_id && (ascending ? ' ▲' : ' ▼')}</th>)}</tr>
        </thead>
        <tbody className="text-sm text-gemini-text">
          {shots.map((row, index) => (
            <tr key={row.shot_id} className={index % 2 === 0 ? 'bg-gemini-card' : 'bg-gemini-card-alt'}>
              {fields.map((f) => (
                <td key={f.field_id} className="px-4 py-2 border-t border-gemini-border">
                  {f.field_id === 'shot_code' ? (
                    <Link to={`/shot/${row.shot_id}`} className="text-gemini-link hover:text-gemini-link-hover hover:underline">{row[f.field_id]}</Link>
                  ) : (
                    <EditableCell shot={row} field={f} onSave={save} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
