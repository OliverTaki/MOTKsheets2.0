import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

  export default defineConfig({
   plugins: [
    react({ fastRefresh: false }),   // ← eval を完全排除したい場合。Hot-Reload遅延可なら true
   ],
  server: {
    port: 5173,
    headers: {
      // DEVELOPMENT ONLY ─ 本番 build には含まれない
      'Content-Security-Policy':
        "default-src 'self'; " + 
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; " + 
        "style-src  'self' 'unsafe-inline'; " + 
        "connect-src 'self' ws://localhost:5173 https://www.googleapis.com; " + 
        "frame-src https://accounts.google.com;",
    },
  }, });
