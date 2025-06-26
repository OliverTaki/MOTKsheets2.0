import React, { useState, useEffect } from 'react';

const FilterPanel = ({ fields, allShots, onFilterChange }) => {
    const [activeFilters, setActiveFilters] = useState({});

    useEffect(() => {
        if (Object.keys(activeFilters).length === 0) {
            onFilterChange(allShots);
            return;
        }

        const filtered = allShots.filter(shot => {
            return Object.entries(activeFilters).every(([fieldId, value]) => {
                if (!value) return true;
                return String(shot[fieldId]) === String(value);
            });
        });
        onFilterChange(filtered);
    }, [activeFilters, allShots, onFilterChange]);


    const handleFilterChange = (fieldId, value) => {
        setActiveFilters(prev => ({ ...prev, [fieldId]: value }));
    };

    // 特定のフィールドのユニークな値を取得する（statusなどに使用）
    const getUniqueValues = (fieldId) => {
        if (!allShots) return [];
        const values = allShots.map(shot => shot && shot[fieldId]).filter(Boolean);
        return [...new Set(values)];
    };


    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Filters:</span>
            {fields
                // options列に何か書かれているか、typeが'select'のフィールドのみをフィルター対象とする
                .filter(field => (field.options && typeof field.options === 'string' && field.options.trim() !== '') || field.type === 'select')
                .map(field => {
                    // statusのように動的に選択肢を生成するか、options列の固定値を使うかを決定
                    const options = field.type === 'select' ? getUniqueValues(field.id) : (field.options || '').split(',').map(s => s.trim());
                    
                    return (
                        <div key={field.id} className="flex items-center">
                            <label htmlFor={field.id} className="mr-2 text-sm text-gray-600 dark:text-gray-400">{field.label}:</label>
                            <select
                                id={field.id}
                                value={activeFilters[field.id] || ''}
                                onChange={e => handleFilterChange(field.id, e.target.value)}
                                className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
