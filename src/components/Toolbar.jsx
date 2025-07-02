import React from 'react';
import { useNavigate } from 'react-router-dom';
import FilterManager from './FilterManager';
import FieldManager from './FieldManager';
import SaveViewControl from './SaveViewControl'; // Import SaveViewControl
import { Select, MenuItem, FormControl, InputLabel, IconButton, Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

// Add props for SaveViewControl
const Toolbar = ({
    fields,
    activeFilters,
    onFilterChange,
    allShots,
    sortKey,
    ascending,
    onSort,
    visibleFieldIds,
    onVisibilityChange,
    onAddField,
    onUpdateNonUuidIds,
    columnWidths, // Pass columnWidths
    onSaveView,   // Pass onSaveView
}) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/shots/new');
    };

    return (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
                {/* Filter Manager */}
                <FilterManager
                    fields={fields}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                    allShots={allShots}
                />
                {/* Sort Controls */}
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
                {/* Field Manager */}
                <FieldManager 
                    allFields={fields}
                    visibleFieldIds={visibleFieldIds}
                    onVisibilityChange={onVisibilityChange}
                    onAddField={onAddField}
                />
            </div>
            
            <div className="flex items-center gap-4">
                {/* Save View Control */}
                <SaveViewControl
                    columnWidths={columnWidths}
                    visibleFieldIds={visibleFieldIds}
                    activeFilters={activeFilters}
                    sortKey={sortKey}
                    ascending={ascending}
                    onSave={onSaveView}
                />
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
