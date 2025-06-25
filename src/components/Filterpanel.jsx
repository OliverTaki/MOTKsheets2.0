import { useState, useEffect } from 'react';

/**
 * props
 *  - fields   : [{ field_id, field_name }, ...]
 *  - filters  : 現在のフィルタ状態 { fieldId: value|'all' }
 *  - onChange : (fieldId, newValue) => void
 */
export default function FilterPanel({ fields, filters, onChange }) {
  const [local, setLocal] = useState(filters);

  /* 外からリセットされた場合に同期 */
  useEffect(() => setLocal(filters), [filters]);

  const handle = (fid, v) => {
    const next = { ...local, [fid]: v };
    setLocal(next);
    onChange(fid, v);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map(({ field_id }) => (
        <input
          key={field_id}
          list={`list-${field_id}`}
          placeholder={field_id}
          className="border px-2 py-1 text-sm w-40"
          value={local[field_id] ?? ''}
          onChange={(e) => handle(field_id, e.target.value || 'all')}
        />
      ))}
    </div>
  );
}
