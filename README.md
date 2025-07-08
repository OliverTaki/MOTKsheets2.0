# MOTKsheets 2.0 · Front-end

> *A lightweight, self‑hosted ShotGrid‑like viewer/editor that talks directly to Google Sheets.*
> Built with **React + Vite 6** and a tiny Google Sheets API helper.

---

## Table of Contents

1. [Demo](#demo)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Project Structure](#project-structure)
8. [Development Scripts](#development-scripts)
9. [How it Works](#how-it-works)
10. [Roadmap](#roadmap)
11. [Contributing](#contributing)
12. [License](#license)
13. [Google Sheets Setup](#google-sheets-setup)

---

## Demo <a id="demo"></a>

| List page                             | Detail page                               | Cell edit                             |
| ------------------------------------- | ----------------------------------------- | ------------------------------------- |
| ![List screenshot](docs/img/list.png) | ![Detail screenshot](docs/img/detail.png) | ![Edit screenshot](docs/img/edit.gif) |

---

## Features <a id="features"></a>

* **🔑 Google Sign‑in (OAuth 2 PKCE)** – single‑click auth, no backend server
* **✏️ Cell editing with optimistic update** (instant UX, auto‑rollback on error)
* **▲▼ Column sort** – click header to toggle asc/desc
* **Enum‑aware UI (WIP)** – dropdowns & validation driven by a *Field Definition* sheet
* **Unified filter panel (WIP)** – build complex queries & save presets
* **Row / column add (planned)** – Sheets `append` + auto UI refresh

---

## Tech Stack <a id="tech-stack"></a>

| Layer      | Choice                     | Notes                                   |
| ---------- | -------------------------- | --------------------------------------- |
| Front‑end  | **React 18**, Vite 6       | Fast HMR, JSX/TSX native                |
| Styling    | Tailwind CSS 4¹            | Utility‑first, no CSS‑in‑JS             |
| Auth       | `@react-oauth/google`      | Uses PKCE flow; token cached in session |
| Data Layer | **Google Sheets REST API** | Direct calls from browser (no server)   |
| State      | React state + Context      | Global auth context, per‑page state     |
| CI/Lint²   | PNPM scripts, ESLint       | Keep fast & zero‑config                 |

> ¹ Tailwind is installed but minimal classes are used – feel free to theme.
> ² GitHub Actions sample workflow lives in `.github/workflows/ci.yml`.

---

## Prerequisites <a id="prerequisites"></a>

| Tool                     | Version (tested)      | Purpose                                 |
| ------------------------ | --------------------- | --------------------------------------- |
| **Node.js**              | ≥ 18 (LTS 20 advised) | Build & dev server                      |
| **Git**                  | ≥ 2.49                | Version control                         |
| **Google Cloud Project** | any                   | Enable **Sheets API** & **OAuth** creds |

You’ll need a **Google Sheets** document that acts as the database, *plus* an OAuth Client (Web application) whose **Authorized Origin** is `http://localhost:5173` (dev) or your deploy URL (prod).

---

## Quick Start <a id="quick-start"></a>

```bash
# 1. Clone
git clone https://github.com/OliverTaki/MOTKsheets2.0 motksheets2-frontend
cd motksheets2-frontend

# 2. Install deps (PNPM 8 is fastest, NPM 10 is fine)
npm install

# 3. Create .env from template
cp .env.example .env
#   – fill in SHEETS_ID / API_KEY / CLIENT_ID

# 4. Run dev server
npm run dev                # => http://localhost:5173
```

---

## Environment Variables <a id="environment-variables"></a>

`frontend/.env` (sample):

```dotenv
# === Google Sheets ===
VITE_SHEETS_ID=1A2B3C4D5E...
VITE_SHEETS_API_KEY=AIzaSy...

# === Google OAuth Client ===
VITE_GOOGLE_CLIENT_ID=123456789012-abcxyz.apps.googleusercontent.com

# (optional) default tab name
VITE_TAB_NAME=Sheet1
```

> **Never commit a real API key** – create a restricted key or store it in GitHub Secrets for production builds.

---

## Project Structure <a id="project-structure"></a>

```
src/
 ├─ api/               # thin wrappers around Google Sheets REST
 │   └─ updateCell.js
 ├─ components/        # pure-UI or small stateful widgets
 │   ├─ ShotTable.jsx
 │   ├─ LoginButton.jsx
 │   └─ ...
 ├─ hooks/
 │   └─ useSheetsData.js
 ├─ AuthContext.jsx
 ├─ App.jsx
 ├─ main.jsx
 └─ index.css          # Tailwind base
public/
docs/                  # screenshots, diagrams
```

---

## Development Scripts <a id="development-scripts"></a>

| Script            | What it does                |
| ----------------- | --------------------------- |
| `npm run dev`     | Vite dev server + HMR       |
| `npm run build`   | Production build to `dist/` |
| `npm run preview` | Serve built files locally   |
| `npm run lint`    | ESLint (`src/**/*.[jt]sx?`) |

---

## How it Works <a id="how-it-works"></a>

1. `useSheetsData` fetches:
   • **data tab** (`Sheet1!A1:Z`) → rows → `shots`
   • **field definition tab** (optional) → input *type*, enum *options* → `fields`
2. AuthContext stores the **OAuth token** (sessionStorage, 1 hr lifetime) and automatically refreshes it when needed.
3. **Editing flow**:
   `ShotTable` ✏ → local `onCellSave` (optimistic) → `updateCell()` → Sheets API `PUT`
   *On failure, UI rolls back by full page reload.*
4. **Filtering & Sorting** live in `App.jsx` (`filters`, `sortKey`, `asc`).

---

## Roadmap <a id="roadmap"></a>

* [x] Optimistic cell editing
* [ ] Field definition sheet (<kbd>type</kbd>/<kbd>options</kbd>)
* [ ] Dropdown validation for enum cells
* [ ] Global filter panel + preset save
* [ ] Append row / append column UI
* [ ] Netlify/Vercel deploy guide
* [ ] Cypress E2E tests

---

## Contributing <a id="contributing"></a>

```bash
git checkout -b feat/your-topic
npm run dev   # hack away
git commit -m "feat(x): amazing thing"
git push origin feat/your-topic
# open PR 🎉
```

Please stick to the existing ESLint rules (`npm run lint`) and keep PRs focused.

---

## License <a id="license"></a>

MIT © 2025 **Oliver Taki** & contributors

---

## Google Sheets Setup <a id="google-sheets-setup"></a>

### プロジェクトシートの命名規則
- 新規プロジェクトを作成する際はファイル名を
    **MOTK[Project:<任意のプロジェクト名>]**
    としてください（例: MOTK[Project:Oliver02]）。
- 中括弧 [] 内の <ProjectName> が UI に表示されます。

#### シート ID の優先順位
1. ユーザーが /select で選択したシート
2. `localStorage["motk:lastSheetId:<googleSub>"]`
3. `.env` で設定した `VITE_SHEETS_ID`（初期値 / デモ用）

切替後は全データフックが自動で再読込されます。