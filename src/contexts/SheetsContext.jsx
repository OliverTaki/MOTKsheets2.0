import React, { createContext, useState, useEffect, useContext } from 'react';

export const SheetsContext = createContext(null);

export const SheetsProvider = ({ children }) => {
  const [sheetId, setSheetId] = useState(
    () => localStorage.getItem('motk:lastSheetId') || null
  );
  useEffect(() => {
    if (sheetId)
      localStorage.setItem('motk:lastSheetId', sheetId);
  }, [sheetId]);

  return (
    <SheetsContext.Provider value={{ sheetId, setSheetId }}>
      {children}
    </SheetsContext.Provider>
  );
};
