# How To Open Polished

## Project Location

The project now lives at:

`/Users/iffy/AI-Projects/polished`

## Open In Terminal

```bash
cd /Users/iffy/AI-Projects/polished
```

## Run The App

If dependencies are already installed:

```bash
npm run dev
```

Vite will print a local address. The port may change if another local app is already using the default port. Recent runs have used URLs like:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5174/
```

If that address does not load, check the terminal output and use the exact URL Vite prints.

## Run Tests

```bash
npm test -- --run
```

## Build

```bash
npm run build
```

## Main Files

- App logic: `/Users/iffy/AI-Projects/polished/src/App.jsx`
- Styling: `/Users/iffy/AI-Projects/polished/src/style.css`
- Tests: `/Users/iffy/AI-Projects/polished/src/App.test.jsx`

## Current Workspace Layout

- Left pane: workspace filters, folders, and collaboration filters
- Middle pane: collection column with the current note list
- Right pane: focused note editor and markdown preview

The left sidebar sections can be collapsed with arrow toggles.

The collection column can also be collapsed.

When the collection column is visible and the note list is longer than the viewport, that pane now scrolls independently instead of scrolling the entire page.

## Current Note Behavior

- Notes autosave locally as you type
- New notes can derive a title from the body if you do not set one manually
- Tags are managed as chips instead of a comma-separated text field
- Collaborators are managed as handle chips
- Markdown supports fenced code blocks such as `json`, `sql`, `js`, and `bash`
- Markdown checkboxes are supported with `- [ ]` and `- [x]`
- Version history keeps restore points for rollback inside the app

## Notes Storage

The app stores note data in browser `localStorage` under:

`polished-notes-app`

That means your notes are saved in the browser profile you used to open the app, not in a `.md` or `.txt` file by default.
