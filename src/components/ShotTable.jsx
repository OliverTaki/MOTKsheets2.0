// src/components/ShotTable.jsx
import React, { useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select, MenuItem
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

export default function ShotTable(props) {
  const {
    shots = [],
    fields: rawFields = [],
    columnWidths = {},
    visibleFieldIds = [],
    showFilters = false,
    handleDragEnd,
    handleColResizeMouseDown,
    onCellSave, // Ensure onCellSave is destructured
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

  const handleCellClick = (shotId, fieldId, currentValue, isEditable) => {
    if (isEditable) {
      setEditingCell({ shotId, fieldId });
      setCellValue(currentValue);
    }
  };

  const handleCellChange = (e) => {
    setCellValue(e.target.value);
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

    // default: render as text
    return value;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <TableContainer component={Paper} sx={{ height: 'calc(100vh - 133px)', overflow: 'auto' }}>
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
                {fields.map(
                  (f) =>
                    visibleFieldIds.includes(f.id) && (
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
                    )
                )}
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
                {fields.map(
                  (f) =>
                    visibleFieldIds.includes(f.id) && (
                      <TableCell
                        key={f.id}
                        sx={{
                          width: columnWidths[f.id] ?? 150,
                          borderRight: '1px solid rgba(224, 224, 224, 1)',
                          borderBottom: '1px solid rgba(224, 224, 224, 1)',
                        }}
                      >
                        {editingCell?.shotId === shot.shot_id && editingCell?.fieldId === f.id ? (
                          f.type === "select" ? (
                            <Select
                              value={cellValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              autoFocus
                              fullWidth
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
                            >
                              {Array.isArray(f.options) && f.options.map((option) => (
                                <MenuItem key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}> 
                                  {typeof option === 'object' ? option.label : option}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : f.type === "date" ? (
                            <TextField
                              type="date"
                              value={cellValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              autoFocus
                              fullWidth
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
                            />
                          ) : (
                            <TextField
                              value={cellValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              autoFocus
                              fullWidth
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              sx={{ '& .MuiInputBase-input': { p: 0.5 } }}
                            />
                          )
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {renderCell(shot, f)}
                            {f.editable && (
                              <EditIcon
                                sx={{ fontSize: 16, cursor: 'pointer', ml: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering cell click again
                                  handleCellClick(shot.shot_id, f.id, shot[f.id], f.editable);
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </TableCell>
                    )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DndContext>
  );
}
