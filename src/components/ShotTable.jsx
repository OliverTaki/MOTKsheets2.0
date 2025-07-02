import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const ShotTable = ({ shots, fields, columnWidths, onColumnResize, onCellSave, onUpdateFieldOptions }) => {
    const [resizingFieldId, setResizingFieldId] = useState(null);
    const startCursorX = useRef(0);
    const startColumnWidth = useRef(0);
    
    const [editingCell, setEditingCell] = useState(null); // { shotId, fieldId }
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    const handleColResizeMouseDown = (e, fieldId) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingFieldId(fieldId);
        startCursorX.current = e.clientX;
        startColumnWidth.current = columnWidths[fieldId] || 150;
    };

    const handleCellClick = (shotId, fieldId, currentValue) => {
        setEditingCell({ shotId, fieldId });
        setEditValue(currentValue);
    };

    const handleSave = () => {
        if (editingCell) {
            onCellSave(editingCell.shotId, editingCell.fieldId, editValue);
            setEditingCell(null);
        }
    };

    const handleInputBlur = () => {
        handleSave();
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };
    
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            const field = fields.find(f => f.id === editingCell.fieldId);
            if (field?.type === 'select') {
                // For MUI Select, we might need to programmatically open it
                // This is often tricky with native select elements, but MUI's Select might respond better
                // inputRef.current.click(); // This might not work consistently
            }
        }
    }, [editingCell, fields]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingFieldId) return;
            e.preventDefault();
            const deltaX = e.clientX - startCursorX.current;
            const newWidth = startColumnWidth.current + deltaX;
            onColumnResize(resizingFieldId, Math.max(60, newWidth));
        };
        const handleMouseUp = () => setResizingFieldId(null);
        if (resizingFieldId) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingFieldId, onColumnResize]);

    console.log('ShotTable: columnWidths', columnWidths);
    return (
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto', margin: 0 }}>
            <Table stickyHeader sx={{ tableLayout: 'fixed' }} aria-label="shot table">
                <TableHead>
                    <TableRow>
                        {fields.map((field) => {
                            const style = { width: `${columnWidths[field.id] || 150}px` };
                            return (
                                <TableCell
                                    key={field.id}
                                    sx={{
                                        ...style,
                                        py: 1,
                                        px: 1.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative',
                                        userSelect: 'none',
                                        bgcolor: 'background.paper',
                                        width: style.width, // Explicitly set width for fixed layout
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                        <Typography variant="subtitle2" noWrap>{field.label}</Typography>
                                    </Box>
                                    <Box
                                        onMouseDown={(e) => handleColResizeMouseDown(e, field.id)}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            right: -5,
                                            height: '100%',
                                            width: '10px',
                                            cursor: 'col-resize',
                                            zIndex: 2,
                                            '&:hover': {
                                                '& > div': { bgcolor: 'primary.main' }
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '1px', height: '100%', bgcolor: 'divider', mx: 'auto' }} />
                                    </Box>
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {shots.map((shot, rowIndex) => (
                        <TableRow key={shot.shot_id || rowIndex} hover>
                            {fields.map((field) => {
                                const cellValue = shot[field.id];
                                const isEditing = editingCell && editingCell.shotId === shot.shot_id && editingCell.fieldId === field.id;
                                const style = { width: `${columnWidths[field.id] || 150}px` }; // Define style here

                                return (
                                    <TableCell
                                    key={field.id}
                                    sx={{
                                        ...style,
                                        py: 1,
                                        px: 1.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative',
                                        userSelect: 'none',
                                        bgcolor: 'background.paper',
                                        width: style.width, // Explicitly set width for fixed layout
                                    }}
                                >
                                        {isEditing ? (
                                            field.type === 'select' && field.options ? (
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        inputRef={inputRef}
                                                        value={editValue}
                                                        onChange={async (e) => {
                                                            const newValue = e.target.value;
                                                            if (newValue === '__ADD_NEW__') {
                                                                const newOption = prompt('Enter new option:');
                                                                if (newOption) {
                                                                    await onUpdateFieldOptions(field.id, newOption);
                                                                    onCellSave(editingCell.shotId, field.id, newOption);
                                                                    setEditingCell(null); 
                                                                } else {
                                                                    setEditValue(editValue); 
                                                                }
                                                            } else {
                                                                setEditValue(newValue);
                                                            }
                                                        }}
                                                        onBlur={handleInputBlur}
                                                        onKeyDown={handleInputKeyDown}
                                                        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper' }}
                                                    >
                                                        {field.options.split(',').map(option => (
                                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                                        ))}
                                                        <MenuItem value="__ADD_NEW__">Add New...</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <TextField
                                                    inputRef={inputRef}
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleInputBlur}
                                                    onKeyDown={handleInputKeyDown}
                                                    fullWidth
                                                    size="small"
                                                    sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper' }}
                                                />
                                            )
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                                {field.label.toLowerCase() === 'thumbnail' ? (
                                                                                                        cellValue && <img src={cellValue.replace("via.placeholder.com", "placehold.co")} alt={`Thumbnail for ${shot.shot_code}`} style={{ maxHeight: '64px', width: 'auto', objectFit: 'contain', display: 'block' }} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/120x68/EFEFEF/AAAAAA?text=Error'; }} />
                                                ) : field.id === 'shot_code' ? (
                                                    <Link to={`/shot/${shot.shot_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <Typography variant="body2" color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                                            {cellValue}
                                                        </Typography>
                                                    </Link>
                                                ) : (
                                                    <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue}</Typography>
                                                )}
                                                {console.log('Cell Value:', field.id, cellValue)}
                                                {field.id === 'thumbnail' && console.log('Thumbnail src:', cellValue && cellValue.replace("via.placeholder.com", "placehold.co"))}
                                                {field.editable && (
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            color: 'text.secondary',
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            '.MuiTableRow-root:hover &': { opacity: 1 },
                                                            '.MuiTableCell-root:hover &': { opacity: 1 },
                                                        }}
                                                        onClick={() => handleCellClick(shot.shot_id, field.id, cellValue)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ShotTable;