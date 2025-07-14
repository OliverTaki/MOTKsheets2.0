import React, { useState, useContext } from 'react';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

const FilterManager = ({ activeFilters = {}, onFilterChange, fields = [] }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const filterableFields = fields.filter(f => f.id !== 'shot_id' && f.label.toLowerCase() !== 'shot id');

    const handleToggleFilter = (fieldId, isChecked) => {
        if (isChecked) {
            // Add a default filter rule when checked
            onFilterChange(fieldId, { operator: 'is', value: '' });
        } else {
            // Remove the filter rule when unchecked
            const newFilters = { ...activeFilters };
            delete newFilters[fieldId];
            onFilterChange(null, newFilters); // Pass null for fieldId to indicate a full filter object update
        }
    };

    const handleRuleChange = (fieldId, key, value) => {
        onFilterChange(fieldId, { ...activeFilters[fieldId], [key]: value });
    };

    const clearAllFilters = () => {
        onFilterChange(null, {});
        handleClose();
    };

    const activeFilterCount = Object.keys(activeFilters).length;

    const getOperators = (fieldType) => {
        if (fieldType === 'select') {
            return ['is', 'is not'];
        } else {
            return ['is', 'is not', 'contains', 'does not contain'];
        }
    };

    return (
        <div>
            <Button
                id="filter-button"
                aria-controls={open ? 'filter-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant="outlined"
                startIcon={<FilterListIcon />}
                sx={{
                    borderColor: 'gray',
                    color: 'gray',
                    '&:hover': {
                        borderColor: 'darkgray',
                        color: 'darkgray',
                    },
                }}
            >
                Filter
                {activeFilterCount > 0 && (
                    <Typography component="span" sx={{ ml: 1, px: 1, py: 0.5, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', fontSize: '0.75rem' }}>
                        {activeFilterCount}
                    </Typography>
                )}
            </Button>
            <Menu
                id="filter-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'filter-button',
                }}
                PaperProps={{
                    sx: {
                        width: 350,
                        maxHeight: 500,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <MenuItem disableRipple sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6">Filter by</Typography>
                    <Button onClick={clearAllFilters} size="small">Clear all</Button>
                </MenuItem>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {filterableFields.map(field => (
                        <Accordion key={field.id} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!activeFilters[field.id]}
                                            onChange={(e) => handleToggleFilter(field.id, e.target.checked)}
                                            onClick={(e) => e.stopPropagation()} // Prevent accordion from expanding when clicking checkbox
                                        />
                                    }
                                    label={<Typography variant="subtitle1">{field.label}</Typography>}
                                    sx={{ margin: 0, '& .MuiFormControlLabel-label': { marginLeft: '4px' } }}
                                />
                            </AccordionSummary>
                            <AccordionDetails>
                                {activeFilters[field.id] && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Select
                                            value={activeFilters[field.id].operator}
                                            onChange={(e) => handleRuleChange(field.id, 'operator', e.target.value)}
                                            size="small"
                                        >
                                            {getOperators(field.type).map(op => (
                                                <MenuItem key={op} value={op}>{op}</MenuItem>
                                            ))}
                                        </Select>
                                        {field.type === 'select' ? (
                                            <Select
                                                value={activeFilters[field.id].value}
                                                onChange={(e) => handleRuleChange(field.id, 'value', e.target.value)}
                                                size="small"
                                                sx={{ flexGrow: 1 }}
                                            >
                                                {(field.options || '').split(',').map(opt => (
                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                ))}
                                            </Select>
                                        ) : (
                                            <TextField
                                                value={activeFilters[field.id].value}
                                                onChange={(e) => handleRuleChange(field.id, 'value', e.target.value)}
                                                size="small"
                                                sx={{ flexGrow: 1 }}
                                            />
                                        )}
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </div>
            </Menu>
        </div>
    );
};

export default FilterManager;
