import { createContext } from 'react';

export const SheetsDataContext = createContext({
  sheetId: null,
  setSheetId: () => {},
  sheets: [], fields: [], loading: false, error: null, refreshData: () => {}, updateFieldOptions: () => {}, idToColIndex: {},
});