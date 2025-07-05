// src/components/ShotTable.jsx
import React, { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
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

export default function ShotTable({
  shots = [],
  fields = [],
  columnWidths = {},
  visibleFieldIds = [],
  showFilters = false,
  handleDragEnd,
  handleColResizeMouseDown,
}) {
  /* exact pixel width = Σ column widths */
  const tableWidth = useMemo(
    () => fields.reduce(
      (sum, f) => sum + (columnWidths[f.id] ?? 150), 0),
    [fields, columnWidths]
  );

  const sensors = useSensors(useSensor(PointerSensor));
  const HEAD_H = 20; // height of one header row
  const APP_BAR_HEIGHT = 0; // Height of the main toolbar, adjust if needed

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* ① bottom horizontal-scrollbar wrapper */}
      <Box sx={{ overflowX: "auto" }}>
        {/* ② Paper must allow overflow so sticky rows can stick */}
        <TableContainer
          component={Paper}
          sx={{
            display: "inline-block",
            overflow: "visible",
            width: `${tableWidth}px`,
          }}
        >
          <Table stickyHeader>
            <TableHead>
              {/* ── field row (sticky, draggable) ── */}
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={horizontalListSortingStrategy}
              >
                <TableRow
                  sx={{
                    position: "sticky",
                    top: APP_BAR_HEIGHT, // Stick below the main toolbar
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
                        />
                      )
                  )}
                </TableRow>
              </SortableContext>

              {/* ── optional filter row ── */}
              {showFilters && (
                <TableRow
                  sx={{
                    position: "sticky",
                    top: `${APP_BAR_HEIGHT + HEAD_H}px`, // Stick below field row
                    zIndex: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  {fields.map(
                    (f) =>
                      visibleFieldIds.includes(f.id) && (
                        <TableCell
                          key={f.id}
                          sx={{ width: columnWidths[f.id] ?? 150, p: 0.5 }}
                        >
                          {/* put <TextField /> etc. here */}
                        </TableCell>
                      )
                  )}
                </TableRow>
              )}
            </TableHead>

            {/* ── data rows ── */}
            <TableBody>
              {shots.map((shot) => (
                <TableRow key={shot.shot_id}>
                  {fields.map(
                    (f) =>
                      visibleFieldIds.includes(f.id) && (
                        <TableCell
                          key={f.id}
                          sx={{ width: columnWidths[f.id] ?? 150 }}
                        >
                          {shot[f.id]}
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