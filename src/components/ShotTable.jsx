// src/components/ShotTable.jsx
import React, { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from "@mui/material";
import Box from "@mui/material/Box";

export default function ShotTable({
  shots = [],
  fields = [],
  columnWidths = {},
  showFilters = false          // parent toggles this
}) {
  /* exact pixel width = Σ columnWidths; never resizes with window */
  const tableWidth = useMemo(
    () => fields.reduce((sum, f) => sum + (columnWidths[f.id] ?? 150), 0),
    [fields, columnWidths]
  );

  /* MUI AppBar is 64 px on desktop.  Adjust if you changed it. */
  const APP_BAR_H = 64;
  const HEAD_H     = 56;       // height of each table-header row

  return (
    /* ① outer box owns the horizontal scrollbar                            */
    <Box sx={{ overflowX: "auto" }}>
      {/* ② Paper must allow overflow for sticky rows                         */}
      <TableContainer
        component={Paper}
        sx={{
          display: "inline-block",
          overflow: "visible",
          width: `${tableWidth}px`
        }}
      >
        <Table stickyHeader>
          <TableHead>
            {/* ─── field row (touches the toolbar) ─── */}
            <TableRow
              sx={{
                position: "sticky",
                top: `${APP_BAR_H}px`,
                zIndex: 2,
                bgcolor: "background.paper"
              }}
            >
              {fields.map((f) => (
                <TableCell
                  key={f.id}
                  sx={{ width: columnWidths[f.id] ?? 150 }}
                >
                  {f.label}
                </TableCell>
              ))}
            </TableRow>

            {/* ─── optional filter row ─── */}
            {showFilters && (
              <TableRow
                sx={{
                  position: "sticky",
                  top: `${APP_BAR_H + HEAD_H}px`,
                  zIndex: 1,
                  bgcolor: "background.paper"
                }}
              >
                {fields.map((f) => (
                  <TableCell
                    key={f.id}
                    sx={{ width: columnWidths[f.id] ?? 150, p: 0.5 }}
                  >
                    {/* put a TextField / Select etc. here */}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>

          {/* ─── data rows ─── */}
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
  );
}