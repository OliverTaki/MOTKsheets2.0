import React from 'react';
import { TableCell } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default React.memo(function SortableHeaderCell({
  field,
  columnWidths,
  handleColResizeMouseDown,
  isLast,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
  };

  return (
    <TableCell ref={setNodeRef} style={style}>
      {/* ── Drag handle（左側 12px 固定）──────── */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 12,
          cursor: 'grab',
          zIndex: 30,
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* ラベル領域 */}
      <span style={{ paddingLeft: 14 }}>{field.label}</span>

      {/* ── Resize handle（右端 8px）──────────── */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 20,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();      // ← DnD を抑止
          handleColResizeMouseDown(e, field.id);
        }}
        onPointerDown={(e) => e.stopPropagation()} // touch / pen 端末用
      />
    </TableCell>
  );
})