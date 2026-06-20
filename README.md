# Polished Notes App

A local-first React notes workspace for fast meeting notes, task lists, one-off capture, and later retrieval. Runs in the browser during development and can be packaged as a standalone macOS app via Electron.

## Features

- Notes and task lists (checklists) in a unified workspace
- Global search across the entire workspace
- User-created folders for note organisation
- Pin, favorite, archive, and trash states for both notes and tasks
- Unified archive and trash views (notes and tasks together)
- Auto-generated note titles from body content
- Markdown checkboxes in notes
- Tag chips and collaborator chips on notes
- Local autosave and version history per note
- Per-note tabs in the editor (open, switch, close)
- Collapsible collection column and inspector panel (animated)
- Collapsible sidebar sections (Workspace, Folders, Collaboration)
- Line number toggle (Settings → Editor)
- Dark mode only — bear/glass visual style

## Design Language

The UI uses a **pill/circle** design language:
- Text buttons and inputs: `border-radius: 999px` (pill)
- Icon buttons and color swatches: `border-radius: 50%` (circle)
- Single dark theme — bear gradient background with glass panels

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

Then open `http://localhost:5174`.

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
    App.jsx           ← State, effects, handlers, and top-level layout
    style.css         ← All styles (single bear/glass dark system)
    main.jsx
    App.test.jsx
    components/
      Sidebar.jsx         ← Navigation, folders, settings popover
      CollectionPanel.jsx ← Note/task list with search and filters
      EditorPanel.jsx     ← Tab bar, note editor, checklist editor
      InspectorPanel.jsx  ← Tags, details, collaborators, version history
      NoteCard.jsx        ← Note list card
      TaskCard.jsx        ← Task list card
    lib/
      constants.js    ← Shared constants (STORAGE_KEY, colorOptions, etc.)
      filters.js      ← matchesQuery, filterNotes, sortNotes, formatDateTime
      markdown.js     ← deriveTitleFromContent, renderMarkdown, shouldStoreVersion
      normalizers.js  ← Data shape normalizers (note, folder, checklist, etc.)
      seed.js         ← Default seed data
      storage.js      ← localStorage load/save helpers
```
