import React, { useState, useEffect, useRef, useContext } from 'react';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';

const FieldManager = ({ visibleFieldIds = [], onVisibilityChange, onAddField }) => {
    const { fields: allFields } = useContext(SheetsDataContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [newField, setNewField] = useState({
        label: '',
        type: 'text',
        editable: true,
        options: ''
    });

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAddFieldClick = () => {
        if (newField.label.trim()) {
            const fieldToAdd = { ...newField, id: crypto.randomUUID() }; // Always generate a unique ID
            onAddField(fieldToAdd);
            setNewField({ label: '', type: 'text', editable: true, options: '' });
            // Optionally close the menu after adding a field
            // handleClose();
        }
    };

    return (
        <div>
            <Button
                id="fields-button"
                aria-controls={open ? 'fields-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant="outlined"
                sx={{
                    borderColor: 'gray',
                    color: 'gray',
                    '&:hover': {
                        borderColor: 'darkgray',
                        color: 'darkgray',
                    },
                }}
            >
                Fields
            </Button>
            <Menu
                id="fields-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'fields-button',
                }}
                PaperProps={{
                    sx: {
                        width: 320, // Fixed width for the fields menu
                        maxHeight: 450, // Max height for scrollability
                        bgcolor: 'background.paper', // Use MUI theme background
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Manage Fields</Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                        {allFields.map(field => (
                            <MenuItem key={field.id} disableRipple sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0 }}>
                                <Typography variant="body2">{field.label}</Typography>
                                <IconButton onClick={() => onVisibilityChange(field.id)} size="small">
                                    {visibleFieldIds.includes(field.id) ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                                </IconButton>
                            </MenuItem>
                        ))}
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Add New Field</Typography>
                    <TextField
                        fullWidth
                        label="Field Name"
                        variant="outlined"
                        size="small"
                        value={newField.label}
                        onChange={e => setNewField({...newField, label: e.target.value})}
                        sx={{ mb: 1 }}
                    />
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={newField.type}
                            label="Type"
                            onChange={e => {
                                const type = e.target.value;
                                setNewField(prev => ({
                                    ...prev,
                                    type,
                                    editable: type === 'calculated' ? false : prev.editable // Set editable to false if type is calculated
                                }));
                            }}
                        >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="url">URL</MenuItem>
                            <MenuItem value="checkbox">Checkbox</MenuItem>
                            <MenuItem value="timecode">Timecode (24fps)</MenuItem>
                            <MenuItem value="calculated">Calculated (Read-only)</MenuItem>
                            <MenuItem value="linkToEntity">Link to Entity</MenuItem>
                            <MenuItem value="select">Select</MenuItem>
                            <MenuItem value="image">Image</MenuItem>
                        </Select>
                    </FormControl>
                    {newField.type === 'select' && (
                        <TextField
                            fullWidth
                            label="Options (comma-separated)"
                            variant="outlined"
                            size="small"
                            value={newField.options}
                            onChange={e => setNewField({...newField, options: e.target.value})}
                            sx={{ mb: 1 }}
                        />
                    )}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newField.editable}
                                onChange={e => setNewField({...newField, editable: e.target.checked})}
                                size="small"
                                disabled={newField.type === 'calculated'} // Disable if type is calculated
                            />
                        }
                        label="Editable"
                        sx={{ mb: 1 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddFieldClick}
                    >
                        Add
                    </Button>
                </Box>
            </Menu>
        </div>
    );
};

export default FieldManager;