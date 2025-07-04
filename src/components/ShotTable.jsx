// src/components/ShotTable.jsx
import React, { useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField
} from "@mui/material";
import Box from "@mui/material/Box";
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
    onCellSave,
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

  const cellSx = {
    border: "1px solid rgba(224, 224, 224, 1)",
  };

  const [editingCell, setEditingCell] = useState(null); // { shotId, fieldId }
  const [cellValue, setCellValue] = useState("");

  const handleCellClick = (shotId, fieldId, currentValue) => {
    setEditingCell({ shotId, fieldId });
    setCellValue(currentValue);
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          sx={{            
            display: "inline-block",
            overflow: "visible",
            width: `${tableWidth}px`,
          }}
        >
          <Table stickyHeader sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <SortableContext
                items={visibleFieldIds}
                strategy={horizontalListSortingStrategy}
              >
                <TableRow
                  sx={{                    
                    position: "sticky",
                    top: 0, // Stick to the top of the container
                    zIndex: 2,
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
                          sx={cellSx}
                        />
                      )
                  )}
                </TableRow>
              </SortableContext>
              {showFilters && (
                <TableRow
                  sx={{
                    position: "sticky",
                    top: `${HEAD_H}px`,
                    zIndex: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  {visibleFieldIds.map((fieldId) => (
                    <TableCell
                      key={fieldId}
                      sx={{ ...cellSx, width: columnWidths[fieldId] ?? 150, p: 0.5 }}
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
                          sx={{ ...cellSx, width: columnWidths[f.id] ?? 150 }}
                          onClick={() => handleCellClick(shot.shot_id, f.id, shot[f.id])}
                        >
                          {editingCell?.shotId === shot.shot_id && editingCell?.fieldId === f.id ? (
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
                          ) : f.type === "image" || f.id === "thumbnail" ? (
                            <img
                              src={shot[f.id]}
                              alt="thumbnail"
                              style={{ width: "100%", height: "auto", display: "block" }}
                            />
                          ) : (
                            shot[f.id]
                          )}
                        </TableCell>
                      )
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DndContext>
  );
}
