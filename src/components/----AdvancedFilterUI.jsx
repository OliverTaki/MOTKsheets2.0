import React, { useState } from 'react';

/**
 * フィルター条件を管理するための単一の行コンポーネント
 */
const FilterRow = ({ rule, fields, onUpdate, onRemove }) => {
  const selectedField = fields.find(f => f.field_id === rule.field_id) || {};
  const operators = {
    text: ['contains', 'does not contain', 'is', 'is not'],
    select: ['is', 'is not'],
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded">
      {/* Field Selection */}
      <select
        value={rule.field_id}
        onChange={e => onUpdate({ ...rule, field_id: e.target.value, value: '' })}
        className="border px-2 py-1 text-sm rounded-md"
      >
        <option value="">Select Field...</option>
        {fields.map(f => <option key={f.field_id} value={f.field_id}>{f.field_name}</option>)}
      </select>

      {/* Operator Selection */}
      <select
        value={rule.operator}
        onChange={e => onUpdate({ ...rule, operator: e.target.value })}
        className="border px-2 py-1 text-sm rounded-md"
        disabled={!rule.field_id}
      >
        {(operators[selectedField.type] || ['is']).map(op => <option key={op} value={op}>{op}</option>)}
      </select>

      {/* Value Input */}
      {selectedField.type === 'select' ? (
        <select
          value={rule.value}
          onChange={e => onUpdate({ ...rule, value: e.target.value })}
          className="border px-2 py-1 text-sm rounded-md w-40"
          disabled={!rule.field_id}
        >
          <option value="">Select Value...</option>
          {selectedField.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={rule.value}
          onChange={e => onUpdate({ ...rule, value: e.target.value })}
          className="border px-2 py-1 text-sm rounded-md w-40"
          disabled={!rule.field_id}
        />
      )}
      
      <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-lg">×</button>
    </div>
  );
};

/**
 * 複数のフィルター条件を管理するUI全体
 */
export default function AdvancedFilterUI({ fields, onApplyFilters }) {
  const [rules, setRules] = useState([{ id: 1, field_id: '', operator: 'is', value: '' }]);

  const updateRule = (index, updatedRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    setRules(newRules);
    onApplyFilters(newRules.filter(r => r.field_id && r.value));
  };

  const addRule = () => {
    setRules([...rules, { id: Date.now(), field_id: '', operator: 'is', value: '' }]);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    onApplyFilters(newRules.filter(r => r.field_id && r.value));
  };

  const filterableFields = fields.filter(f => ['text', 'select'].includes(f.type));

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-3">
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <FilterRow
            key={rule.id}
            rule={rule}
            fields={filterableFields}
            onUpdate={(updatedRule) => updateRule(index, updatedRule)}
            onRemove={() => removeRule(index)}
          />
        ))}
      </div>
      <button
        onClick={addRule}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + Add Filter
      </button>
    </div>
  );
}
