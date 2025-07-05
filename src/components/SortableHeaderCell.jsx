// src/components/SortableHeaderCell.jsx
import { TableCell } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableHeaderCell({
  field,
  columnWidths,
  handleColResizeMouseDown,
}) {
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
    width: columnWidths[field.id] ?? 150,
    cursor: 'grab',
  };

  return (
    <TableCell
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      component="th"
      scope="col"
    >
      {field.label}
      {/* ▼  your resize-handle / sort icon can live inside this cell ▼ */}
      <span
        style={{ cursor: "col-resize", float: "right" }}
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent dnd-kit's listener from firing
          handleColResizeMouseDown(e, field.id);
        }}
        // Stop drag listeners from firing when resizing
        onClick={(e) => e.stopPropagation()}
      />
    </TableCell>
  );
}