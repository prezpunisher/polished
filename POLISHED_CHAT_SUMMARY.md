# Polished Chat Summary

## Project Identity

- Project name: `polished`
- Project path: `/Users/iffy/AI-Projects/polished`
- Stack: React + Vite + Vitest

## Current Product Direction

`polished` is a local-first notes app for fast meeting notes, one-off notes, and later retrieval. The goal is to replace ad hoc text files and scattered untitled tabs with a calmer structured workspace.

## Current Features

- Flat, simple, Notion-like layout
- Global workspace search
- Folders
- Collaboration filters:
  - All shared
  - Inbound
  - Outbound
- Pin / favorite / archive / trash
- Auto-generated titles from note body content
- Markdown preview
- Insertable fenced code blocks
- Distinct code rendering for blocks such as `json`, `sql`, `js`, `ts`, `bash`
- Local autosave
- Version history with restore points
- Tag chips
- Collaborator chips

## Important UX Decisions Already Made

- The UI should stay flat and simple, not soft-card based.
- Collaboration is treated as filtering, not a special decorated experience.
- Tags now work as removable chips instead of a comma-parsed text field.
- Notes autosave to browser storage.
- Restore points are available directly inside the note editor.

## Important Files

- `/Users/iffy/AI-Projects/polished/src/App.jsx`
- `/Users/iffy/AI-Projects/polished/src/style.css`
- `/Users/iffy/AI-Projects/polished/src/App.test.jsx`
- `/Users/iffy/AI-Projects/polished/README.md`
- `/Users/iffy/AI-Projects/polished/HOW_TO_OPEN_POLISHED.md`

## Notes About Persistence

- Browser storage key: `polished-notes-app`
- Notes are not yet backed by a server or shared database.
- Collaboration is currently modeled locally in the note object.

## Reasonable Next Steps

1. Refactor the collaborator data model so inbound/outbound is more explicit.
2. Add import for `.txt` and `.md` files.
3. Add export and backup.
4. Add real shared persistence if collaboration needs to become functional across users.
