/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gemini': {
          'dark-bg': '#1e1f20',
          'card': '#242527',
          'card-alt': '#2c2d2f',
          'header': '#393a3d',
          'border': '#45474a',       // ご要望の暗いグレーの境界線
          'text': '#e1e3e6',         // 基本の文字 (白に近いグレー)
          'text-secondary': '#9aa0a6',
          'link': '#e1e3e6',         // リンク文字 (白基調)
          'link-hover': '#ffffff',     // リンクのホバー (明るい白)
        },
      }
    },
  },
  plugins: [],
}
