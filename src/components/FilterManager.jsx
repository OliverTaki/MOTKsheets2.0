import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

// 各フィルターセクション（例：Shooting Status）のコンポーネント
const FilterSection = ({ title, options, selectedValues, onFilterChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 py-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-800 dark:text-gray-200"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="mt-2 pl-2 space-y-2">
                    {options.map(option => (
                        <label key={option} className="flex items-center text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                                checked={selectedValues.includes(option)}
                                onChange={() => onFilterChange(option)}
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};


const FilterManager = ({ fields, allShots, activeFilters, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // ポップアップの外側をクリックしたら閉じる
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // フィルター可能なフィールドを定義
    const filterableFields = fields.filter(f => f.type === 'select' || (f.options && f.options.trim() !== ''));

    // 各フィールドのユニークな値を取得
    const getUniqueValues = (fieldId) => {
        const field = fields.find(f => f.id === fieldId);
        if (field && field.options) {
            return field.options.split(',').map(s => s.trim());
        }
        return [...new Set(allShots.map(shot => shot[fieldId]).filter(Boolean))];
    };

    const handleCheckboxChange = (fieldId, value) => {
        const currentSelection = activeFilters[fieldId] || [];
        const newSelection = currentSelection.includes(value)
            ? currentSelection.filter(v => v !== value)
            : [...currentSelection, value];
        onFilterChange(fieldId, newSelection);
    };
    
    const clearAllFilters = () => {
        onFilterChange(null, {}); // 全てのフィルターをリセット
    };
    
    const activeFilterCount = Object.values(activeFilters).flat().length;

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
                Filter
                {activeFilterCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                    <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filter by</h3>
                            <button 
                                onClick={clearAllFilters}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {filterableFields.map(field => (
                                <FilterSection
                                    key={field.id}
                                    title={field.label}
                                    options={getUniqueValues(field.id)}
                                    selectedValues={activeFilters[field.id] || []}
                                    onFilterChange={(value) => handleCheckboxChange(field.id, value)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterManager;
