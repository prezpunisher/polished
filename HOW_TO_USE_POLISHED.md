# How to Use Polished

Polished is a calm, local-first workspace for notes and quick task lists. Everything you write stays on this machine — there's no account, no sync, no cloud.

This guide walks through every feature. For installing or launching the app itself, see `HOW_TO_OPEN_POLISHED.md`.

---

## The Workspace at a Glance

Polished is split into four columns:

| Column | What it's for |
|---|---|
| **Sidebar** (far left) | Navigate views (All, Notes, Tasks, Pinned, Favorites, Archive, Trash), folders, and sharing filters |
| **Collection** | The list of notes/tasks for whatever view is selected, plus search |
| **Editor** | The open note or task list, with tabs across the top |
| **Details** (far right) | Actions, tags, properties, collaborators, and version history for the open note |

The Collection and Details columns can each be collapsed to a thin strip — click the small panel icon at the top of either one to toggle it, or to bring it back.

---

## Notes

### Creating a note
Click **New note** (the `+` button in the editor's tab bar, or the welcome screen's "Create Note" button), or press **⌘N**. A new untitled note opens immediately and is ready to type in.

### Titles
The title is auto-generated from the first line of the body as you type. The moment you manually edit the title field yourself, auto-titling stops for that note — your title is preserved even if you keep editing the body.

### Autosave
There's no save button. Every keystroke is saved to this device automatically.

### Body formatting
The body is plain text with lightweight markdown support:
- `# Heading` style lines render as headings
- `- item` lines render as bullet lists
- `- [ ] task` / `- [x] task` render as markdown checkboxes you can still edit as text

### Version history
Polished keeps up to the last 20 saved versions of a note. Open the **Details** panel → **History** to see them, with a timestamp for each. Click **Restore** next to any version to roll the note back to that point — restoring itself is also saved as a new version, so you can always undo an undo.

### Duplicate
**Details** panel → **Duplicate** makes an exact copy of the open note, dropped into the same folder.

---

## Tasks (Checklists)

Tasks are simple to-do lists, separate from notes but living in the same workspace.

- Create one from the **Tasks** view (sidebar) → **New task list**, or from the welcome screen
- Give the list a title, then type into the **+** row to add items
- Click an item's circle to mark it done (it gets a strikethrough); a thin progress bar at the bottom of the editor fills in as you complete items
- Hover an item to reveal a delete (×) button
- Tasks support the same Pin / Favorite / Archive / Trash / restore actions as notes, from the Details panel

---

## Organizing

### Folders
In the sidebar, expand **Folders**, type a name in the field, and click **+** (or press Enter). Click a folder to filter the Collection to just that folder's notes. Every note has a folder — new notes default to whatever folder you were last viewing, or the first folder if you weren't in one.

You can't delete the last remaining folder — the delete button (×, appears on hover) is disabled when only one is left, since every note needs a home.

### Tags
In the Details panel, open the **Tags** drawer, type a tag name, and press Enter or click **Add tag** (commas also work as a separator while typing). Click the **×** on any tag chip to remove it. A note can hold up to 12 tags.

### Pin & Favorite
Both are available from the Details panel actions row, or the **⌘⇧F** (favorite) and **⌘⇧P** (pin) shortcuts. Pinned and favorited items float to the top of any list, ahead of everything sorted by date — pinned first, then favorited.

### Archive & Trash
- **Archive** hides a note/task from your everyday views without deleting it — find archived items in the sidebar's **Archive** view, and **Unarchive** from there to bring them back.
- **Move to trash** soft-deletes — trashed items live in the **Trash** view until you **Restore** them or **Delete forever** (which is permanent).
- The Archive and Trash views show notes and tasks together in one unified list.

---

## Collaborators (Sharing Labels)

Polished doesn't sync over a network — "sharing" here is a labeling system for notes you're tracking as shared with someone.

- Open the Details panel → **Collaborators**, type a handle (e.g. `@teammate`), and click **Share note**
- Once a note has a collaborator, it's marked **Shared by you** (outbound)
- The sidebar's **Collaboration** section lets you filter to **All shared**, **Shared to you** (inbound), or **Shared by you** (outbound)
- Remove a collaborator by clicking the **×** on their chip

---

## Search

- Click the **Search** button in the sidebar (or press **⌘K**) to jump straight to the search field
- Typing in search looks across your **entire workspace**, regardless of which view you're currently in — you'll see an "Across workspace" indicator confirming this
- Clear the search field to go back to whatever view you were filtering by

---

## Tabs

Opening a note or task list adds a tab to the editor's tab bar, so you can keep several open at once. Click a tab to switch to it, click its **×** to close it. Closing the active tab switches you to whichever tab was opened before it.

---

## Settings

Click the **⚙** gear icon at the bottom of the sidebar to open Settings.

- **Appearance → Light mode**: switches between dark and light theme. Your choice is remembered the next time you open Polished.
- **Editor → Line numbers**: adds a line-number gutter down the left edge of the note body, useful for longer documents.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Focus search |
| `⌘N` / `Ctrl+N` | New note |
| `⌘⇧F` / `Ctrl+Shift+F` | Toggle favorite on the open note |
| `⌘⇧P` / `Ctrl+Shift+P` | Toggle pin on the open note |

---

## Moving and Resizing the Window (macOS app)

In the macOS app, the top ~40px strip of the window (above the tabs) is a drag handle — click and drag anywhere along it to move the window, just like any native Mac app. The traffic-light buttons (red/yellow/green) behave normally for close/minimize/full-screen. The window can also be resized from any edge or corner as usual.

---

## Where Your Data Lives

Everything — notes, tasks, folders, tags, and your settings — is stored in this browser/app's local storage. Nothing leaves your machine, and there's no account required. Clearing your browser's site data (or uninstalling the macOS app along with its application data) will erase your notes, so there's currently no built-in export/backup feature — keep that in mind for anything you can't afford to lose.
