# Project Documentation: MOTK Sheets 2 Frontend

This document outlines the architecture, data flow, and purpose of each script in the `motksheets2-frontend` project. It is a living document that will be updated as the project evolves.

## Core Principle: Unidirectional Data Flow

This application follows React's core principle of unidirectional data flow.

1.  **State is Held in a Single Source of Truth:** The main `AppContainer` component holds all the application state (the data from Google Sheets, the current sort order, filter settings, etc.).
2.  **State is Passed Down via Props:** State is passed down from `AppContainer` to child components (`Home`, `Toolbar`, `ShotTable`) as props. These components are "controlled" and only render the data they are given.
3.  **Events are Passed Up via Callbacks:** When a user interacts with a component (e.g., sorts the table), the component does not change its own state. Instead, it calls a function passed down as a prop (e.g., `onSortModelChange`). This function updates the state in `AppContainer`.
4.  **Re-render:** When the state in `AppContainer` is updated, it triggers a re-render, and the new state is passed down to all child components, ensuring the UI is always consistent.

This model makes the application predictable and easier to debug.

## File and Folder Structure

### `/src/components/` - UI Components

This directory contains all the React components that make up the user interface.

*   **`AppContainer.jsx`**: The "brain" of the application. It holds all the state and the main logic for handling user interactions.
*   **`Home.jsx`**: The main layout component. It arranges the `Toolbar` and `ShotTable` on the screen.
*   **`Toolbar.jsx`**: The top-level toolbar containing the view selector, filter/sort controls, and other action buttons.
*   **`ShotTable.tsx`**: The main data grid component for displaying and editing shot data.
*   **`ManageViewsDialog.jsx`**: The dialog for saving, loading, and deleting views.
*   **`FieldManager.jsx`**: The component for managing which columns are visible.
*   **`FilterManager.jsx`**: The component for managing data filters.
*   **`GlobalNav.jsx`**: The top-level navigation bar.
*   **`ShotDetailPage.jsx`**: A page for viewing the details of a single shot.
*   **`AddShotPage.jsx`**: A page for adding a new shot.
*   **`LoginButton.jsx`**: The component for handling user login.

### `/src/hooks/` - Data Fetching Logic

This directory contains custom React hooks responsible for fetching data from the Google Sheets API.

*   **`usePagesData.js`**: Fetches the saved view configurations from the "PAGES" sheet. It reads all the rows from the sheet and parses the JSON strings for settings like `columnWidths`, `columnOrder`, `filterSettings`, `visibleFieldIds`, and `sortOrder` into JavaScript objects. It returns an array of these page objects.
*   **`useSheetsData.js`**: Fetches the main shot data from the "Shots" sheet.


### `/src/api/` - Data Writing Logic

This directory contains functions that write data back to the Google Sheets API.

*   **`appendField.js`**: Handles the complex process of adding a new field. It performs a batch update to the Google Sheet, which includes:
    1.  Appending a new row to the "FIELDS" sheet with the new field's properties (ID, label, type, etc.).
    2.  Appending a new column to the "Shots" sheet.
    3.  Updating the header and sub-header rows of the new column in the "Shots" sheet with the new field's ID and label.
    4.  If the new field is a checkbox, it adds data validation to the new column to ensure only TRUE/FALSE values are accepted.
*   **`deletePage.js`**: Deletes a row from the "PAGES" sheet to delete a view.
*   **`updatePage.js`**: Updates an existing row in the "PAGES" sheet to save changes to a view.
*   **`appendPage.js`**: Appends a new row to the "PAGES" sheet to save a new view.
*   **`updateCell.js`**: Updates a single cell in the "Shots" sheet.

### `/src/contexts/` - Shared Application State

This directory contains React Context providers for sharing global state across the application.

*   **`AuthContext.jsx`**: Manages user authentication state, including the access token.
*   **`SheetsContext.jsx`**: Holds the ID of the currently selected Google Sheet.
*   **`SheetsDataContext.jsx`**: Provides the fetched sheet data to the rest of the application.

### `/src/utils/` - Utility Functions

This directory contains helper functions that are used throughout the application.

*   **`google.js`**: A wrapper around the `fetch` API for making requests to the Google Sheets and Google Drive APIs. It automatically adds the authentication token to the request headers and handles token refreshing if a 401 Unauthorized error occurs.
*   **`id.js`**: Provides utility functions for working with IDs:
    *   `genId`: Generates a new random ID with a given prefix.
    *   `isValidUUID`: Checks if a string is a valid UUID.
    *   `toProjectName`: Extracts a project name from a file name.
*   **`idGenerator.js`**: A more sophisticated ID generator that creates unique, time-based IDs for different entity types (shots, fields, pages, etc.). This is the primary ID generator used in the application.
*   **`missingIdHandler.js`**: A data utility that scans a list of shots and assigns a new, unique ID to any shot that is missing one. This is important for data integrity.
*   **`parse.js`**: Contains functions for parsing the raw data from Google Sheets into a more usable format.
    *   `parseFields`: Parses the data from the "FIELDS" sheet to create the field definitions.
    *   `parseShots`: Parses the data from the "Shots" sheet, mapping the raw row data to the correct fields based on the header row.
*   **`sheetSync.js`**: A utility for syncing data back to Google Sheets. Its main function, `updateSheetWithNewIds`, is used to write newly generated shot IDs back to the "Shots" sheet.

### `/src/routes/` - Route Definitions

This directory contains the route definitions for the application.

*   **`ProtectedRoutes.jsx`**: A component that acts as a "gatekeeper" for certain routes. It checks if the user is authenticated and if a spreadsheet has been selected, and redirects to the appropriate page if not.

---
*This document will be updated as we add more detail to each script.*
