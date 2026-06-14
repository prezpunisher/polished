# Notes Storage

This app does not create a note file on disk.

Your notes live in the browser's `localStorage` under the key:

```text
polished-notes-app
```

That means:

- The notes persist in the browser on the same machine and profile.
- Clearing site data clears the notes.
- The data is not stored in the repository unless you export it manually.

If you want a real markdown note file in the project, create one anywhere in the repo,
for example:

```text
notes/my-note.md
```

or

```text
docs/my-note.md
```

