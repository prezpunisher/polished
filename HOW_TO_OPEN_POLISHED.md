# How To Open Polished

## Project Location

```
/Users/iffy/ai-projects/polished
```

## Run in the Browser (Development)

```bash
npm run dev
```

Vite will print a local address. The port may vary if another app is already using the default:

```
http://127.0.0.1:5173/
http://127.0.0.1:5174/
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
- **Middle pane** — collection: note list (collapses with slide animation)
- **Right pane** — editor: title, body, tags, details, collaborators, version history, markdown preview

The collection column toggle button sits at the boundary between the sidebar and collection panel. It stays in the same position whether the panel is open or closed.

## Note Storage

Notes are saved in browser `localStorage` under:

```
polished-notes-app
```

Notes persist in the browser profile (or Electron app) on this machine. Clearing site data or uninstalling the app clears the notes.
