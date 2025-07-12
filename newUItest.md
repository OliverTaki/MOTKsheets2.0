# newUI Branch Strategy

This document provides a clear, concise roadmap for implementing and evaluating a PoC using **MUI DataGrid Community** as the central solution in the `newUI` branch. It focuses on the single, simplest approach—wrapping DataGrid with minimal custom code—to ensure maximum maintainability and minimal bugs when the UI evolves.

---

## 1. Setup & Dependencies Setup & Dependencies

Install required packages on the `newUI` branch:

```bash
# Confirm you're on newUI
git status

# Install core UI dependencies
npm install @mui/x-data-grid @mui/material @emotion/react @emotion/styled

# (Optional) Additional libraries for future optimizations
npm install @tanstack/react-virtual @tanstack/table-core dnd-kit
```

*Goal: Prepare a lightweight environment to test MUI DataGrid Community edition.*

---

## 2. Feature Toggle

In `src/App.tsx`, add a boolean flag to switch between the current table and the new DataGrid:

```tsx
const useNewUI = true;
return useNewUI
  ? <ShotTableNew shots={shots} fields={fields} onCellSave={handleSave} />
  : <ShotTableOld shots={shots} fields={fields} onCellSave={handleSave} />;
```

*Benefit: Toggle UIs instantly without widescale code changes.*

---

## 3. Implement `ShotTableNew`

Create `src/components/ShotTableNew.tsx` with a minimal wrapper:

```tsx
import React from 'react';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Box } from '@mui/material';

type Props = { shots: any[]; fields: Array<{ id: string; headerName: string; type?: string }>; onCellSave: (id: string, field: string, value: any) => void; };

export default function ShotTableNew({ shots, fields, onCellSave }: Props) {
  const rows: GridRowsProp = shots.map(s => ({ id: s.shot_id, ...s }));
  const columns: GridColDef[] = fields.map(f => ({
    field: f.id,
    headerName: f.headerName,
    width: 150,
    resizable: true,
    sortable: true,
    editable: true,
    type: f.type as any,
  }));

  return (
    <Box sx={{ height: 'calc(100dvh - 165px)', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={params => onCellSave(params.id as string, params.field, params.value)}
        disableSelectionOnClick
        experimentalFeatures={{ newEditingApi: true }}
      />
    </Box>
  );
}
```

*Key points:*

* Map `shots` → `rows`, `fields` → `columns`.
* Wrap in MUI `<Box>` for consistent layout.
* Use `onCellEditCommit` to trigger Google Sheets updates.

---

## 4. Validate Core Features

1. **Launch:** `npm run dev`
2. **Toggle:** Set `useNewUI = true`.
3. **Test:**

   * Column resizing, sorting, editing (text, select, checkbox, date).
   * Drag-and-drop columns (if integrated).
   * Data persists correctly; errors open your modal/snackbar.

---

## 5. Benchmark Performance

1. Open DevTools → Performance.
2. Record a rapid 5‑second column resize.
3. Compare **New UI** vs **Old UI**:

   * Frame rates
   * Scripting/render times
   * End-to-end latency

*Aim: Confirm \~60 fps and <100 ms total latency.*

---

## 6. Apply Styling & Theme

* Define `minWidth`/`maxWidth` per column.
* Wrap in your existing MUI theme provider for colors and typography.
* Adjust DataGrid props (e.g., `disableSelectionOnClick`, hide footer) to match your UX.

---

## 7. Final Decision

Based on verification and benchmarks:

* **Proceed:**

  1. Keep `newUI`, remove old table code, merge into `main`.
  2. Delete obsolete files such as `GEMINI.md` and the previous `README.md` to avoid confusion and unintended auto-merges.

* **Revert:**

  1. Disable the `useNewUI` flag.
  2. Archive or delete the `newUI` branch per your workflow, and leave existing docs intact.

---

## 8. Optional Next Steps & Optimizations

These enhancements are **optional**—apply them **only if** your performance benchmarks (from Step 5) indicate gaps such as:

* **Frame rates** consistently below 55 fps during resize/drag.
* **Drag latency** over 100 ms between pointer movement and visual update.
* **High scripting times** (>10 ms) per frame.

Below are **specific steps** and **when to try each**:

### 8.1 Direct DOM Resize (Proposal 2)

**When to try:** If real-time feedback is choppy (lagging pointer) despite 60 fps target.

**Steps:**

1. In `ShotTableNew`, add a resize handle element (`<div className="resize-handle"/>`) to each header cell.
2. On `pointerdown` (on the handle), register `pointermove` and `pointerup` listeners on `window`.
3. In the `pointermove` handler, use `event.preventDefault()` and inside `requestAnimationFrame`, directly set the column’s `style.width` on the `<col>` or header cell—bypassing React state.
4. On `pointerup`, remove listeners and commit the final width via `setColumnVisibility` or DataGrid’s API if available.

**Why:** Bypassing React renders avoids Virtual DOM reconciliation overhead, giving per-pixel updates with minimal delay.

---

### 8.2 Deferred Resize Mode (Proposal 3)

**When to try:** If continuous live resizing causes layout thrashing or low FPS.

**Steps:**

1. Disable live resizing: set DataGrid’s `disableColumnResize` (or similar) if available.
2. On header handle `pointerdown`, show an overlay “ghost” line (`<Box>` positioned absolutely) at the column boundary.
3. Move the ghost line in response to `pointermove` events (no table reflow).
4. On `pointerup`, hide the ghost line and update the column width once via DataGrid’s API or by updating your `columns` state.

**Why:** Deferring the heavy layout reflow until after drag maintains smooth interaction at 60 fps.

---

### 8.3 CSS Layout Optimization (Proposal 4)

**When to try:** If reflows (forced layout) dominate frame time in performance profiler.

**Steps:**

1. Add CSS: `table-layout: fixed;` to DataGrid’s internal table or wrap a CSS Grid container:

   ```css
   .MuiDataGrid-root .MuiDataGrid-window { table-layout: fixed; }
   ```
2. Define column widths via CSS variables:

   ```css
   .data-grid { --col-0-width:150px; --col-1-width:200px; }
   .data-grid .MuiDataGrid-cell:nth-child(1) { width: var(--col-0-width); }
   ```
3. On resize, update only the CSS variables (`style.setProperty('--col-N-width', newWidth+'px')`).

**Why:** Letting the browser optimize fixed-layout or grid layouts reduces per-resize reflow cost.

---

### 8.4 Event Throttling & Memoization (Proposal 5)

**When to try:** If scripting time spikes from frequent resize state updates.

**Steps:**

1. Wrap your resize callback with a throttle or `requestAnimationFrame` gate:

   ```js
   let rafId = null;
   function onResizeEvent(e) {
     if (rafId) return;
     rafId = requestAnimationFrame(() => {
       setColumnWidth(calculateWidth(e));
       rafId = null;
     });
   }
   ```
2. Use `React.memo` on custom cell renderers so they skip updates when only width changes.
3. Memoize your `columns` and `rows` definitions with `useMemo`, keyed on unchanged dependencies.

**Why:** Batching updates to animation frames and preventing full re-renders significantly cuts scripting time.

---

*Implement only the optimizations that address specific bottlenecks shown in DevTools—over-optimizing adds complexity without benefit.*
