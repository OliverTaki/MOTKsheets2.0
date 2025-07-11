export async function fetchGoogle(endpoint, accessToken, ensureValidToken, config = {}) {
  const base = endpoint.startsWith('drive')
    ? 'https://www.googleapis.com/'
    : 'https://sheets.googleapis.com/v4/'; // Sheets API

  const url = new URL(base + endpoint);
  const { method = 'GET', body, headers = {}, ...params } = config;

  // All keys in config other than method, body, headers are treated as query params
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach(val => url.searchParams.append(k, val));
    } else if (v !== undefined) {
      url.searchParams.set(k, v);
    }
  }

  const fetchOptions = {
    method,
    body,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  if (method === 'GET' || method === 'HEAD') {
    delete fetchOptions.body;
  }

  let res = await fetch(url.toString(), fetchOptions);

  // 401 → Force refresh and retry once
  if (res.status === 401) {
    accessToken = await ensureValidToken(true);
    fetchOptions.headers.Authorization = `Bearer ${accessToken}`;
    res = await fetch(url.toString(), fetchOptions);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP ${res.status} – ${errorBody}`);
  }

  const resText = await res.text();
  return resText ? JSON.parse(resText) : {}; // Handle empty responses
}