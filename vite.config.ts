import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devCsp =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://accounts.google.com/gsi/client; " +
  "style-src  'self' 'unsafe-inline' https://accounts.google.com/gsi/style; " +
  "frame-src  'self' https://accounts.google.com/gsi/; " +
  "connect-src 'self' https://accounts.google.com/gsi/ https://www.googleapis.com https://sheets.googleapis.com;";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,

    /** ★ ここがポイント
     *  ① まず同名ヘッダーを空文字で“上書き”して完全リセット
     *  ② 直後に devCsp をセット
     *     → ブラウザには devCsp １本しか残らない
     */
    headers:
      command === 'serve'
        ? {
            'Content-Security-Policy': devCsp,
            'Content-Security-Policy-Report-Only': '',
          }
        : {},
  },
}));