import React from 'react';

/**
 * 動的なフィルタリングパネル
 * @param {object[]} fields - 表示・フィルタリング対象のフィールド定義
 * @param {object} filters - 現在のフィルター状態 { field_id: value }
 * @param {function} onFilterChange - フィルターが変更されたときに呼び出される関数
 */
export default function FilterPanel({ fields, filters, onFilterChange }) {
  // フィルター可能なフィールドのみを抽出 (例: text, select)
  const filterableFields = fields.filter(f => ['text', 'select'].includes(f.type));

  const handleInputChange = (fieldId, value) => {
    onFilterChange(fieldId, value);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg flex flex-wrap items-center gap-4">
      <span className="font-semibold text-sm mr-2">Filters:</span>
      {filterableFields.map(field => (
        <div key={field.field_id} className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">{field.field_name}</label>
          {field.type === 'select' ? (
            <select
              value={filters[field.field_id] || ''}
              onChange={(e) => handleInputChange(field.field_id, e.target.value)}
              className="border px-2 py-1 text-sm rounded-md w-40"
            >
              <option value="">All</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder={`Filter by ${field.field_name}...`}
              value={filters[field.field_id] || ''}
              onChange={(e) => handleInputChange(field.field_id, e.target.value)}
              className="border px-2 py-1 text-sm rounded-md w-40"
            />
          )}
        </div>
      ))}
    </div>
  );
}
