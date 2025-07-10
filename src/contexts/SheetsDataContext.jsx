import { createContext, useState, useEffect, useContext } from 'react';

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

  return (
    <SheetsDataContext.Provider
      value={{
        sheetId,
        setSheetId,
        fields,
        setFields,
      }}
    >
      {children}
    </SheetsDataContext.Provider>
  );
};

export const useDriveSheets = (token) => {
  const { sheetId, setFields, setIdToColIndex } = useContext(SheetsDataContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !sheetId) return;
  }, [token, sheetId]);

  return { loading };
};

const { sheetId } = useContext(SheetsDataContext);
console.log('sheetId in context', sheetId);