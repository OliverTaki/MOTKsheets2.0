// src/AuthContext.jsx – v7 (enable write scope, jwt-decode, offline access)
//----------------------------------------------------------------
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ""; // optional

// === Request **read‑write** scope for Google Sheets ===
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets", // ← read‑write
].join(" ");

const genRandom = (len = 64) => {
  const u8 = crypto.getRandomValues(new Uint8Array(len));
  return btoa(String.fromCharCode(...u8))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, len);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /* ---------- accessToken → userinfo ---------- */
  const loadUser = async (accessToken, idToken) => {
    // try ID‑token first (no extra fetch)
    if (idToken) {
      try {
        const d = jwtDecode(idToken);
        setUser({ name: d.name, email: d.email, picture: d.picture });
        return;
      } catch {}
    }

    try {
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) throw new Error();
      const i = await r.json();
      setUser({ name: i.name, email: i.email, picture: i.picture });
    } catch {
      sessionStorage.clear();
      setUser(null);
    }
  };

  /* ---------- bootstrap ---------- */
  useEffect(() => {
    const at  = sessionStorage.getItem("motk_access_token");
    const idt = sessionStorage.getItem("motk_id_token");
    if (at) loadUser(at, idt);
  }, []);

  /* ---------- Google Sign‑In (PKCE) ---------- */
  const signIn = async () => {
    const redirectUri = `${window.location.origin}/oauth.html`;

    // PKCE: verifier → challenge
    const verifier  = genRandom(64);
    const hash      = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        code_challenge: challenge,
        code_challenge_method: "S256",
        access_type: "offline",           // ← refresh_token 取得
        prompt: "consent select_account", // ← 毎回 consent で確実に scope 付与
      });

    const popup = window.open(authUrl, "oauth", "width=500,height=600");
    const code  = await new Promise((resolve, reject) => {
      const t = setInterval(() => {
        try {
          if (popup.closed) { clearInterval(t); reject(new Error("closed")); }
          else if (popup.location.href.startsWith(redirectUri)) {
            const c = new URL(popup.location.href).searchParams.get("code");
            if (c) { clearInterval(t); popup.close(); resolve(c); }
          }
        } catch {}
      }, 500);
    });

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    if (CLIENT_SECRET) body.append("client_secret", CLIENT_SECRET);

    const tk = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }).then((r) => r.json());

    if (tk.access_token) {
      sessionStorage.setItem("motk_access_token", tk.access_token);
      if (tk.id_token) sessionStorage.setItem("motk_id_token", tk.id_token);
      await loadUser(tk.access_token, tk.id_token);
    } else {
      console.error("Token exchange failed", tk);
      alert("Google sign‑in failed – see console for details.");
    }
  };

  const signOut = () => {
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ---------- require auth guard ---------- */
export const useRequireAuth = () => {
  const { user, signIn } = useAuth();
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-medium">Sign‑in required</h2>
        <button onClick={signIn} className="px-4 py-2 rounded bg-amber-500 text-white">
          Sign in with Google
        </button>
      </div>
    );
  }
  return null;
};
