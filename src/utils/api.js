import { AuthContext } from '../AuthContext'; // Assuming AuthContext is exported

export async function apiFetch(url, opt = {}, token, setNeedsReAuth, ensureValidToken) {
  if (!token) {
    console.error('apiFetch: No token provided. Cannot make authenticated API call.');
    setNeedsReAuth(true); // Trigger re-authentication if no token
    throw new new Error('Authentication token missing.');
  }
  let res = await fetch(url, {
    ...opt,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    console.warn('API call returned 401. Attempting to refresh token.');
    const newToken = await ensureValidToken(true);
    if (newToken) {
      res = await fetch(url, {
        ...opt,
        headers: { Authorization: `Bearer ${newToken}` }
      });
    } else {
      setNeedsReAuth(true);
    }
  }

  return res;
}