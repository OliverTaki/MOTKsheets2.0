import React from 'react';

const FilterPanel = ({ fields, allShots, activeFilters, onFilterChange }) => {

    // 特定のフィールドのユニークな値を取得するヘルパー関数
    const getUniqueValues = (fieldId) => {
        if (!allShots) return [];
        const values = allShots.map(shot => shot && shot[fieldId]).filter(Boolean);
        return [...new Set(values)];
    };

    return (
        // 「Filters:」という地の文を削除し、ドロップダウンメニューを直接配置します
        <div className="flex flex-wrap items-center gap-4">
            {fields
                // `options`列に何か書かれているか、`type`が'select'のフィールドのみをフィルター対象とする
                .filter(field => (field.options && typeof field.options === 'string' && field.options.trim() !== '') || field.type === 'select')
                .map(field => {
                    // `status`のように動的に選択肢を生成するか、`options`列の固定値を使うかを決定
                    const options = field.type === 'select' ? getUniqueValues(field.id) : (field.options || '').split(',').map(s => s.trim());
                    
                    return (
                        <div key={field.id} className="flex items-center gap-2">
                            <label htmlFor={`filter-${field.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}:</label>
                            <select
                                id={`filter-${field.id}`}
                                value={activeFilters[field.id] || ''}
                                onChange={e => onFilterChange(field.id, e.target.value)}
                                className="p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                {options.map(optionValue => (
                                    <option key={optionValue} value={optionValue}>{optionValue}</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
        </div>
    );
};

export default FilterPanel;
