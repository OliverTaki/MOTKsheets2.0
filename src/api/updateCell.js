export const updateCell = async (spreadsheetId, ensureValidToken, range, value, retried = false) => {
    try {
        await ensureValidToken();

        const res = await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[value]] },
        });

        if (!res.result) {
            if (res.status === 401 && !retried) {
                console.warn("401 Unauthorized in updateCell, attempting to refresh token and retry...");
                await ensureValidToken();
                return updateCell(spreadsheetId, ensureValidToken, range, value, true); // Retry the update
            }
            console.error('Google Sheets API Error:', res);
            throw new Error(res.error?.message || 'Failed to update cell.');
        }

        return res.result;
    } catch (e) {
        console.error("Error in updateCell:", e);
        throw e;
    }
};
