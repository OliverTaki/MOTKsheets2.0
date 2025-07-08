export async function appendPage(spreadsheetId, ensureValidToken, pageData, retried = false) {
  try {
    const token = await ensureValidToken();
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'PAGES',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [pageData] },
    });
  } catch (e) {
    if (e.status === 401 && !retried) {
      await ensureValidToken();       // トークン再取得
      return appendPage(spreadsheetId, ensureValidToken, pageData, true);
    }
    throw e;
  }
}