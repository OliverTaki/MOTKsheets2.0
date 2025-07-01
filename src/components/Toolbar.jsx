import React from 'react';
import { useNavigate } from 'react-router-dom';
import FilterManager from './FilterManager'; // 新しい設計のFilterManagerをインポート

// onSort, sortKey, ascending をpropsとして受け取ります
const Toolbar = ({ fields, activeFilters, onFilterChange, allShots, onSort, sortKey, ascending }) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/shots/new');
    };

    return (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
                {/* 新しいFilterManagerを呼び出します */}
                <FilterManager
                    fields={fields}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                    allShots={allShots}
                />
                {/* ソート機能 */}
                <div className="flex items-center gap-2">
                    <select
                        id="sort-by"
                        value={sortKey || ''}
                        onChange={(e) => onSort(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>Sort by...</option>
                        {fields.map(field => (
                            <option key={field.id} value={field.id}>{field.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => onSort(sortKey)}
                        disabled={!sortKey}
                        className="p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {ascending ? '▲' : '▼'}
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                    Add New Shot
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
