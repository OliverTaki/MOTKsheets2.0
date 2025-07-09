import { fetchGoogle } from '../utils/google';

export const updateCell = async (spreadsheetId, token, setNeedsReAuth, range, value) => {
    try {
        const res = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/${range}`, token, {
            method: 'PUT',
            params: { valueInputOption: 'USER_ENTERED' },
            body: { values: [[value]] },
        });

        return res;
    } catch (e) {
        console.error("Error in updateCell:", e);
        throw e;
    }
};
