# How To Open Polished

## Project Location

```
/Users/iffy/ai-projects/polished
```

## Run in the Browser (Development)

```bash
npm run dev
```

Vite will print a local address. We standardize on port 5173:

```
http://localhost:5173/
```

## Run as a Standalone Mac App (Electron)

Open two terminals in the project directory:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run electron
```

The Electron window connects to the Vite dev server. The title bar uses `hiddenInset` — traffic lights appear inside the app header.

## Build a Mac App DMG

```bash
npm run electron:build
```

Output is in `release/`. Builds for both `arm64` (Apple Silicon) and `x64` (Intel).

## Run Tests

```bash
npm test -- --run
```

## Main Files

| File | Purpose |
|---|---|
| `src/App.jsx` | All app logic and UI |
| `src/style.css` | All styles |
| `src/App.test.jsx` | Tests |
| `electron/main.js` | Electron main process |
| `vite.config.js` | Vite config (`base: './'` for Electron) |

## Current Workspace Layout

- **Left pane** — sidebar: workspace filters, folders, collaboration filters
- **Middle pane** — collection: note list (collapses with slide animation; toggle button sits at the fixed sidebar boundary)
- **Editor pane** — tab bar at top (open/switch/close tabs, + for new tab), then title, editor tools, and body textarea
- **Right pane** — inspector: Page label, note actions (Pin/Favorite/Archive/Trash/Duplicate), Tags, Details, Collaborators, and History drawers (collapses with slide animation; toggle button lives in the tab bar far right)

## Note Storage

Notes are saved in browser `localStorage` under:

```
polished-notes-app
```

Notes persist in the browser profile (or Electron app) on this machine. Clearing site data or uninstalling the app clears the notes.
