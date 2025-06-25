import { useState } from 'react';

/**
 * props
 *  - saved     : { name: filterObj }
 *  - onApply   : (filterObj) => void
 *  - onSave    : (name) => void   // 現在の filters を保存
 *  - onDelete  : (name) => void
 */
export default function SavedFilters({ saved, onApply, onSave, onDelete }) {
  const [pick, setPick] = useState('');
  const [newName, setNewName] = useState('');

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* --- apply / delete --- */}
      <select
        className="border px-2 py-1 text-sm"
        value={pick}
        onChange={(e) => setPick(e.target.value)}
      >
        <option value="">Select preset...</option>
        {Object.keys(saved).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <button
        className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
        disabled={!pick}
        onClick={() => onApply(saved[pick])}
      >
        Apply
      </button>

      <button
        className="px-2 py-1 text-sm bg-red-600 text-white rounded"
        disabled={!pick}
        onClick={() => { onDelete(pick); setPick(''); }}
      >
        Delete
      </button>

      {/* --- save current --- */}
      <input
        placeholder="new preset name"
        className="border px-2 py-1 text-sm"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <button
        className="px-2 py-1 text-sm bg-green-600 text-white rounded"
        disabled={!newName}
        onClick={() => { onSave(newName); setNewName(''); }}
      >
        Save current
      </button>
    </div>
  );
}
