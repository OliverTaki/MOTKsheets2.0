import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const SortableHeaderCell = ({ field, columnWidths, handleColResizeMouseDown }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${columnWidths[field.id] || 150}px`,
  };

  return (
    <TableCell
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        py: 1,
        px: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        userSelect: 'none',
        bgcolor: 'background.paper',
        width: style.width,
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
};

const ShotTable = ({ shots, fields, columnWidths, onColumnResize, onCellSave, onUpdateFieldOptions, onColumnOrderChange }) => {
    const [resizingFieldId, setResizingFieldId] = useState(null);
    const startCursorX = useRef(0);
    const startColumnWidth = useRef(0);
    
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const [isResizing, setIsResizing] = useState(false);

    const [isResizing, setIsResizing] = useState(false);

    const handleDragEnd = (event) => {
      if (isResizing) {
        setIsResizing(false);
        return;
      }
      const { active, over } = event;
      if (active.id !== over.id) {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        onColumnOrderChange(arrayMove(fields, oldIndex, newIndex));
      }
    };

    const handleColResizeMouseDown = (e, fieldId) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
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
        }
    }, [editingCell]);

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

    return (
        <TableContainer component={Paper} sx={{ overflow: 'auto', margin: 0 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table stickyHeader sx={{ tableLayout: 'fixed' }} aria-label="shot table">
                    <TableHead>
                        <TableRow>
                            <SortableContext items={fields.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                                {fields.map((field) => (
                                    <SortableHeaderCell key={field.id} field={field} columnWidths={columnWidths} handleColResizeMouseDown={handleColResizeMouseDown} />
                                ))}
                            </SortableContext>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shots.map((shot, rowIndex) => (
                            <TableRow key={shot.shot_id || rowIndex} hover>
                                {fields.map((field) => {
                                    const cellValue = shot[field.id];
                                    const isEditing = editingCell && editingCell.shotId === shot.shot_id && editingCell.fieldId === field.id;
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
                                                width: style.width,
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
            </DndContext>
        </TableContainer>
    );
};

export default ShotTable;
