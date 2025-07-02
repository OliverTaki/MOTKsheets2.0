import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';

const FilterSection = ({ title, options, selectedValues, onFilterChange }) => {
    const [expanded, setExpanded] = useState(true);

    const handleChange = () => {
        setExpanded(!expanded);
    };

    return (
        <Accordion expanded={expanded} onChange={handleChange} sx={{ boxShadow: 'none', '&:before': { display: 'none' }, '&.Mui-expanded': { margin: '0' } }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${title}-content`}
                id={`${title}-header`}
                sx={{ minHeight: '48px', '&.Mui-expanded': { minHeight: '48px' }, '.MuiAccordionSummary-content': { margin: '12px 0' } }}
            >
                <Typography variant="subtitle1">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '0 16px 8px' }}>
                {options.map(option => (
                    <FormControlLabel
                        key={option}
                        control={
                            <Checkbox
                                size="small"
                                checked={selectedValues.includes(option)}
                                onChange={() => onFilterChange(option)}
                            />
                        }
                        label={<Typography variant="body2">{option}</Typography>}
                    />
                ))}
            </AccordionDetails>
        </Accordion>
    );
};

const FilterManager = ({ fields, allShots, activeFilters, onFilterChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const filterableFields = fields.filter(f => f.type === 'select' || (f.options && f.options.trim() !== ''));

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
        onFilterChange(null, {});
        handleClose(); // Close menu after clearing filters
    };

    const activeFilterCount = Object.values(activeFilters).flat().length;

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
                        width: 280, // Fixed width for the filter menu
                        maxHeight: 400, // Max height for scrollability
                        bgcolor: 'background.paper', // Use MUI theme background
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <MenuItem disableRipple sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6">Filter by</Typography>
                    <Button onClick={clearAllFilters} size="small">Clear all</Button>
                </MenuItem>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
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
            </Menu>
        </div>
    );
};

export default FilterManager;