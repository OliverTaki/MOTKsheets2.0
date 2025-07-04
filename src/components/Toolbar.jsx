import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterManager from './FilterManager';
import FieldManager from './FieldManager';
import ManageViewsDialog from './ManageViewsDialog';
import { Select, MenuItem, FormControl, InputLabel, IconButton, Button } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

const Toolbar = ({
    fields,
    pages,
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
    onLoadView,
    onSaveView,
    onSaveViewAs,
    onDeleteView,
    loadedPageId,
    onOpenUpdateNonUuidIdsDialog,
}) => {
    const navigate = useNavigate();
    const [isManageViewsDialogOpen, setManageViewsDialogOpen] = useState(false);

    const handleAddNew = () => {
        navigate('/shots/new');
    };

    const handlePageChange = (event) => {
        const pageId = event.target.value;
        if (pageId) {
            const selectedPage = pages.find(p => p.page_id === pageId);
            if (selectedPage) {
                onLoadView(selectedPage);
            }
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    {/* Page Selector */}
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="page-select-label">View</InputLabel>
                        <Select
                            labelId="page-select-label"
                            id="page-select"
                            value={loadedPageId || ''}
                            onChange={handlePageChange}
                            label="View"
                        >
                            {pages.map(page => (
                                <MenuItem key={page.page_id} value={page.page_id}>{page.title}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                    <Button
                        variant="outlined"
                        onClick={() => setManageViewsDialogOpen(true)}
                    >
                        Manage Views
                    </Button>
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
                        onClick={onOpenUpdateNonUuidIdsDialog}
                        sx={{ borderColor: 'warning.main', color: 'warning.main', '&:hover': { borderColor: 'warning.dark', color: 'warning.dark' } }}
                    >
                        Update Non-UUID IDs
                    </Button>
                </div>
            </div>
            <ManageViewsDialog
                open={isManageViewsDialogOpen}
                onClose={() => setManageViewsDialogOpen(false)}
                onSave={onSaveView}
                onSaveAs={onSaveViewAs}
                onDelete={onDeleteView}
                loadedPageId={loadedPageId}
                pages={pages}
            />
        </>
    );
};

export default Toolbar;
