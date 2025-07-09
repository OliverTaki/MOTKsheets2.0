import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

  export default defineConfig({
   plugins: [
    react({ fastRefresh: false }),   // ← eval を完全排除したい場合。Hot-Reload遅延可なら true
   ],
  server: {
    port: 5173,
    headers: {
      // DEVELOPMENT-ONLY CSP
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' https://accounts.google.com/gsi/client; " +
         "frame-src  'self' https://accounts.google.com/gsi/; " +
         "connect-src 'self' https://accounts.google.com/gsi/; " +
         "style-src  'self' https://accounts.google.com/gsi/style;",
    },
  }, });