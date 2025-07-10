import { fetchGoogle } from '../utils/google';

export async function appendPage(spreadsheetId, token, setNeedsReAuth, pageData, ensureValidToken) {
  try {
    await fetchGoogle(`spreadsheets/${spreadsheetId}/values/PAGES:append`, token, ensureValidToken, {
      method: 'POST',
      params: { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
      body: { values: [pageData] },
    });
  } catch (e) {
    throw e;
  }
}