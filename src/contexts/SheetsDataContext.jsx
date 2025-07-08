import { createContext } from 'react';

export const SheetsDataContext = createContext({
  sheets: [], fields: [], loading: false, error: null, refreshData: () => {}, updateFieldOptions: () => {}, idToColIndex: {},
});