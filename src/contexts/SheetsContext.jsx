import React, { createContext, useState, useEffect, useContext } from 'react';

export const SheetsContext = createContext(null);

export const SheetsProvider = ({ children }) => {
  const [sheetId, setSheetId] = useState(() => {
    return localStorage.getItem('motk:lastSheetId') || null;
  });

  useEffect(() => {
    if (sheetId) {
      localStorage.setItem('motk:lastSheetId', sheetId);
    } else {
      localStorage.removeItem('motk:lastSheetId');
    }
  }, [sheetId]);

  return (
    <SheetsContext.Provider value={{ sheetId, setSheetId }}>
      {children}
    </SheetsContext.Provider>
  );
};
