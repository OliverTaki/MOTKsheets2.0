import { useState } from 'react';
import { MissingIdEntry } from '@/services/sheetSync';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  missing: MissingIdEntry[];
  onApply(ids: MissingIdEntry[]): void;
  onDelete(rows: MissingIdEntry[]): void;
}

export default function MissingIdDialog({ open, missing, onApply, onDelete }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (idx: number) => {
    const s = new Set(selected);
    s.has(idx) ? s.delete(idx) : s.add(idx);
    setSelected(s);
  };
  const chosen = missing.filter(m => selected.has(m.index));
  return (
    <Dialog open={open}>
      <DialogContent className="space-y-4">
        <DialogTitle>{missing.length} missing IDs</DialogTitle>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {missing.map(m => (
            <label key={m.index} className="flex items-center gap-2">
              <input type="checkbox" checked={selected.has(m.index)} onChange={() => toggle(m.index)} />
              <span className="font-mono text-sm">{m.suggestedId}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={() => onDelete(chosen)}>Delete</button>
          <button className="btn-primary" onClick={() => onApply(chosen)}>Add IDs</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}