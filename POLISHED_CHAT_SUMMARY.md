# Polished Chat Summary

## Project Identity

- Project name: `polished`
- Project path: `/Users/iffy/ai-projects/polished`
- Stack: React + Vite + Vitest + Electron

## Current Product Direction

`polished` is a local-first notes app for fast meeting notes, one-off notes, and later retrieval. The goal is to replace ad hoc text files and scattered untitled tabs with a calmer structured workspace. It runs as a web app in development and can be packaged as a standalone macOS app via Electron.

## Current Features

- Flat editor-style layout with pill/circle UI language
- Fixed workspace shell with independent pane scrolling
- Global workspace search
- User-created folders
- Collaboration filters:
  - All shared
  - Inbound
  - Outbound
- Collapsible left sidebar sections:
  - Workspace
  - Folders
  - Collaboration
- Collapsible collection column with slide animation (CotEditor-style inspector)
- Pin / favorite / archive / trash
- Auto-generated titles from note body content
- Markdown preview
- Markdown checkboxes
- Insertable fenced code blocks
- Distinct code rendering for blocks such as `json`, `sql`, `js`, `ts`, `bash`
- Local autosave
- Version history with restore points
- Tag chips
- Collaborator chips
- Light and dark mode (dark mode text visibility fixed)
- Electron wrapper for standalone macOS app

## Important UX Decisions Already Made

- The UI should stay flat and simple, inspired by CotEditor — no gradients, no glossy surfaces.
- Design language: **pill/circle** — `border-radius: 999px` for text buttons and inputs, `border-radius: 50%` for icon buttons and swatches. (Previous style was **rounded rectangle** at `border-radius: 6px` — revert by swapping values if needed.)
- Collection column collapses via a slide animation. The toggle button sits at `left: 255px` on the workspace grid (the sidebar/panel boundary), so it never moves during the animation.
- The collection's inner content has a fixed `width: 330px` so text does not reflow during the slide animation.
- Notes autosave to browser storage.
- Restore points are available directly inside the note editor.
- Note cards show only title + date + body preview — no badges or tag/collaborator footers.
- Tags work as removable chips instead of a comma-parsed text field.
- The collection column scrolls on its own when it overflows.

## Design Language Reference

| Term | Value | Used for |
|---|---|---|
| Pill | `border-radius: 999px` | Text buttons, nav items, inputs |
| Circle | `border-radius: 50%` | Icon buttons, color swatches, brand mark |
| Rounded rectangle (previous) | `border-radius: 6px` | Everything, before the pill/circle update |

## Important Files

- `/Users/iffy/ai-projects/polished/src/App.jsx`
- `/Users/iffy/ai-projects/polished/src/style.css`
- `/Users/iffy/ai-projects/polished/src/App.test.jsx`
- `/Users/iffy/ai-projects/polished/electron/main.js`
- `/Users/iffy/ai-projects/polished/vite.config.js`
- `/Users/iffy/ai-projects/polished/README.md`
- `/Users/iffy/ai-projects/polished/HOW_TO_OPEN_POLISHED.md`

## Notes About Persistence

- Browser storage key: `polished-notes-app`
- Notes are not yet backed by a server or shared database.
- Collaboration is currently modeled locally in the note object.
- Git is being used for app-level rollback checkpoints in addition to in-app note history.

## Electron (macOS App)

- Entry point: `electron/main.js`
- Window style: `titleBarStyle: 'hiddenInset'` with traffic lights at `{ x: 16, y: 16 }`
- Topbar gets `padding-left: 80px` and `-webkit-app-region: drag` automatically when running in Electron (detected via `navigator.userAgent`)
- Dev workflow: run `npm run dev` in one terminal, `npm run electron` in another
- Build: `npm run electron:build` → outputs DMG to `release/`
- Vite config sets `base: './'` so asset paths work under `file://`

## Reasonable Next Steps

1. Add import for `.txt` and `.md` files.
2. Allow rename and delete for custom folders.
3. Add export and backup.
4. Refactor the collaborator data model if collaboration becomes more than filtering metadata.
5. Set up a dedicated GitHub remote for the polished project (currently pointing at old `simple-weather-app` repo).
