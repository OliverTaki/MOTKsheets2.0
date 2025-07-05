import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import Box from "@mui/material/Box";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableHeaderCell from "./SortableHeaderCell";

export default function ShotTable(props) {
  const {
    shots = [],
    fields = [],
    columnWidths = {},
    showFilters = false,
    handleDragEnd,
    visibleFieldIds,
    handleColResizeMouseDown,
  } = props;

  const totalWidth = useMemo(
    () => fields.reduce((s, f) => s + (columnWidths[f.id] ?? 150), 0),
    [fields, columnWidths]
  );

  const sensors = useSensors(useSensor(PointerSensor));
  const HEAD_H = 56; // 1 header row

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* ⓐ outer box owns bottom scrollbar */}
      <Box sx={{ overflowX: "auto" }}>
        {/* ⓑ Paper must allow overflow so sticky works */}
        <TableContainer
          component={Paper}
          sx={{
            display: "inline-block",
            overflow: "visible",
            width: `${totalWidth}px`,
          }}
        >
          <Table stickyHeader>
            <TableHead>
              {/* ── field row (sticky) ── */}
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={horizontalListSortingStrategy}
              >
                <TableRow
                  sx={{
                    position: "sticky",
                    top: 0,
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
              {/* ── optional filter row (sticky) ── */}
              {showFilters && (
                <TableRow
                  sx={{
                    position: "sticky",
                    top: `${HEAD_H}px`,
                    zIndex: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  {fields.map((f) => (
                    <TableCell
                      key={f.id}
                      sx={{ width: columnWidths[f.id] ?? 150, p: 0.5 }}
                    >
                      {/* put <TextField /> etc. here */}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableHead>
            {/* ── data rows ── */}
            <TableBody>
              {shots.map((shot) => (
                <TableRow key={shot.shot_id}>
                  {fields.map((f) => (
                    <TableCell
                      key={f.id}
                      sx={{ width: columnWidths[f.id] ?? 150 }}
                    >
                      {shot[f.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DndContext>
  );
}