# Simple Notes App — Feature Checklist

A reference list of what a solid, complete notes application needs. Checked items are implemented in Polished.

---

## Core Note Operations
- [x] Create a note
- [x] Edit a note (title + body)
- [x] Delete a note (permanent or via trash)
- [x] Duplicate a note
- [x] Auto-save on change (no manual save required)

## Organization
- [x] User-created folders / notebooks (create + delete)
- [x] Tags (add, remove, filter by)
- [x] Pin notes to the top of the list
- [x] Favorite / star notes
- [ ] Sort order: newest, oldest, alphabetical, manual (auto-sorted by pinned → favorited → date)

## Views & Filtering
- [x] All notes view
- [x] Folder view (filter by folder)
- [ ] Tag filter view (click a tag to see all notes with that tag)
- [x] Archive view (hidden from main lists)
- [x] Trash view (soft-deleted, restorable)
- [x] Favorites view
- [x] Pinned view

## Search
- [x] Full-text search across all notes
- [x] Search across the entire workspace (not just current view)
- [x] Instant results as you type

## Editor
- [x] Plain text / Markdown support (live Markdown preview in note cards)
- [x] Markdown checkboxes (task lists)
- [x] Line number toggle (Settings → Editor)
- [x] Word count, character count, line count in status bar
- [x] Undo / redo (browser-native in the textarea)
- [x] Auto-generated title from first line of body

## Tabs & Navigation
- [x] Open multiple notes in tabs simultaneously
- [x] Switch between open tabs
- [x] Close tabs (empty unsaved notes are discarded)
- [x] Keyboard shortcuts (Ctrl/Cmd+N new note, Ctrl/Cmd+F search)

## Version History
- [x] Automatic restore points on edit
- [x] Browse version history per note (History drawer in inspector)
- [x] Roll back to an earlier version

## Collaboration
- [x] Share a note with named collaborators (@ handles)
- [x] "Shared by you" and "Shared to you" filter views
- [x] Visual indicator on shared notes (collaborator chips on cards)

## Appearance & Accessibility
- [x] Light and dark mode
- [x] Multiple themes / accent colors (8 themes: Default, Warm, Sepia, Ocean, Dark, Neon, Matrix, Midnight)
- [x] Collapsible panels (sidebar sections, note list column, inspector panel)
- [x] Compact / scrolled topbar
- [x] Keyboard-navigable UI

## Persistence & Reliability
- [x] Local persistence (localStorage under `polished-notes-app`)
- [x] No data loss on page reload or app restart
- [ ] Import / export notes (JSON, Markdown, plain text)

## Nice-to-Have
- [ ] Sync across devices
- [ ] Attachments (images, files)
- [ ] Note locking (read-only mode)
- [ ] Templates for new notes
- [ ] Print / PDF export
- [ ] Offline-first with background sync
