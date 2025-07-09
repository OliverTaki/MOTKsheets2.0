import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devCsp =
  "default-src 'self'; " +
  // eval, inline, blob の 3 つを許可
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://accounts.google.com/gsi/client; " +
  "style-src  'self' 'unsafe-inline' https://accounts.google.com/gsi/style; " +
  "frame-src  'self' https://accounts.google.com/gsi/; " +
  "connect-src 'self' https://accounts.google.com/gsi/;";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    headers: command === 'serve' ? { 'Content-Security-Policy': devCsp } : {},
  },
}));
