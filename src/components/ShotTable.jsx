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

/* TODO: re-add DnD, editing, resizing here … */

export default function ShotTable({
  shots = [],
  fields = [],
  columnWidths = {},
  showFilters = false,          // ← external toggle for the filter row
}) {
  const totalWidth = useMemo(
    () =>
      fields.reduce(
        (sum, f) => sum + (columnWidths[f.id] ?? 150),
        0
      ),
    [fields, columnWidths]
  );

  return (
    <Box sx={{ overflowX: "auto" }}>
      <TableContainer
        component={Paper}
        sx={{
          display: "inline-block",
          overflow: "visible",
          width: `${totalWidth}px`, // never re-flows with window resize
        }}
      >
        <Table stickyHeader>
          {/* --- header rows frozen --- */}
          <TableHead>
            {/* top caption row (optional) */}
            <TableRow
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                bgcolor: "background.paper",
              }}
            >
              <TableCell colSpan={fields.length}>Shots</TableCell>
            </TableRow>

            {/* field row */}
            <TableRow
              sx={{
                position: "sticky",
                top: 56, /* height of row above */
                zIndex: 2,
                bgcolor: "background.paper",
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

            {/* optional filter row — sticks under field row */}
            {showFilters && (
              <TableRow
                sx={{
                  position: "sticky",
                  top: 112,        /* 56px + 56px */
                  zIndex: 1,
                  bgcolor: "background.paper",
                }}
              >
                {fields.map((f) => (
                  <TableCell
                    key={f.id}
                    sx={{
                      width: columnWidths[f.id] ?? 150,
                      p: 0.5,
                    }}
                  >
                    {/* put your <TextField /> / <Select /> etc. here */}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>

          {/* --- data rows --- */}
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