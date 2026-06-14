# Polished Notes App

A local-first React notes workspace for fast meeting notes, one-off capture, and later retrieval.

## Features

- Global search across the workspace
- User-created folders
- Collaboration filters for shared notes
- Pin, favorite, archive, and trash states
- Auto-generated note titles from body content
- Markdown preview with fenced code blocks
- Markdown checkboxes
- Tag chips and collaborator chips
- Local autosave and note restore history
- Collapsible workspace sections and collection column
- Local persistence with `localStorage`

## Tech

- React
- Vite
- Vitest
- React Testing Library

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually:

```bash
http://localhost:5173
```

If `5173` is already in use, Vite will move to another local port such as `5174`.

## Test

```bash
npm test -- --run
```

## Build

```bash
npm run build
```

## Project Structure

```text
polished/
  HOW_TO_OPEN_POLISHED.md
  POLISHED_CHAT_SUMMARY.md
  index.html
  src/
    App.jsx
    main.jsx
    App.test.jsx
    style.css
    test/setup.js
```
