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
    transform: CSS.Transform.toString(transform),
    transition,
    width: columnWidths[field.id] ?? 150,
    cursor: "grab",
    position: "relative", // Added for positioning the resize handle
    borderRight: '1px solid rgba(224, 224, 224, 1)',
  };

  return (
    <TableCell ref={setNodeRef} style={style}>
      {/* ──   Drag Handle   ───────────────────────── */}
      <div
        {...attributes}      // role / tabIndex / aria
        {...listeners}       // onPointerDown 等（★ ここだけに付与）
        style={{
          position:'absolute',
          left: 4,
          top: 0, bottom: 0,
          width: 12,
          cursor:'grab',
          zIndex: 30,
        }}
        onClick={e=>e.stopPropagation()}
      />

      {/* ラベル本体 */}
      {field.label}

      {/* ──   Resize Handle   ─────────────────────── */}
      <div
        style={{
          position:'absolute', right:0, top:0, bottom:0, width:8,
          cursor:'col-resize', zIndex:20,
        }}
        onMouseDown={e=>{
          e.stopPropagation();               // ★ Drag開始を阻止
          handleColResizeMouseDown(e, field.id);
        }}
        onPointerDown={e=>e.stopPropagation()}  // iPad 等 pointer 系端末向け
      />
    </TableCell>
  );
})