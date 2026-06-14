# Polished Notes App

A polished React notes workspace with a searchable sidebar, pinned notes, local persistence, and a focused writing pane.

## Features

- Search notes by title, body, or tags.
- Create, duplicate, pin, unpin, and delete notes.
- Edit title, tags, and body in place.
- Persist notes to `localStorage`.
- Keep the interface responsive and compact on smaller screens.

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

## Test

```bash
npm test
```

## Project Structure

```text
polished/
  index.html
  src/
    App.jsx
    main.jsx
    App.test.jsx
    style.css
    test/setup.js
```
