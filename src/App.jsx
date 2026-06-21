import { useEffect, useMemo, useRef, useState } from "react";
import "./style.css";
import { nowIso, createId, MAX_VERSIONS } from "./lib/constants.js";
import { normalizeFolder, normalizeNote, normalizeChecklistItem, normalizeChecklist } from "./lib/normalizers.js";
import { matchesQuery, filterNotes, sortNotes } from "./lib/filters.js";
import { deriveTitleFromContent, shouldStoreVersion, getNextUntitledTitle } from "./lib/markdown.js";
import { loadUiPrefs, saveUiPrefs, loadAppState, saveAppState } from "./lib/storage.js";
import Sidebar from "./components/Sidebar.jsx";
import CollectionPanel from "./components/CollectionPanel.jsx";
import EditorPanel from "./components/EditorPanel.jsx";
import InspectorPanel from "./components/InspectorPanel.jsx";

function createVersionSnapshot(note, savedAt) {
  return {
    id: `${note.id}-version-${savedAt}`,
    savedAt,
    title: note.title || "Untitled Note",
    content: note.content || "",
    tags: note.tags || [],
    collaborators: note.collaborators || [],
    folderId: note.folderId,
    color: note.color,
  };
}

const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);

export default function App() {
  const [appState, setAppState] = useState(loadAppState);
  const [query, setQuery] = useState("");
  const [isCollectionCollapsed, setIsCollectionCollapsed] = useState(() => loadUiPrefs().collectionCollapsed);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(() => loadUiPrefs().inspectorCollapsed);
  const [openTabs, setOpenTabs] = useState(() => {
    const s = loadAppState();
    return s.activeId ? [s.activeId] : (s.notes[0]?.id ? [s.notes[0].id] : []);
  });
  const [showLineNumbers, setShowLineNumbers] = useState(() => loadUiPrefs().showLineNumbers);
  const [sidebarSections, setSidebarSections] = useState(() => loadUiPrefs().sidebarSections);
  const searchRef = useRef(null);
  const titleRef = useRef(null);
  const checklistTitleRef = useRef(null);
  const shortcutActionsRef = useRef(null);

  const { notes, folders, activeView, activeId, checklists } = appState;
  const activeTabChecklist = openTabs.includes(activeId)
    ? (checklists || []).find((cl) => cl.id === activeId) ?? null
    : null;
  const activeNote = openTabs.includes(activeId)
    ? notes.find((note) => note.id === activeId) || null
    : null;

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = q
      ? notes.filter((note) => matchesQuery(note, q))
      : filterNotes(notes, activeView);
    return sortNotes(candidates, q ? "search" : activeView.kind);
  }, [activeView, notes, query]);

  const noteCounts = useMemo(() => {
    const visible = notes.filter((n) => !n.isDeleted && !n.isArchived);
    const activeTasks = (checklists || []).filter((cl) => !cl.isTrashed && !cl.isArchived);
    return {
      all: visible.length + activeTasks.length,
      notes: visible.length,
      tasks: activeTasks.length,
      pinned: visible.filter((n) => n.isPinned).length,
      favorites: visible.filter((n) => n.isFavorite).length,
      shared: visible.filter((n) => n.collaborators.length > 0).length,
      inbound: visible.filter((n) => n.shareDirection === "inbound").length,
      outbound: visible.filter((n) => n.collaborators.length > 0 && n.shareDirection !== "inbound").length,
      archive: notes.filter((n) => n.isArchived && !n.isDeleted).length + (checklists || []).filter((cl) => cl.isArchived && !cl.isTrashed).length,
      trash: notes.filter((n) => n.isDeleted).length + (checklists || []).filter((cl) => cl.isTrashed).length,
    };
  }, [notes, checklists]);

  const folderCounts = useMemo(() => folders.map((f) => ({
    ...f,
    count: notes.filter((n) => n.folderId === f.id && !n.isDeleted && !n.isArchived).length,
  })), [folders, notes]);

  useEffect(() => {
    if (activeId && openTabs.length > 0 && !openTabs.includes(activeId)) {
      setAppState((curr) => ({ ...curr, activeId: openTabs[openTabs.length - 1] }));
    }
  }, [openTabs, activeId]);

  useEffect(() => { saveAppState(appState); }, [appState]);

  useEffect(() => {
    saveUiPrefs({ collectionCollapsed: isCollectionCollapsed, inspectorCollapsed: isInspectorCollapsed, showLineNumbers, sidebarSections });
  }, [isCollectionCollapsed, isInspectorCollapsed, showLineNumbers, sidebarSections]);

  useEffect(() => {
    shortcutActionsRef.current = {
      focusSearch: () => searchRef.current?.focus(),
      createNote: handleCreateNote,
      toggleFavorite,
      togglePinned,
    };
  });

  useEffect(() => {
    function handleShortcuts(e) {
      if (!e.metaKey && !e.ctrlKey) return;
      const key = e.key.toLowerCase();
      const actions = shortcutActionsRef.current;
      if (!actions) return;
      if (key === "k") { e.preventDefault(); actions.focusSearch(); }
      if (key === "n") { e.preventDefault(); actions.createNote(); }
      if (key === "f" && e.shiftKey) { e.preventDefault(); actions.toggleFavorite(); }
      if (key === "p" && e.shiftKey) { e.preventDefault(); actions.togglePinned(); }
    }
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []);

  // ── Note mutations ──────────────────────────────────────────────────────────

  function commitNote(noteId, patch) {
    setAppState((curr) => {
      const savedAt = nowIso();
      return {
        ...curr,
        notes: curr.notes.map((note) => {
          if (note.id !== noteId) return note;
          const nextNote = { ...note, ...patch, updatedAt: savedAt };
          if (!shouldStoreVersion(note, nextNote)) return nextNote;
          return {
            ...nextNote,
            versions: [createVersionSnapshot(nextNote, savedAt), ...(note.versions || [])].slice(0, MAX_VERSIONS),
          };
        }),
      };
    });
  }

  function updateActiveNote(patch) {
    if (activeNote) commitNote(activeNote.id, patch);
  }

  function handleCreateNote() {
    const defaultFolder = activeView.kind === "folder" ? activeView.id : folders[0]?.id;
    const note = normalizeNote({
      id: createId(),
      title: getNextUntitledTitle(notes),
      isTitleAuto: true,
      content: "",
      tags: [],
      folderId: defaultFolder,
      color: "amber",
      collaborators: [],
      shareDirection: null,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      versions: [],
    }, folders);
    setAppState((curr) => ({ ...curr, notes: [note, ...curr.notes], activeId: note.id }));
    setOpenTabs((prev) => prev.includes(note.id) ? prev : [...prev, note.id]);
    window.requestAnimationFrame(() => titleRef.current?.focus());
  }

  function handleDuplicateNote() {
    if (!activeNote) return;
    const dupe = normalizeNote({
      ...activeNote,
      id: createId(),
      title: `${activeNote.title} copy`,
      shareDirection: activeNote.collaborators.length > 0 ? "outbound" : null,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      versions: [],
    }, folders);
    setAppState((curr) => ({ ...curr, notes: [dupe, ...curr.notes], activeId: dupe.id }));
  }

  function handleTitleChange(value) {
    if (!activeNote) return;
    updateActiveNote({ title: value, isTitleAuto: !value.trim() });
  }

  function handleBodyChange(value) {
    if (!activeNote) return;
    updateActiveNote(activeNote.isTitleAuto
      ? { content: value, title: deriveTitleFromContent(value), isTitleAuto: true }
      : { content: value }
    );
  }

  function togglePinned() { if (activeNote) updateActiveNote({ isPinned: !activeNote.isPinned }); }
  function toggleFavorite() { if (activeNote) updateActiveNote({ isFavorite: !activeNote.isFavorite }); }
  function toggleArchive() { if (activeNote) updateActiveNote({ isArchived: !activeNote.isArchived }); }
  function sendToTrash() { if (activeNote) updateActiveNote({ isDeleted: true, isArchived: false }); }
  function restoreFromTrash() { if (activeNote) updateActiveNote({ isDeleted: false }); }

  function deleteForever() {
    if (!activeNote) return;
    const id = activeNote.id;
    setOpenTabs((prev) => prev.filter((t) => t !== id));
    setAppState((curr) => {
      const remaining = curr.notes.filter((n) => n.id !== id);
      return { ...curr, notes: remaining, activeId: remaining[0]?.id ?? null };
    });
  }

  function restoreVersion(version) {
    if (!activeNote) return;
    const savedAt = nowIso();
    const snapshot = createVersionSnapshot(activeNote, savedAt);
    const restoredCollaborators = version.collaborators || [];
    setAppState((curr) => ({
      ...curr,
      notes: curr.notes.map((note) => {
        if (note.id !== activeNote.id) return note;
        return {
          ...note,
          title: version.title || "Untitled Note",
          content: version.content || "",
          tags: version.tags || [],
          collaborators: restoredCollaborators,
          shareDirection: restoredCollaborators.length > 0 ? (note.shareDirection || "outbound") : null,
          folderId: version.folderId || note.folderId,
          color: version.color || note.color,
          isTitleAuto: !version.title || version.title === deriveTitleFromContent(version.content || ""),
          updatedAt: savedAt,
          versions: [snapshot, ...(note.versions || [])].slice(0, MAX_VERSIONS),
        };
      }),
    }));
  }

  // ── Tab management ──────────────────────────────────────────────────────────

  function openNoteInTab(noteId) {
    setOpenTabs((prev) => prev.includes(noteId) ? prev : [...prev, noteId]);
    setAppState((curr) => ({ ...curr, activeId: noteId }));
  }

  function openChecklistInTab(clId) {
    setOpenTabs((prev) => prev.includes(clId) ? prev : [...prev, clId]);
    setAppState((curr) => ({ ...curr, activeId: clId, activeChecklistId: clId }));
  }

  function closeTab(tabId) {
    setOpenTabs((prev) => {
      const next = prev.filter((id) => id !== tabId);
      const idx = prev.indexOf(tabId);
      const nextActiveId = activeId === tabId ? (next[idx] ?? next[idx - 1] ?? null) : activeId;
      setAppState((curr) => {
        const note = curr.notes.find((n) => n.id === tabId);
        const isEmpty = note && note.isTitleAuto && note.content === "" && note.tags.length === 0 && note.collaborators.length === 0;
        return { ...curr, activeId: nextActiveId, notes: isEmpty ? curr.notes.filter((n) => n.id !== tabId) : curr.notes };
      });
      return next;
    });
  }

  // ── View / folder management ────────────────────────────────────────────────

  function handleSelectView(nextView) {
    setAppState((curr) => ({ ...curr, activeView: nextView }));
    setIsCollectionCollapsed(false);
  }

  function createFolder(name) {
    const nextName = name.trim();
    if (!nextName) return;
    const folder = normalizeFolder({ id: createId(), name: nextName, color: "sky" });
    setAppState((curr) => ({ ...curr, folders: [...curr.folders, folder], activeView: { kind: "folder", id: folder.id } }));
  }

  function deleteFolder(folderId) {
    setAppState((curr) => {
      if (curr.folders.length <= 1) {
        return curr;
      }
      const remaining = curr.folders.filter((f) => f.id !== folderId);
      const fallbackId = remaining[0]?.id || null;
      return {
        ...curr,
        folders: remaining,
        notes: curr.notes.map((n) => n.folderId === folderId ? { ...n, folderId: fallbackId } : n),
        activeView: curr.activeView.kind === "folder" && curr.activeView.id === folderId ? { kind: "all" } : curr.activeView,
      };
    });
  }

  // ── Checklist management ────────────────────────────────────────────────────

  function createChecklist() {
    const cl = normalizeChecklist({ id: createId(), title: "", items: [] });
    setOpenTabs((prev) => [...prev, cl.id]);
    setAppState((curr) => ({ ...curr, checklists: [...(curr.checklists || []), cl], activeChecklistId: cl.id, activeId: cl.id }));
    window.requestAnimationFrame(() => checklistTitleRef.current?.focus());
  }

  function updateChecklistTitle(id, title) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, title, updatedAt: nowIso() } : cl),
    }));
  }

  function addChecklistItem(checklistId, text) {
    if (!text.trim()) return;
    const item = normalizeChecklistItem({ id: createId(), text: text.trim(), done: false });
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId ? { ...cl, items: [...cl.items, item], updatedAt: nowIso() } : cl
      ),
    }));
  }

  function toggleChecklistItem(checklistId, itemId) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i), updatedAt: nowIso() }
          : cl
      ),
    }));
  }

  function deleteChecklistItem(checklistId, itemId) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId ? { ...cl, items: cl.items.filter((i) => i.id !== itemId), updatedAt: nowIso() } : cl
      ),
    }));
  }

  function updateChecklistItemText(checklistId, itemId, text) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.map((i) => i.id === itemId ? { ...i, text } : i), updatedAt: nowIso() }
          : cl
      ),
    }));
  }

  function pinChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, isPinned: !cl.isPinned, updatedAt: nowIso() } : cl),
    }));
  }

  function favoriteChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, isFavorite: !cl.isFavorite, updatedAt: nowIso() } : cl),
    }));
  }

  function trashChecklist(id) {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id);
      setAppState((curr) => ({
        ...curr,
        checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, isTrashed: true, isPinned: false, updatedAt: nowIso() } : cl),
        activeId: curr.activeId === id ? (next[next.length - 1] ?? null) : curr.activeId,
      }));
      return next;
    });
  }

  function restoreChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, isTrashed: false, isArchived: false, updatedAt: nowIso() } : cl),
    }));
  }

  function archiveChecklist(id) {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id);
      setAppState((curr) => ({
        ...curr,
        checklists: (curr.checklists || []).map((cl) => cl.id === id ? { ...cl, isArchived: !cl.isArchived, updatedAt: nowIso() } : cl),
        activeId: curr.activeId === id ? (next[next.length - 1] ?? null) : curr.activeId,
      }));
      return next;
    });
  }

  function permanentlyDeleteChecklist(id) {
    setAppState((curr) => {
      const remaining = (curr.checklists || []).filter((c) => c.id !== id);
      return {
        ...curr,
        checklists: remaining,
        activeChecklistId: curr.activeChecklistId === id ? (remaining[0]?.id ?? null) : curr.activeChecklistId,
      };
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className={`app-shell${isElectron ? " electron-app" : ""}`}>
      <section className="notes-app" aria-label="Polished notes app">
        <div className={`workspace-grid${isCollectionCollapsed ? " collection-collapsed" : ""}${isInspectorCollapsed ? " inspector-collapsed" : ""}`}>
          <Sidebar
            activeView={activeView}
            onSelectView={handleSelectView}
            noteCounts={noteCounts}
            folderCounts={folderCounts}
            folders={folders}
            isCollectionCollapsed={isCollectionCollapsed}
            onOpenSearch={() => {
              if (isCollectionCollapsed) setIsCollectionCollapsed(false);
              window.requestAnimationFrame(() => searchRef.current?.focus());
            }}
            showLineNumbers={showLineNumbers}
            onToggleLineNumbers={() => setShowLineNumbers((v) => !v)}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            sections={sidebarSections}
            onToggleSection={(key) => setSidebarSections((s) => ({ ...s, [key]: !s[key] }))}
          />
          <CollectionPanel
            activeView={activeView}
            notes={notes}
            checklists={checklists || []}
            visibleNotes={visibleNotes}
            noteCounts={noteCounts}
            activeNoteId={activeNote?.id}
            activeId={activeId}
            hasActiveChecklist={!!activeTabChecklist}
            query={query}
            onQueryChange={setQuery}
            isCollectionCollapsed={isCollectionCollapsed}
            onToggleCollapsed={() => setIsCollectionCollapsed((v) => !v)}
            onOpenNote={openNoteInTab}
            onOpenChecklist={openChecklistInTab}
            onCreateNote={handleCreateNote}
            onCreateChecklist={createChecklist}
            onTrashChecklist={trashChecklist}
            onRestoreChecklist={restoreChecklist}
            onPermanentlyDeleteChecklist={permanentlyDeleteChecklist}
            searchRef={searchRef}
          />
          <EditorPanel
            openTabs={openTabs}
            activeId={activeId}
            activeNote={activeNote}
            activeTabChecklist={activeTabChecklist}
            notes={notes}
            checklists={checklists || []}
            showLineNumbers={showLineNumbers}
            titleRef={titleRef}
            checklistTitleRef={checklistTitleRef}
            onOpenNote={openNoteInTab}
            onOpenChecklist={openChecklistInTab}
            onCloseTab={closeTab}
            onCreateNote={handleCreateNote}
            onCreateChecklist={createChecklist}
            onSelectView={handleSelectView}
            onTitleChange={handleTitleChange}
            onBodyChange={handleBodyChange}
            onChecklistTitleChange={updateChecklistTitle}
            onAddItem={addChecklistItem}
            onToggleItem={toggleChecklistItem}
            onDeleteItem={deleteChecklistItem}
            onUpdateItemText={updateChecklistItemText}
            activeView={activeView}
          />
          <InspectorPanel
            activeNote={activeNote}
            activeTabChecklist={activeTabChecklist}
            isCollapsed={isInspectorCollapsed}
            onToggleCollapsed={() => setIsInspectorCollapsed((v) => !v)}
            folders={folders}
            onUpdateActiveNote={updateActiveNote}
            onTogglePinned={togglePinned}
            onToggleFavorite={toggleFavorite}
            onToggleArchive={toggleArchive}
            onSendToTrash={sendToTrash}
            onRestoreFromTrash={restoreFromTrash}
            onDeleteForever={deleteForever}
            onDuplicate={handleDuplicateNote}
            onPinChecklist={pinChecklist}
            onFavoriteChecklist={favoriteChecklist}
            onArchiveChecklist={archiveChecklist}
            onTrashChecklist={trashChecklist}
            onRestoreChecklist={restoreChecklist}
            onPermanentlyDeleteChecklist={permanentlyDeleteChecklist}
            onRestoreVersion={restoreVersion}
          />
        </div>
      </section>
    </main>
  );
}
