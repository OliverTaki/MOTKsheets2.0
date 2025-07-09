import { createContext } from 'react';

export const SheetsDataContext = createContext({
  sheetId: null,
  setSheetId: () => {},
  sheets: [],
  setSheets: () => {},
  fields: [],
  setFields: () => {},
  loading: false,
  error: null,
  refreshData: () => {},
  updateFieldOptions: () => {},
  idToColIndex: {},
});

export const SheetsDataProvider = ({ children }) => {
  const [sheetId, setSheetId] = useState(null);
  const [fields, setFields] = useState([]);