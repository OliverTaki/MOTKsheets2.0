# Gemini CLI Session Notes

**Project:** `motksheets2-frontend`
**Last Session Date:** 2025-07-14

## Core Development Philosophy

**The project will strictly adhere to using the MUI DataGrid Community (free) version as the base for all table-like structures.**

1.  **Minimal Wrappers:** Any custom components built around the DataGrid should be minimal and simple. We must avoid complex abstractions that deviate from the core MUI component.
2.  **Prioritize MUI Features:** Before building custom solutions, we must thoroughly investigate if MUI DataGrid provides a built-in way to achieve the desired functionality.
3.  **Community over Pro:** We will not use any features from the paid MUI X Pro/Premium tiers. Functionality will be built using the Community version's capabilities or custom-built if necessary and approved.

This approach ensures long-term maintainability, stability, and leverages a robust, well-documented library, preventing bugs from complex custom code.

## Current State & Known Issues

-   **[DONE]** ~~**Bug:** Entering a space during text cell editing incorrectly finalizes the edit.~~
-   **[DONE]** Text wrapping in cells is functional.
-   **[DONE]** Checkbox-based multi-row selection is enabled.
-   **[DONE]** MUI's native column menu, filtering, and export features are integrated.
-   **[DONE]** Checkbox-only row selection behavior is restored.
-   **[DONE]** Columns are non-editable by default, with a clear editing mechanism.
-   **Performance:** Column resizing performance needs to be monitored, as it was a previous bottleneck.

## Roadmap

Here is the strategic plan to restore functionality, organized into logical phases.

### Phase 1: Core Table Polish & Functionality
*Goal: Fix immediate usability bugs and restore essential table interactions.*
- [x] **Bug Fix:** Correct the text editor behavior where a space finalizes the edit.
- [x] **Text Wrapping:** Implement automatic text wrapping in cells and adjust row height accordingly.
- [x] **Multi-Row Selection:** Enable checkbox-based multi-row selection.
- [x] **MUI Native Features:** Implement the native DataGrid toolbar for searching, the column menu for visibility, and the export menu.
- [ ] **Multi-Column Sorting:** Implement multi-column sorting to allow for grouping-like behavior (e.g., sort by Episode, then by Shot Number).
- [ ] **UI Fix:** Remove unnecessary column lines.
- [ ] **Footer:** Remove the redundant external footer.

### Phase 2: View Management (Pages)
*Goal: Restore the ability to save, load, and manage different table configurations.*
- [ ] Load saved views from the `PAGES` sheet (applying column order, size, sort, filters, etc.).
- [ ] Implement the UI to select between saved views.
- [ ] Re-implement the "Save View" and "Manage Views" dialog functionality.

### Phase 3: Data Management (CRUD)
*Goal: Restore functionality for adding and editing shots and fields.*
- [ ] Restore the "Add New Shot" page and functionality.
- [ ] Restore the "Shot Detail" page for viewing and editing a single shot.
- [ ] Restore the "Add Field" functionality.
- [ ] Implement the "Delete Field" functionality.
- [ ] Restore drag-and-drop field reordering.

### Phase 4: Advanced Filtering
*Goal: Re-implement the powerful multi-condition filtering system.*
- [ ] Design and implement a new UI for multi-layer filtering.
- [ ] Connect the filter UI to the DataGrid.