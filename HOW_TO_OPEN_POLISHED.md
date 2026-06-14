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

Vite will print a local address. The default is usually:

```text
http://127.0.0.1:5173/
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

## Notes Storage

The app stores note data in browser `localStorage` under:

`polished-notes-app`

That means your notes are saved in the browser profile you used to open the app, not in a `.md` or `.txt` file by default.
