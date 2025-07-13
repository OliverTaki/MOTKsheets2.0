# Project Development Rules & UI Strategy

This document outlines the core development principles for the `motksheets2-frontend` project, effective as of the `newUIpolish` implementation.

---

## 1. Core UI Architecture: MUI DataGrid Community

**Strict Rule:** All table-based data visualization and interaction **must** be implemented using the **MUI DataGrid Community** library (`@mui/x-data-grid`).

**Guiding Principle:** The primary goal is to maximize maintainability and minimize future bugs by adhering as closely as possible to the official MUI DataGrid implementation.

**Implementation Requirement:** The DataGrid component should be wrapped in a thin, simple React component. This wrapper's responsibilities are strictly limited to:
1.  Mapping `shots` and `fields` props to the `rows` and `columns` expected by DataGrid.
2.  Connecting the DataGrid's event handlers (e.g., `onCellEditCommit`, `onColumnOrderChange`) to the application's data-saving and state management logic.
3.  Applying basic styling via MUI's `Box` component or `sx` prop to align with the application's theme.
4.  Implementing approved workarounds for features not available in the Community tier (e.g., a custom filter state model).

**Rationale for Sticking with MUI DataGrid:**
While other free libraries like AG Grid Community offer more features out-of-the-box, we have committed to MUI DataGrid for the following reasons:
*   **Alignment with Project Goals:** Our primary goal is to minimize custom UI code. MUI DataGrid, as a "batteries-included" component, aligns perfectly with this. Headless libraries like TanStack Table would violate this principle.
*   **Viable Workarounds:** We have confirmed that all our required features (including multi-column filtering and sorting) are achievable within the Community version through clever, minimal workarounds that do not require extensive custom code.
*   **Cost of Change:** Switching libraries at this stage would incur significant rework, including learning a new API and completely re-styling the component. The cost of switching outweighs the benefit of avoiding our planned workarounds.
*   **Consistency:** Sticking with MUI ensures a consistent look, feel, and development experience across the entire application.

**Prohibited:**
*   Custom, complex cell rendering logic that reimplements features already available in DataGrid or its Pro/Premium versions.
*   Direct DOM manipulation for features like resizing or reordering.
*   Diverging from the standard DataGrid API without a compelling, documented reason.

This approach ensures that we leverage a well-maintained, performant, and feature-rich library, reducing our own code complexity and maintenance burden.

---

## 2. `newUIpolish` Implementation Details

The `newUIpolish` initiative successfully replaced the previous custom table with MUI DataGrid. The following summarizes the implementation strategy that now serves as the template for future development.

### 2.1. Dependencies

The core UI is built upon the following libraries:
```bash
@mui/x-data-grid
@mui/material
@emotion/react
@emotion/styled
```

### 2.2. Implementation (`ShotTable.tsx`)

The canonical implementation is `src/components/ShotTable.tsx`. It serves as the minimal wrapper for the DataGrid.

### 2.3. Validation and Benchmarking

The new UI has been validated against the following core requirements:
*   **Functionality:** Correctly handles cell editing, column sorting, resizing, and reordering.
*   **Performance:** Provides a smooth user experience (~60 FPS) during intensive operations like column resizing, a significant improvement over the previous implementation.

---

## 3. Project Documentation

This `GEMINI.md` is the single source of truth for these development rules. The `README.md` provides a high-level overview for new contributors. All other design documents related to the old UI are now obsolete.

---

## 4. Development Strategy & Roadmap

The following is a strategic plan for reimplementing features on top of the new MUI DataGrid UI. Tasks are grouped into phases to ensure an efficient and stable development process.

### Phase 1: Core Table Stabilization & UI Polish (Highest Priority)
Focus: Solidify the core user experience of the data table.

1.  **Fix Text Editing Bug:** Resolve the issue where entering a space character prematurely ends cell editing.
2.  **Enable Text Wrapping & Auto Row Height:** Implement text wrapping within cells and allow row height to adjust dynamically based on content.
3.  **Enable Multi-Shot Selection:** Activate checkbox selection to allow users to select multiple rows.
4.  **UI Cleanup:** Remove the redundant outer footer and ensure column divider lines are displayed correctly.

### Phase 2: View Management Revival
Focus: Restore the ability for users to save, load, and manage their customized table views.

1.  **Load & Apply Views:** Re-implement the logic to read view configurations (visible fields, column order/size, sort, filters) from the `PAGES` sheet and apply them to the DataGrid.
2.  **View Selector UI:** Re-implement the dropdown menu in the toolbar for selecting saved views.
3.  **Save View Functionality:** Restore the "Save View" feature, allowing users to name and save the current table configuration.

### Phase 3: Core Data Operations
Focus: Bring back essential features for managing shots and fields.

1.  **Shot Detail Page:** Re-enable the shot detail page, accessible upon clicking a row.
2.  **Add New Shot:** Restore the "Add New Shot" functionality.
3.  **Field Management:**
    *   Restore the "Add Field" feature.
    *   Implement a new "Delete Field" feature.
    *   Ensure field reordering is functional (persisted as part of a view).

### Phase 4: Advanced Filtering
Focus: Implement a powerful, multi-layered filtering system.

1.  **Multi-Layer Filter UI & Logic:** Design and implement a new UI for creating and applying multiple, combined filter conditions to the table.

---

## 5. Development Workflow & Principles

To ensure the project remains maintainable, efficient, and aligned with our core architecture, all development must adhere to the following principles:

*   **Prioritize MUI Standard Features:** Before writing any custom code, thoroughly research MUI DataGrid's official documentation to find a built-in solution. The goal is to solve problems with configuration, not custom implementation.
*   **Functionality First, then Refactor:** While we must adhere to the MUI-first principle, delivering functionality is the priority. If a standard MUI solution is not immediately apparent and becomes a bottleneck, a temporary, simple workaround may be implemented.
*   **Permission for Deviation:** Any deviation from the standard MUI DataGrid API that is deemed necessary to unblock development **must be explicitly proposed and approved before implementation.** A clear justification and a plan for future refactoring back to a standard solution will be required.
*   **Simplicity is Key:** Most upcoming tasks are re-implementations of existing features. The solutions should be direct and simple. Avoid over-engineering. Keep dependencies to a minimum.
*   **Iterative Milestones:** Each phase in the roadmap will be treated as a milestone. We will focus on completing one phase at a time to ensure steady, verifiable progress.
*   **Continuous Review:** All code, especially temporary workarounds, should be periodically reviewed with the goal of aligning it more closely with standard MUI practices.

### MUI DataGrid Resources

To facilitate research and adherence to standard practices, refer to these official resources:

*   **Official Documentation:** [MUI X Data Grid Docs](https://mui.com/x/react-data-grid/)
*   **Features Overview:** [Data Grid - Features](https://mui.com/x/react-data-grid/#features)
*   **Column Configuration:** [Data Grid - Columns](https://mui.com/x/react-data-grid/columns/)
*   **Editing API:** [Data Grid - Editing](https://mui.com/x/react-data-grid/editing/)
*   **State Management:** [Data Grid - Controlled state](https://mui.com/x/react-data-grid/state/)
