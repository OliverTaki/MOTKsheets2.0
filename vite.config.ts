import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 開発モード専用の緩めた CSP（本番 build には入りません）
const devCsp =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com/gsi/client; " +
  "style-src  'self' 'unsafe-inline' https://accounts.google.com/gsi/style; " +
  "frame-src  'self' https://accounts.google.com/gsi/; " +
  "connect-src 'self' https://accounts.google.com/gsi/;"

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    headers: command === 'serve' ? { 'Content-Security-Policy': devCsp } : {},
  },
}));