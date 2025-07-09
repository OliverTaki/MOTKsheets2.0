import { AuthContext } from '../AuthContext'; // Assuming AuthContext is exported

export async function apiFetch(url, opt = {}, token, setNeedsReAuth) {
  const res = await fetch(url, {
    ...opt,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    console.warn('API call returned 401. Setting needsReAuth to true.');
    setNeedsReAuth(true);
  }

  return res;
}