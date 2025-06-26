import React from 'react';
import { useNavigate } from 'react-router-dom';
import SaveViewControl from './SaveViewControl';
import FilterPanel from './Filterpanel';
import SavedFilters from './SavedFilters';

const Toolbar = ({ onFilterChange, allShots, fields }) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        // App.jsxで設定したパスに遷移します
        navigate('/shots/new');
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
            <FilterPanel fields={fields} allShots={allShots} onFilterChange={onFilterChange} />
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                    Add New Shot
                </button>
                {/* 以下のコンポーネントは現時点で使用されていないためコメントアウトされています */}
                {/* <SaveViewControl onSave={() => {}} currentFilters={{}} /> */}
                {/* <SavedFilters onSelect={() => {}} /> */}
            </div>
        </div>
    );
};

export default Toolbar;
