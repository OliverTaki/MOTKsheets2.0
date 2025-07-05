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
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'visible',
                flex: 'none',
                alignSelf: 'flex-start',
            }}
        >
            <Table stickyHeader>
