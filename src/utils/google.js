export async function fetchGoogle(endpoint, accessToken, ensureValidToken, params = {}) {
  const base = endpoint.startsWith('drive')
    ? 'https://www.googleapis.com/'
    : 'https://sheets.googleapis.com/v4/'; // Sheets API

  const url = new URL(base + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach(val => url.searchParams.append(k, val));
    } else {
      url.searchParams.set(k, v);
    }
  }

  let res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 401 → 強制リフレッシュして 1 回だけリトライ
  if (res.status === 401) {
    accessToken = await ensureValidToken(true);
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} – ${body}`);
  }
  return res.json();
}