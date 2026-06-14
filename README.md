# Polished Notes App

A local-first React notes workspace for fast meeting notes, one-off capture, and later retrieval. Runs in the browser during development and can be packaged as a standalone macOS app via Electron.

## Features

- Global search across the workspace
- User-created folders
- Collaboration filters for shared notes
- Pin, favorite, archive, and trash states
- Auto-generated note titles from body content
- Markdown checkboxes
- Tag chips and collaborator chips
- Local autosave and note restore history
- Per-note tabs in the editor (open, switch, close)
- Collapsible collection column and inspector panel (slide animation)
- Collapsible workspace sections in sidebar
- Light and dark mode
- Local persistence with `localStorage`

## Design Language

The UI uses a **pill/circle** design language:
- Text buttons and inputs: `border-radius: 999px` (pill)
- Icon buttons and color swatches: `border-radius: 50%` (circle)
- Previous style was **rounded rectangle** (`border-radius: 6px`) — revert by swapping values in `style.css`

## Tech

- React
- Vite
- Vitest
- React Testing Library
- Electron (for macOS packaging)

## Run in Browser

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Run as macOS App (Electron)

Open two terminals:

```bash
# Terminal 1 — start the dev server
npm run dev

# Terminal 2 — open the Electron window
npm run electron
```

## Build macOS App (DMG)

```bash
npm run electron:build
```

Output goes to `release/`.

## Test

```bash
npm test -- --run
```

## Build for Web

```bash
npm run build
```

## Project Structure

```text
polished/
  electron/
    main.js           ← Electron main process
  src/
    App.jsx           ← All app logic and UI
    style.css         ← All styles
    main.jsx
    App.test.jsx
    test/setup.js
  vite.config.js      ← base: './' for Electron compatibility
  HOW_TO_OPEN_POLISHED.md
  POLISHED_CHAT_SUMMARY.md
  NOTES.md
```
