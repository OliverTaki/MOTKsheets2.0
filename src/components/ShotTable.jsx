import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Box, Typography, Checkbox } from '@mui/material';

import dayjs from 'dayjs';
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

const ShotTable = ({ shots, fields, visibleFieldIds, columnWidths, onColumnResize, onCellSave, onUpdateFieldOptions, onColumnOrderChange }) => {
    const [resizingFieldId, setResizingFieldId] = useState(null);
    const startCursorX = useRef(0);
    const startColumnWidth = useRef(0);
    
    const [editingCell, setEditingCell] = useState(null);
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

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
        console.log("handleCellClick - shotId:", shotId, "fieldId:", fieldId, "currentValue:", currentValue);
        setEditingCell({ shotId, fieldId });
        setValue(currentValue);
    };

    const commit = () => {
        if (editingCell) {
            let valueToSave = value;
            // Parse MM/DD/YYYY and format to YYYY-MM-DD
            const parsedDate = dayjs(value, 'MM/DD/YYYY');
            if (parsedDate.isValid()) {
                valueToSave = parsedDate.format('YYYY-MM-DD');
            } else {
                valueToSave = ''; // Save empty string if invalid
            }
            console.log("commit called. editingCell:", editingCell, "valueToSave:", valueToSave);
            onCellSave(editingCell.shotId, editingCell.fieldId, valueToSave);
            setEditingCell(null);
        }
    };

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

    const totalColumnWidth = useMemo(() => {
        return fields.reduce((sum, field) => sum + (columnWidths[field.id] || 150), 0);
    }, [fields, columnWidths]);

    return (
        <TableContainer
            component={Paper}
            sx={{
                display: 'inline-block',
                overflowX: 'auto',
                overflowY: 'visible',
                flex: 'none',
                alignSelf: 'flex-start',
            }}
        >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: totalColumnWidth }} aria-label="shot table">
                    <TableHead sx={{ '& th': { bgcolor: 'background.paper' } }}>
                        <TableRow
                            sx={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 3,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <SortableContext items={fields.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                                {fields.map((field) => (
                                    visibleFieldIds.includes(field.id) && <SortableHeaderCell key={field.id} field={field} columnWidths={columnWidths} handleColResizeMouseDown={handleColResizeMouseDown} />
                                ))}
                            </SortableContext>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shots.map((shot, rowIndex) => (
                            <TableRow key={shot.shot_id || rowIndex} hover>
                                {fields.map((field) => {
                                    if (!visibleFieldIds.includes(field.id)) return null;
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
                                                            value={value}
                                                            onChange={async (e) => {
                                                                const newValue = e.target.value;
                                                                if (newValue === '__ADD_NEW__') {
                                                                    const newOption = prompt('Enter new option:');
                                                                    if (newOption) {
                                                                        await onUpdateFieldOptions(field.id, newOption);
                                                                        onCellSave(editingCell.shotId, field.id, newOption);
                                                                        setEditingCell(null); 
                                                                    } else {
                                                                        setValue(value); 
                                                                    }
                                                                } else {
                                                                    setValue(newValue);
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
                                                ) : field.type === 'date' ? (
                                                    <TextField
                                                        placeholder="MM/DD/YYYY"
                                                        value={value}
                                                        autoFocus
                                                        inputProps={{ maxLength: 10 }}
                                                        onChange={e => {
                                                            let v = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
                                                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                                                            if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
                                                            setValue(v);
                                                        }}
                                                        onBlur={commit}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                commit();
                                                                e.target.blur();
                                                            }
                                                        }}
                                                        fullWidth
                                                        size="small"
                                                        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper' }}
                                                    />
                                                ) : field.type === 'number' || field.type === 'url' || field.type === 'timecode' || field.type === 'linkToEntity' ? (
                                                    <TextField
                                                        inputRef={inputRef}
                                                        type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        onBlur={handleInputBlur}
                                                        onKeyDown={handleInputKeyDown}
                                                        fullWidth
                                                        size="small"
                                                        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper' }}
                                                    />
                                                ) : field.type === 'checkbox' ? (
                                                    <Checkbox
                                                        inputRef={inputRef}
                                                        checked={value === 'TRUE'}
                                                        onChange={(e) => setValue(e.target.checked ? 'TRUE' : 'FALSE')}
                                                        onBlur={handleInputBlur}
                                                        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.paper' }}
                                                    />
                                                ) : (
                                                    <TextField
                                                        inputRef={inputRef}
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
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
                                                        <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue}</Typography>
                                                    ) : field.type === 'date' ? (
                                                        <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue ? dayjs(cellValue).format('YYYY-MM-DD') : ''}</Typography>
                                                    ) : field.type === 'number' || field.type === 'timecode' || field.type === 'calculated' || field.type === 'linkToEntity' ? (
                                                        <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue}</Typography>
                                                    ) : field.type === 'url' ? (
                                                        <a href={cellValue} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                                            <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue}</Typography>
                                                        </a>
                                                    ) : field.type === 'checkbox' ? (
                                                        <Checkbox checked={cellValue === 'TRUE'} disabled size="small" />
                                                    ) : (
                                                        <Typography variant="body2" color="text.primary" title={cellValue}>{cellValue}</Typography>
                                                    )}
                                                    {field.editable && field.type !== 'calculated' && (
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
