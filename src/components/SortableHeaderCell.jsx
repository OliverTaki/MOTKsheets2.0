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
      <span
        style={{ cursor: "col-resize", float: "right" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleColResizeMouseDown(e, field.id);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </TableCell>
  );
}