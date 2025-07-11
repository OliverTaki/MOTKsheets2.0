// src/components/ShotTable.jsx
import React, { useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select, MenuItem, Checkbox
} from "@mui/material";
import Box from "@mui/material/Box";
import EditIcon from '@mui/icons-material/Edit';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy
} from "@dnd-kit/sortable";
import SortableHeaderCell from "./SortableHeaderCell";

export default React.memo(function ShotTable(props) {
  const {
    shots = [],
    fields: rawFields = [],
    columnWidths = {},
    visibleFieldIds = [],
    showFilters = false,
    handleDragEnd,
    handleColResizeMouseDown,
    onCellSave, // Ensure onCellSave is destructured
    handleCellSave, // Add handleCellSave to destructured props
  } = props;

  const fields = Array.isArray(rawFields) ? rawFields : Object.values(rawFields);

  const tableWidth = useMemo(
    () =>
      visibleFieldIds.reduce(
        (sum, fieldId) => sum + (columnWidths[fieldId] ?? 150),
        0
      ),
    [visibleFieldIds, columnWidths]
  );

  const sensors = useSensors(useSensor(PointerSensor));
  const HEAD_H = 56;

  

  const [editingCell, setEditingCell] = useState(null); // { shotId, fieldId }
  const [cellValue, setCellValue] = useState("");

  const handleCellClick = (shotId, fieldId, currentValue, isEditable, fieldType) => {
    if (isEditable) {
      setEditingCell({ shotId, fieldId });
      // Ensure cellValue is always a string for text, select, date fields
      if (fieldType === 'text' || fieldType === 'select' || fieldType === 'date') {
        setCellValue(String(currentValue || ''));
      } else {
        setCellValue(currentValue); // For checkbox, it's 'TRUE'/'FALSE'
      }
    }
  };

  const handleCellChange = (e) => {
    // Check if 'e' is an event object (has a target property and value/checked)
    if (e && typeof e === 'object' && e.target) {
      if (typeof e.target.value !== 'undefined') {
        setCellValue(e.target.value);
      } else if (typeof e.target.checked !== 'undefined') {
        setCellValue(e.target.checked ? 'TRUE' : 'FALSE');
      }
    } else {
      // 'e' is already the value (e.g., from Checkbox's onChange passing 'TRUE'/'FALSE')
      setCellValue(e);
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { shotId, fieldId } = editingCell;
      onCellSave(shotId, fieldId, cellValue); // Call the prop to save
      setEditingCell(null);
      setCellValue("");
    }
  };

  const handleCellKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur(); // Trigger blur to save
    }
    if (e.key === "Escape") {
      setEditingCell(null); // Cancel editing
      setCellValue("");
    }
  };

  const renderEditableCell = (field, value, onChange, onBlur, onKeyDown) => {
    switch (field.type) {
      case "select":
        return (
          <Select
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            autoFocus
            fullWidth
            variant="standard"
            sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
          >
            {Array.isArray(field.options) && field.options.map((option) => (
              <MenuItem key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}> 
                {typeof option === 'object' ? option.label : option}
              </MenuItem>
            ))}
          </Select>
        );
      case "date":
        return (
          <TextField
            type="date"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            fullWidth
            variant="standard"
            sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
          />
        );
      case "checkbox":
        return (
          <Checkbox
            checked={value === 'TRUE'}
            onChange={(e) => onChange(e.target.checked ? 'TRUE' : 'FALSE')}
            onBlur={onBlur}
            sx={{ p: 0.5 }}
          />
        );
      default:
        return (
          <TextField
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            fullWidth
            variant="standard"
            sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
          />
        );
    }
  };

  /* Helper: returns either <img> or plain text */
  const renderCell = (shot, field) => {
    const value = shot[field.id];

    // treat 'thumbnail' or any field with type === 'image' as an image URL
    const isImage =
      field.id === "thumbnail" || field.type === "image";

    if (isImage) {
      const imageUrl = value && typeof value === 'string' && value.startsWith('http') ? value : `https://via.placeholder.com/120x68?text=${encodeURIComponent(shot.shot_code || "N/A")}`;
      return (
        <img
          src={imageUrl}
          alt={field.label}
          width={120}
          height={68}
          style={{ objectFit: "cover" }}
        />
      );
    }

    if (field.type === "checkbox") {
      return <Checkbox checked={value === 'TRUE'} disabled sx={{ p: 0.5 }} />;
    }

    // default: render as text
    return value;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <TableContainer component={Paper} sx={{ height: 'calc(100dvh - 165px)', overflow: 'auto' }}>
        <Table stickyHeader sx={{ borderCollapse: "separate", borderSpacing: "0", width: tableWidth }}>
          <TableHead sx={{ position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 15 }}>
            <SortableContext
              items={visibleFieldIds}
              strategy={horizontalListSortingStrategy}
            >
              <TableRow
                sx={{
                  bgcolor: "background.paper",
                }}
              >
                {fields
                  .filter((f) => visibleFieldIds.includes(f.id))
                  .map((f) => (
                    <SortableHeaderCell
                      key={f.id}
                      field={f}
                      columnWidths={columnWidths}
                      handleColResizeMouseDown={handleColResizeMouseDown}
                      isLast={visibleFieldIds.indexOf(f.id) === visibleFieldIds.length - 1}
                      sx={{
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        borderBottom: '1px solid rgba(224, 224, 224, 1)',
                      }}
                    />
                  ))}
              </TableRow>
            </SortableContext>
            {showFilters && (
              <TableRow
                sx={{
                  bgcolor: "background.paper",
                }}
              >
                {visibleFieldIds.map((fieldId) => (
                  <TableCell
                    key={fieldId}
                    sx={{
                      width: columnWidths[fieldId] ?? 150,
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    }}
                  >
                    {/* filter input here */}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {shots.map((shot) => (
              <TableRow key={shot.shot_id}>
                {fields
                  .filter((f) => visibleFieldIds.includes(f.id))
                  .map((f) => {
                    const isEditing = editingCell?.shotId === shot.shot_id && editingCell?.fieldId === f.id;
                    return (
                      <TableCell
                        key={f.id}
                        sx={{
                          width: columnWidths[f.id] ?? 150,
                          borderRight: '1px solid rgba(224, 224, 224, 1)',
                          borderBottom: '1px solid rgba(224, 224, 224, 1)',
                        }}
                      >
                        {isEditing
                          ? renderEditableCell(
                              f,
                              cellValue,
                              handleCellChange,
                              handleCellBlur,
                              handleCellKeyDown,
                            )
                          : (
                            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              {f.type === 'checkbox' ? (
                                <Checkbox
                                  checked={shot[f.id] === 'TRUE'}
                                  onChange={e =>
                                    onCellSave(shot.shot_id, f.id, e.target.checked ? 'TRUE' : 'FALSE')
                                  }
                                  disabled={f.editable}
                                  sx={{ p: 0.5 }}
                                />
                              ) : (
                                renderCell(shot, f)
                              )}

                              {f.editable && f.type == 'checkbox' && (
                                <EditIcon
                                  sx={{ fontSize:16, cursor:'pointer', ml:1 }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCellClick(
                                      shot.shot_id,
                                      f.id,
                                      shot[f.id],
                                      f.editable,
                                      f.type,
                                    );
                                  }}
                                />
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
    </DndContext>
  );
}
