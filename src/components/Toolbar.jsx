import React from 'react';
import { useNavigate } from 'react-router-dom';
import SaveViewControl from './SaveViewControl';
import FilterPanel from './Filterpanel';
import SavedFilters from './SavedFilters';

const Toolbar = ({ onFilterChange, allShots, fields, sortKey, ascending, onSort }) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/shots/new');
    };

    return (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <FilterPanel fields={fields} allShots={allShots} onFilterChange={onFilterChange} />
            
            <div className="flex items-center gap-4">
                {/* 新しいソート用ドロップダウン */}
                <div className="flex items-center gap-2">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
                    <select
                        id="sort-by"
                        value={sortKey}
                        onChange={(e) => onSort(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {fields.map(field => (
                            <option key={field.id} value={field.id}>{field.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => onSort(sortKey)} // 現在のキーで方向を切り替え
                        className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        {ascending ? '▲' : '▼'}
                    </button>
                </div>

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
