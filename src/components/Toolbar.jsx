import React from 'react';
import { useNavigate } from 'react-router-dom';
import FilterManager from './FilterManager';
import FieldManager from './FieldManager';
import { Select, MenuItem, FormControl, InputLabel, IconButton, Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

// 全ての機能に必要なpropsを受け取るように修正
const Toolbar = ({
    fields,
    activeFilters,
    onFilterChange, // setActiveFiltersからonFilterChangeに変更
    allShots,
    sortKey,
    ascending,
    onSort,
    visibleFieldIds,
    onVisibilityChange,
    onAddField,
    onUpdateNonUuidIds
}) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/shots/new');
    };

    return (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
                {/* フィルター機能 */}
                <FilterManager
                    fields={fields}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange} // 正しいpropを渡す
                    allShots={allShots}
                />
                {/* ソート機能 */}
                <div className="flex items-center gap-2">
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="sort-by-label">Sort by</InputLabel>
                        <Select
                            labelId="sort-by-label"
                            id="sort-by"
                            value={sortKey || ''}
                            label="Sort by"
                            onChange={(e) => onSort(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {fields.map(field => (
                                <MenuItem key={field.id} value={field.id}>{field.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <IconButton
                        onClick={() => onSort(sortKey)}
                        disabled={!sortKey}
                        color="primary"
                    >
                        {ascending ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                    </IconButton>
                </div>
                {/* フィールド管理機能 */}
                <FieldManager 
                    allFields={fields}
                    visibleFieldIds={visibleFieldIds}
                    onVisibilityChange={onVisibilityChange}
                    onAddField={onAddField}
                />
            </div>
            
            <div className="flex items-center gap-4">
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                >
                    Add New Shot
                </Button>
                <Button
                    variant="outlined"
                    onClick={onUpdateNonUuidIds}
                    sx={{ borderColor: 'warning.main', color: 'warning.main', '&:hover': { borderColor: 'warning.dark', color: 'warning.dark' } }}
                >
                    Update Non-UUID IDs
                </Button>
            </div>
        </div>
    );
};

export default Toolbar;
