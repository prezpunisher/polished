# Polished Notes App (v1.0)

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
- Collapsible collection column and details panel (animated)
- Collapsible sidebar sections (Workspace, Folders, Collaboration) — open/closed state persists across reloads
- Line number toggle (Settings → Editor)
- Dark and light theme, switchable from Settings → Appearance — choice persists across reloads
- Native macOS title bar above the tab row, with properly spaced traffic lights (Electron build)
- Native macOS window dragging from any panel's top bar (Electron build)
- Custom app icon and Dock identity (Electron build)

## Design Language

The UI uses a **pill/circle** design language:
- Text buttons and inputs: `border-radius: 999px` (pill)
- Icon buttons and color swatches: `border-radius: 50%` (circle)
- Two themes, same structure — dark uses a bear-gradient background with glass panels; light uses soft warm grays (off-white shell, slightly darker sidebar/header surfaces, a brighter editor surface) for a calm, native Apple Notes/Craft/Things-3 feel. All theme colors are CSS custom properties (`src/style.css`, `:root` vs `:root[data-theme="light"]`) — no color is hardcoded outside that token set.
- System font stack (`-apple-system` / SF Pro on macOS) for native-feeling type
- Small line icons (14px, 1.6 stroke) next to every sidebar and details-panel action, drawn from a shared icon set

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

The Electron main process enforces a single-instance lock — launching a second copy focuses the existing window instead of opening a duplicate.

## Build macOS App (DMG)

```bash
npm run electron:build
```

Output goes to `release/` (gitignored — rebuild locally rather than pulling from git). Builds both `arm64` (Apple Silicon) and `x64` (Intel) DMGs. The packaged app is unsigned, so macOS Gatekeeper will block the first launch — right-click the app in Applications → Open → Open to bypass it once.

To change the app icon, replace `electron/icons/icon.icns` (regenerate from `polished_app_icon.PNG` or any 1024×1024+ source image with `sips`/`iconutil`) and rebuild.

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
    main.js           ← Electron main process (window, menu, single-instance lock)
    icons/
      icon.icns       ← macOS app icon (all sizes bundled)
      icon.png        ← 1024×1024 source render
  polished_app_icon.PNG ← Source icon artwork
  src/
    App.jsx           ← State, effects, handlers, and top-level layout
    style.css         ← All styles; theme tokens in :root / :root[data-theme="light"]
    main.jsx
    App.test.jsx
    components/
      Sidebar.jsx         ← Navigation, folders, settings popover (theme + line-number toggles)
      CollectionPanel.jsx ← Note/task list with search and filters
      EditorPanel.jsx     ← Tab bar, note editor, checklist editor
      InspectorPanel.jsx  ← Details panel: actions, tags, properties, collaborators, version history
      Icon.jsx            ← Shared line-icon set used by Sidebar and InspectorPanel
      NoteCard.jsx        ← Note list card
      TaskCard.jsx        ← Task list card
    lib/
      constants.js    ← Shared constants (STORAGE_KEY, colorOptions, etc.)
      filters.js      ← matchesQuery, filterNotes, sortNotes, formatDateTime
      markdown.js     ← deriveTitleFromContent, renderMarkdown, shouldStoreVersion
      normalizers.js  ← Data shape normalizers (note, folder, checklist, etc.)
      seed.js         ← Default seed data
      storage.js      ← localStorage load/save helpers (app state + UI prefs incl. theme)
```
