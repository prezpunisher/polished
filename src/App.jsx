import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./style.css";
import {
  colorOptions,
  nowIso,
  createId,
  MAX_VERSIONS
} from "./lib/constants.js";
import {
  normalizeHandle,
  normalizeTagValue,
  normalizeFolder,
  normalizeNote,
  normalizeChecklistItem,
  normalizeChecklist
} from "./lib/normalizers.js";
import {
  matchesQuery,
  filterNotes,
  sortNotes,
  getViewLabel,
  formatDateTime,
  previewText
} from "./lib/filters.js";
import {
  deriveTitleFromContent,
  shouldStoreVersion,
  getNextUntitledTitle
} from "./lib/markdown.js";
import {
  loadUiPrefs,
  saveUiPrefs,
  loadAppState,
  saveAppState
} from "./lib/storage.js";
import NoteCard from "./components/NoteCard.jsx";
import TaskCard from "./components/TaskCard.jsx";

function createVersionSnapshot(note, savedAt) {
  return {
    id: `${note.id}-version-${savedAt}`,
    savedAt,
    title: note.title || "Untitled Note",
    content: note.content || "",
    tags: note.tags || [],
    collaborators: note.collaborators || [],
    folderId: note.folderId,
    color: note.color
  };
}

const isElectron = typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);

export default function App() {
  const [appState, setAppState] = useState(loadAppState);
  const [query, setQuery] = useState("");
  const [isCollectionCollapsed, setIsCollectionCollapsed] = useState(() => loadUiPrefs().collectionCollapsed);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(() => loadUiPrefs().inspectorCollapsed);
  const [openTabs, setOpenTabs] = useState(() => {
    const s = loadAppState();
    return s.activeId ? [s.activeId] : (s.notes[0]?.id ? [s.notes[0].id] : []);
  });
  const [sidebarSections, setSidebarSections] = useState({
    workspace: true,
    folders: true,
    collaboration: true
  });
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [folderInput, setFolderInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [showLineNumbers, setShowLineNumbers] = useState(() => loadUiPrefs().showLineNumbers);
  const [newItemText, setNewItemText] = useState("");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const checklistTitleRef = useRef(null);
  const searchRef = useRef(null);
  const titleRef = useRef(null);
  const settingsRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const { notes, folders, activeView, activeId, checklists, activeChecklistId } = appState;
  const activeChecklist = (checklists || []).find((cl) => cl.id === activeChecklistId) ?? null;
  const activeTabChecklist = openTabs.includes(activeId)
    ? (checklists || []).find((cl) => cl.id === activeId) ?? null
    : null;

  const folderMap = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder]));
  }, [folders]);

  const visibleNotes = useMemo(() => {
    const cleanedQuery = query.trim().toLowerCase();
    const candidates = cleanedQuery
      ? notes.filter((note) => matchesQuery(note, cleanedQuery))
      : filterNotes(notes, activeView);

    return sortNotes(candidates, cleanedQuery ? "search" : activeView.kind);
  }, [activeView, notes, query]);

  const activeNote = openTabs.includes(activeId)
    ? notes.find((note) => note.id === activeId) || null
    : null;

  useEffect(() => {
    if (activeId && openTabs.length > 0 && !openTabs.includes(activeId)) {
      setAppState((curr) => ({ ...curr, activeId: openTabs[openTabs.length - 1] }));
    }
  }, [openTabs, activeId]);

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    saveUiPrefs({
      collectionCollapsed: isCollectionCollapsed,
      inspectorCollapsed: isInspectorCollapsed,
      showLineNumbers
    });
  }, [isCollectionCollapsed, isInspectorCollapsed, showLineNumbers]);

  useEffect(() => {
    function handleShortcuts(event) {
      const modifier = event.metaKey || event.ctrlKey;

      if (!modifier) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (key === "n") {
        event.preventDefault();
        handleCreateNote();
      }

      if (key === "f" && event.shiftKey) {
        event.preventDefault();
        toggleFavorite();
      }

      if (key === "p" && event.shiftKey) {
        event.preventDefault();
        togglePinned();
      }
    }

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  });

  useEffect(() => {
    if (!showSettings) return;
    function handleOutside(e) {
      const inBtn = settingsBtnRef.current && settingsBtnRef.current.contains(e.target);
      const inPopover = settingsRef.current && settingsRef.current.contains(e.target);
      if (!inBtn && !inPopover) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSettings]);

  useEffect(() => {
    setIsTitleEditing(false);
  }, [activeNote?.id]);

  const noteCounts = useMemo(() => {
    const visible = notes.filter((note) => !note.isDeleted && !note.isArchived);
    const archived = notes.filter((note) => note.isArchived && !note.isDeleted);
    const trash = notes.filter((note) => note.isDeleted);
    const shared = visible.filter((note) => note.collaborators.length > 0);
    const activeTasks = (checklists || []).filter((cl) => !cl.isTrashed && !cl.isArchived);
    const archivedTasks = (checklists || []).filter((cl) => cl.isArchived && !cl.isTrashed);
    const trashedTasks = (checklists || []).filter((cl) => cl.isTrashed);

    return {
      all: visible.length + activeTasks.length,
      notes: visible.length,
      tasks: activeTasks.length,
      pinned: visible.filter((note) => note.isPinned).length,
      favorites: visible.filter((note) => note.isFavorite).length,
      shared: shared.length,
      inbound: shared.filter((note) => note.shareDirection === "inbound").length,
      outbound: shared.filter((note) => note.shareDirection !== "inbound").length,
      archive: archived.length + archivedTasks.length,
      trash: trash.length + trashedTasks.length
    };
  }, [notes, checklists]);

  const folderCounts = useMemo(() => {
    return folders.map((folder) => ({
      ...folder,
      count: notes.filter((note) => note.folderId === folder.id && !note.isDeleted && !note.isArchived).length
    }));
  }, [folders, notes]);

  const folderName = activeNote ? folderMap.get(activeNote.folderId)?.name || "Folder" : "Folder";
  const viewLabel = query.trim() ? "Search results" : getViewLabel(activeView, folders);

  function commitNote(noteId, patch) {
    setAppState((current) => {
      const savedAt = nowIso();

      return {
        ...current,
        notes: current.notes.map((note) => {
          if (note.id !== noteId) {
            return note;
          }

          const nextNote = {
            ...note,
            ...patch,
            updatedAt: savedAt
          };

          if (!shouldStoreVersion(note, nextNote)) {
            return nextNote;
          }

          return {
            ...nextNote,
            versions: [
              createVersionSnapshot(nextNote, savedAt),
              ...(note.versions || [])
            ].slice(0, MAX_VERSIONS)
          };
        })
      };
    });
  }

  function updateActiveNote(patch) {
    if (!activeNote) {
      return;
    }

    commitNote(activeNote.id, patch);
  }

  function openNoteInTab(noteId) {
    setOpenTabs((prev) => (prev.includes(noteId) ? prev : [...prev, noteId]));
    setAppState((current) => ({ ...current, activeId: noteId }));
  }

  function openChecklistInTab(clId) {
    setOpenTabs((prev) => (prev.includes(clId) ? prev : [...prev, clId]));
    setAppState((current) => ({ ...current, activeId: clId, activeChecklistId: clId }));
  }

  function closeTab(tabId) {
    setOpenTabs((prev) => {
      const next = prev.filter((id) => id !== tabId);
      const idx = prev.indexOf(tabId);
      const nextActiveId = activeId === tabId
        ? (next[idx] ?? next[idx - 1] ?? null)
        : activeId;

      setAppState((curr) => {
        const note = curr.notes.find((n) => n.id === tabId);
        const isEmpty = note &&
          note.isTitleAuto &&
          note.content === "" &&
          note.tags.length === 0 &&
          note.collaborators.length === 0;

        return {
          ...curr,
          activeId: nextActiveId,
          notes: isEmpty ? curr.notes.filter((n) => n.id !== tabId) : curr.notes
        };
      });

      return next;
    });
  }

  function pinChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === id ? { ...cl, isPinned: !cl.isPinned, updatedAt: nowIso() } : cl
      )
    }));
  }

  function favoriteChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === id ? { ...cl, isFavorite: !cl.isFavorite, updatedAt: nowIso() } : cl
      )
    }));
  }

  function trashChecklist(id) {
    setOpenTabs((prev) => {
      const next = prev.filter((tid) => tid !== id);
      setAppState((curr) => ({
        ...curr,
        checklists: (curr.checklists || []).map((cl) =>
          cl.id === id ? { ...cl, isTrashed: true, isPinned: false, updatedAt: nowIso() } : cl
        ),
        activeId: curr.activeId === id ? (next[next.length - 1] ?? null) : curr.activeId
      }));
      return next;
    });
  }

  function restoreChecklist(id) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === id ? { ...cl, isTrashed: false, isArchived: false, updatedAt: nowIso() } : cl
      )
    }));
  }

  function archiveChecklist(id) {
    setOpenTabs((prev) => {
      const next = prev.filter((tid) => tid !== id);
      setAppState((curr) => ({
        ...curr,
        checklists: (curr.checklists || []).map((cl) =>
          cl.id === id ? { ...cl, isArchived: !cl.isArchived, updatedAt: nowIso() } : cl
        ),
        activeId: curr.activeId === id ? (next[next.length - 1] ?? null) : curr.activeId
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
        activeChecklistId: curr.activeChecklistId === id ? (remaining[0]?.id ?? null) : curr.activeChecklistId
      };
    });
  }

  function handleSelectView(nextView) {
    setAppState((current) => ({
      ...current,
      activeView: nextView
    }));
    setIsCollectionCollapsed(false);
  }

  function toggleSidebarSection(sectionKey) {
    setSidebarSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey]
    }));
  }

  function createFolder() {
    const nextName = folderInput.trim();
    if (!nextName) {
      return;
    }

    const folder = normalizeFolder({
      id: createId(),
      name: nextName,
      color: "sky"
    });

    setAppState((current) => ({
      ...current,
      folders: [...current.folders, folder],
      activeView: { kind: "folder", id: folder.id }
    }));
    setFolderInput("");
  }

  function deleteFolder(folderId) {
    setAppState((current) => {
      const remainingFolders = current.folders.filter((f) => f.id !== folderId);
      const fallbackId = remainingFolders[0]?.id || null;
      const updatedNotes = current.notes.map((note) =>
        note.folderId === folderId ? { ...note, folderId: fallbackId } : note
      );
      const nextView =
        current.activeView.kind === "folder" && current.activeView.id === folderId
          ? { kind: "all" }
          : current.activeView;
      return { ...current, folders: remainingFolders, notes: updatedNotes, activeView: nextView };
    });
  }

  function createChecklist() {
    const cl = normalizeChecklist({ id: createId(), title: "", items: [] });
    setOpenTabs((prev) => [...prev, cl.id]);
    setAppState((curr) => ({
      ...curr,
      checklists: [...(curr.checklists || []), cl],
      activeChecklistId: cl.id,
      activeId: cl.id
    }));
    window.requestAnimationFrame(() => checklistTitleRef.current?.focus());
  }

  function deleteChecklist(id) {
    setAppState((curr) => {
      const remaining = (curr.checklists || []).filter((c) => c.id !== id);
      return {
        ...curr,
        checklists: remaining,
        activeChecklistId: curr.activeChecklistId === id ? (remaining[0]?.id ?? null) : curr.activeChecklistId
      };
    });
  }

  function updateChecklistTitle(id, title) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === id ? { ...cl, title, updatedAt: nowIso() } : cl
      )
    }));
  }

  function addChecklistItem(checklistId, text) {
    if (!text.trim()) return;
    const item = normalizeChecklistItem({ id: createId(), text: text.trim(), done: false });
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: [...cl.items, item], updatedAt: nowIso() }
          : cl
      )
    }));
  }

  function toggleChecklistItem(checklistId, itemId) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
              updatedAt: nowIso()
            }
          : cl
      )
    }));
  }

  function deleteChecklistItem(checklistId, itemId) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((item) => item.id !== itemId), updatedAt: nowIso() }
          : cl
      )
    }));
  }

  function updateChecklistItemText(checklistId, itemId, text) {
    setAppState((curr) => ({
      ...curr,
      checklists: (curr.checklists || []).map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId ? { ...item, text } : item
              ),
              updatedAt: nowIso()
            }
          : cl
      )
    }));
  }

  function handleCreateNote() {
    const defaultFolder = activeView.kind === "folder" ? activeView.id : folders[0]?.id;
    const note = normalizeNote(
      {
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
        versions: []
      },
      folders
    );

    setAppState((current) => ({
      ...current,
      notes: [note, ...current.notes],
      activeId: note.id
    }));

    setOpenTabs((prev) => (prev.includes(note.id) ? prev : [...prev, note.id]));

    window.requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
  }

  function handleDuplicateNote() {
    if (!activeNote) {
      return;
    }

    const duplicate = normalizeNote(
      {
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
        versions: []
      },
      folders
    );

    setAppState((current) => ({
      ...current,
      notes: [duplicate, ...current.notes],
      activeId: duplicate.id
    }));
  }

  function togglePinned() {
    if (!activeNote) {
      return;
    }

    updateActiveNote({ isPinned: !activeNote.isPinned });
  }

  function toggleFavorite() {
    if (!activeNote) {
      return;
    }

    updateActiveNote({ isFavorite: !activeNote.isFavorite });
  }

  function toggleArchive() {
    if (!activeNote) {
      return;
    }

    updateActiveNote({ isArchived: !activeNote.isArchived });
  }

  function sendToTrash() {
    if (!activeNote) {
      return;
    }

    updateActiveNote({
      isDeleted: true,
      isArchived: false
    });
  }

  function restoreFromTrash() {
    if (!activeNote) {
      return;
    }

    updateActiveNote({
      isDeleted: false
    });
  }

  function deleteForever() {
    if (!activeNote) {
      return;
    }

    const deletedId = activeNote.id;
    setOpenTabs((prev) => prev.filter((id) => id !== deletedId));

    setAppState((current) => {
      const remaining = current.notes.filter((note) => note.id !== deletedId);

      return {
        ...current,
        notes: remaining,
        activeId: remaining[0]?.id ?? null
      };
    });
  }

  function handleTitleChange(value) {
    if (!activeNote) {
      return;
    }

    updateActiveNote({
      title: value,
      isTitleAuto: value.trim() ? false : true
    });
  }

  function handleBodyChange(value) {
    if (!activeNote) {
      return;
    }

    if (activeNote.isTitleAuto) {
      updateActiveNote({
        content: value,
        title: deriveTitleFromContent(value),
        isTitleAuto: true
      });
      return;
    }

    updateActiveNote({ content: value });
  }

  function addCollaborator() {
    if (!activeNote) {
      return;
    }

    const normalizedHandle = normalizeHandle(collaboratorInput);
    if (!normalizedHandle) {
      return;
    }

    const nextCollaborators = activeNote.collaborators.includes(normalizedHandle)
      ? activeNote.collaborators
      : [...activeNote.collaborators, normalizedHandle];

    updateActiveNote({
      collaborators: nextCollaborators,
      shareDirection: nextCollaborators.length > 0 ? "outbound" : null
    });
    setCollaboratorInput("");
  }

  function removeCollaborator(handleToRemove) {
    if (!activeNote) {
      return;
    }

    updateActiveNote({
      collaborators: activeNote.collaborators.filter((handle) => handle !== handleToRemove),
      shareDirection:
        activeNote.collaborators.filter((handle) => handle !== handleToRemove).length > 0
          ? activeNote.shareDirection || "outbound"
          : null
    });
  }

  function restoreVersion(version) {
    if (!activeNote) {
      return;
    }

    const savedAt = nowIso();
    const currentSnapshot = createVersionSnapshot(activeNote, savedAt);
    const restoredCollaborators = version.collaborators || [];

    setAppState((current) => ({
      ...current,
      notes: current.notes.map((note) => {
        if (note.id !== activeNote.id) {
          return note;
        }

        return {
          ...note,
          title: version.title || "Untitled Note",
          content: version.content || "",
          tags: version.tags || [],
          collaborators: restoredCollaborators,
          shareDirection:
            restoredCollaborators.length > 0
              ? note.shareDirection || "outbound"
              : null,
          folderId: version.folderId || note.folderId,
          color: version.color || note.color,
          isTitleAuto: !version.title || version.title === deriveTitleFromContent(version.content || ""),
          updatedAt: savedAt,
          versions: [currentSnapshot, ...(note.versions || [])].slice(0, MAX_VERSIONS)
        };
      })
    }));
  }

  return (
    <main className={`app-shell${isElectron ? ' electron-app' : ''}`}>
      <section className="notes-app" aria-label="Polished notes app">
        <div className={`workspace-grid${isCollectionCollapsed ? " collection-collapsed" : ""}${isInspectorCollapsed ? " inspector-collapsed" : ""}`}>
          <nav className="sidebar" aria-label="Navigation">
            <div className="sidebar-body">
            <button
              type="button"
              className="sidebar-search-trigger"
              aria-label="Open search"
              onClick={() => {
                if (isCollectionCollapsed) setIsCollectionCollapsed(false);
                window.requestAnimationFrame(() => searchRef.current?.focus());
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search
            </button>

            <div className="sidebar-section">
              <button
                type="button"
                className={`section-heading${sidebarSections.workspace ? " open" : ""}`}
                aria-label={sidebarSections.workspace ? "Collapse workspace" : "Expand workspace"}
                onClick={() => toggleSidebarSection("workspace")}
              >
                <div className="section-heading-copy">
                  <p className="eyebrow">Workspace</p>
                  <span>{noteCounts.notes} notes · {noteCounts.tasks} tasks</span>
                </div>
                <span className="section-toggle-arrow" aria-hidden="true">▾</span>
              </button>

              {sidebarSections.workspace && (
                <div className="sidebar-section-body">
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "all" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "all" })}
                  >
                    <span>All</span>
                    <strong>{noteCounts.all}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "notes" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "notes" })}
                  >
                    <span>Notes</span>
                    <strong>{noteCounts.notes}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "tasks" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "tasks" })}
                  >
                    <span>Tasks</span>
                    <strong>{noteCounts.tasks || ""}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "pinned" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "pinned" })}
                  >
                    <span>Pinned</span>
                    <strong>{noteCounts.pinned}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "favorites" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "favorites" })}
                  >
                    <span>Favorites</span>
                    <strong>{noteCounts.favorites}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "archive" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "archive" })}
                  >
                    <span>Archive</span>
                    <strong>{noteCounts.archive}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "trash" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "trash" })}
                  >
                    <span>Trash</span>
                    <strong>{noteCounts.trash}</strong>
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button
                type="button"
                className={`section-heading${sidebarSections.folders ? " open" : ""}`}
                aria-label={sidebarSections.folders ? "Collapse folders" : "Expand folders"}
                onClick={() => toggleSidebarSection("folders")}
              >
                <div className="section-heading-copy">
                  <p className="eyebrow">Folders</p>
                  <span>{folders.length} spaces</span>
                </div>
                <span className="section-toggle-arrow" aria-hidden="true">▾</span>
              </button>

              {sidebarSections.folders && (
                <div className="sidebar-section-body">
                  <div className="sidebar-inline-form">
                    <div className="search-box">
                      <span className="search-box-icon" aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                      <input
                        aria-label="Folder name"
                        value={folderInput}
                        onChange={(event) => setFolderInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            createFolder();
                          }
                        }}
                        placeholder="New folder"
                      />
                    </div>
                    <button
                      type="button"
                      className="ghost-action inline-add"
                      onClick={createFolder}
                      aria-label="Add folder"
                    >
                      +
                    </button>
                  </div>
                  {folderCounts.map((folder) => (
                    <div
                      key={folder.id}
                      className={`nav-item folder-item ${
                        activeView.kind === "folder" && activeView.id === folder.id ? "active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="folder-select"
                        onClick={() => handleSelectView({ kind: "folder", id: folder.id })}
                      >
                        <span className={`folder-dot folder-${folder.color}`} aria-hidden="true" />
                        {folder.name}
                      </button>
                      <div className="folder-item-right">
                        <strong>{folder.count}</strong>
                        <button
                          type="button"
                          className="folder-delete"
                          aria-label={`Delete folder ${folder.name}`}
                          onClick={() => deleteFolder(folder.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button
                type="button"
                className={`section-heading${sidebarSections.collaboration ? " open" : ""}`}
                aria-label={sidebarSections.collaboration ? "Collapse collaboration" : "Expand collaboration"}
                onClick={() => toggleSidebarSection("collaboration")}
              >
                <div className="section-heading-copy">
                  <p className="eyebrow">Collaboration</p>
                  <span>{noteCounts.shared} shared</span>
                </div>
                <span className="section-toggle-arrow" aria-hidden="true">▾</span>
              </button>

              {sidebarSections.collaboration && (
                <div className="sidebar-section-body">
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "shared" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "shared" })}
                  >
                    <span>All shared</span>
                    <strong>{noteCounts.shared}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "inbound" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "inbound" })}
                  >
                    <span>Shared to you</span>
                    <strong>{noteCounts.inbound}</strong>
                  </button>
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "outbound" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "outbound" })}
                  >
                    <span>Shared by you</span>
                    <strong>{noteCounts.outbound}</strong>
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar-callout">
              <p className="eyebrow">Quick keys</p>
              <ul>
                <li>
                  <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> focus search
                </li>
                <li>
                  <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> new note
                </li>
                <li>
                  <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> favorite
                </li>
              </ul>
            </div>
            </div>

            <div className="sidebar-footer">
              <button
                ref={settingsBtnRef}
                type="button"
                className={`settings-btn${showSettings ? " open" : ""}`}
                aria-label="Appearance settings"
                onClick={() => {
                  if (!showSettings) {
                    const rect = settingsBtnRef.current?.getBoundingClientRect();
                    if (rect) setSettingsAnchor({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
                  }
                  setShowSettings((v) => !v);
                }}
              >
                ⚙
              </button>
              {showSettings && settingsAnchor && createPortal(
                <div
                  ref={settingsRef}
                  className="settings-popover"
                  style={{ position: "fixed", bottom: settingsAnchor.bottom, left: settingsAnchor.left }}
                >
                  <div>
                    <p className="settings-group-label">Editor</p>
                    <div className="settings-row">
                      <span className="settings-row-label">Line numbers</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showLineNumbers}
                        className={`toggle-pill${showLineNumbers ? " on" : ""}`}
                        onClick={() => setShowLineNumbers((v) => !v)}
                        aria-label="Toggle line numbers"
                      >
                        <span className="toggle-pill-thumb" />
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </nav>

          <section className={`list-panel${isCollectionCollapsed ? " list-panel--collapsed" : ""}`} aria-label="Notes list">
            <div className="collection-toggle-row">
              <button
                type="button"
                className="collection-toggle-btn"
                onClick={() => setIsCollectionCollapsed((v) => !v)}
                aria-label={isCollectionCollapsed ? "Expand collection" : "Collapse collection"}
                title="Collection"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            </div>
            <div className="list-panel-content">
              {activeView.kind === "tasks" ? (
                <>
                  <div className="collection-panel-actions">
                    <button type="button" className="ghost-action" onClick={createChecklist} aria-label="New checklist">
                      +
                    </button>
                  </div>
                  <div className="note-list" role="list">
                    {(() => {
                      const active = [...(checklists || [])]
                        .filter((cl) => !cl.isTrashed && !cl.isArchived)
                        .sort((a, b) => {
                          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
                          return new Date(b.updatedAt) - new Date(a.updatedAt);
                        });
                      return active.length > 0 ? active.map((cl) => (
                        <TaskCard
                          key={cl.id}
                          checklist={cl}
                          isActive={cl.id === activeId && !!activeTabChecklist}
                          onOpen={() => openChecklistInTab(cl.id)}
                          onTrash={() => trashChecklist(cl.id)}
                        />
                      )) : (
                        <div className="empty-state">
                          <h3>No tasks yet</h3>
                          <p>Create a task list to start tracking your work.</p>
                          <button type="button" className="primary-action" onClick={createChecklist}>
                            New task list
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <div className="search collection-search">
                    <div className="search-box">
                      <span className="search-box-icon" aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        ref={searchRef}
                        id="note-search"
                        aria-label="Search notes"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {query.trim() ? (
                    <>
                      <div className="collection-panel-actions">
                        <span>Across workspace</span>
                      </div>
                      <div className="panel-summary" aria-label="Note statistics">
                        <span>{visibleNotes.length} matches</span>
                        <span>{notes.length} total notes</span>
                        <span>Includes archive and trash</span>
                      </div>
                      <div className="note-list" role="list">
                        {visibleNotes.length > 0 ? visibleNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            isActive={note.id === activeNote?.id}
                            onClick={() => openNoteInTab(note.id)}
                            formatDateTime={formatDateTime}
                            previewText={previewText}
                          />
                        )) : (
                          <div className="empty-state">
                            <h3>No results</h3>
                            <p>No notes matched your search.</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : activeView.kind === "trash" ? (
                    <div className="note-list" role="list">
                      {(() => {
                        const trashedNotes = notes.filter((n) => n.isDeleted);
                        const trashedTasks = (checklists || []).filter((cl) => cl.isTrashed);
                        const hasAny = trashedNotes.length > 0 || trashedTasks.length > 0;
                        if (!hasAny) {
                          return (
                            <div className="empty-state">
                              <h3>Trash is empty</h3>
                              <p>Deleted notes and tasks appear here.</p>
                            </div>
                          );
                        }
                        return (
                          <>
                            {trashedNotes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                isActive={note.id === activeNote?.id}
                                onClick={() => openNoteInTab(note.id)}
                                formatDateTime={formatDateTime}
                                previewText={previewText}
                              />
                            ))}
                            {trashedTasks.map((cl) => (
                              <div key={cl.id} className="note-card checklist-card unified-card">
                                <div className="unified-card-body">
                                  <strong>{cl.title || <em style={{ opacity: 0.45 }}>Untitled task</em>}</strong>
                                  <p>{cl.items.length === 0 ? "No items" : `${cl.items.length} item${cl.items.length !== 1 ? "s" : ""}`}</p>
                                </div>
                                <div className="unified-card-actions">
                                  <button type="button" className="ghost-action" onClick={() => restoreChecklist(cl.id)}>Restore</button>
                                  <button type="button" className="danger-action" onClick={() => permanentlyDeleteChecklist(cl.id)}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  ) : activeView.kind === "archive" ? (
                    <div className="note-list" role="list">
                      {(() => {
                        const archivedNotes = notes.filter((n) => n.isArchived && !n.isDeleted);
                        const archivedTasks = (checklists || []).filter((cl) => cl.isArchived && !cl.isTrashed);
                        const hasAny = archivedNotes.length > 0 || archivedTasks.length > 0;
                        if (!hasAny) {
                          return (
                            <div className="empty-state">
                              <h3>Archive is empty</h3>
                              <p>Archived notes and tasks appear here.</p>
                            </div>
                          );
                        }
                        return (
                          <>
                            {archivedNotes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                isActive={note.id === activeNote?.id}
                                onClick={() => openNoteInTab(note.id)}
                                formatDateTime={formatDateTime}
                                previewText={previewText}
                              />
                            ))}
                            {archivedTasks.map((cl) => (
                              <div key={cl.id} className="note-card checklist-card unified-card">
                                <div className="unified-card-body">
                                  <strong>{cl.title || <em style={{ opacity: 0.45 }}>Untitled task</em>}</strong>
                                  <p>{cl.items.length === 0 ? "No items" : `${cl.items.length} item${cl.items.length !== 1 ? "s" : ""}`}</p>
                                </div>
                                <div className="unified-card-actions">
                                  <button type="button" className="ghost-action" onClick={() => restoreChecklist(cl.id)}>Restore</button>
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  ) : activeView.kind === "all" ? (
                    <>
                      <div className="panel-summary" aria-label="Note statistics">
                        <span>{noteCounts.notes} notes</span>
                        <span>{noteCounts.tasks} tasks</span>
                      </div>
                      <div className="note-list" role="list">
                        {(() => {
                          const activeTasks = [...(checklists || [])]
                            .filter((cl) => !cl.isTrashed && !cl.isArchived);
                          const allItems = [...visibleNotes, ...activeTasks].sort(
                            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                          );
                          if (allItems.length === 0) {
                            return (
                              <div className="empty-state">
                                <h3>Nothing here yet</h3>
                                <p>Create a note or task to get started.</p>
                                <button type="button" className="primary-action" onClick={handleCreateNote}>
                                  Create note
                                </button>
                              </div>
                            );
                          }
                          return allItems.map((item) => {
                            const isTask = "items" in item;
                            if (isTask) {
                              return (
                                <TaskCard
                                  key={item.id}
                                  checklist={item}
                                  isActive={item.id === activeId && !!activeTabChecklist}
                                  onOpen={() => openChecklistInTab(item.id)}
                                  showTaskTag
                                />
                              );
                            }
                            return (
                              <NoteCard
                                key={item.id}
                                note={item}
                                isActive={item.id === activeNote?.id}
                                onClick={() => openNoteInTab(item.id)}
                                formatDateTime={formatDateTime}
                                previewText={previewText}
                              />
                            );
                          });
                        })()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="panel-summary" aria-label="Note statistics">
                        {["shared", "inbound", "outbound"].includes(activeView.kind) ? (
                          <>
                            <span>{noteCounts.shared} shared notes</span>
                            <span>{noteCounts.outbound} shared by you</span>
                            <span>{noteCounts.inbound} shared to you</span>
                          </>
                        ) : null}
                      </div>
                      <div className="note-list" role="list">
                        {visibleNotes.length > 0 ? (
                          visibleNotes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              isActive={note.id === activeNote?.id}
                              onClick={() => openNoteInTab(note.id)}
                              formatDateTime={formatDateTime}
                              previewText={previewText}
                            />
                          ))
                        ) : (
                          <div className="empty-state">
                            <h3>No notes here yet</h3>
                            <p>Create a note in this view or clear your search to see more results.</p>
                            <button type="button" className="primary-action" onClick={handleCreateNote}>
                              Create note
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="editor-panel" aria-label="Note editor">
            <div className="tab-bar">
              <div className="tab-list" role="tablist">
                {openTabs.map((tabId) => {
                  const tabNote = notes.find((n) => n.id === tabId);
                  const tabCl = !tabNote ? (checklists || []).find((cl) => cl.id === tabId) : null;
                  if (!tabNote && !tabCl) return null;
                  const isActive = tabId === activeId;
                  const tabTitle = tabNote
                    ? (tabNote.title || "Untitled Note")
                    : (tabCl.title || "Untitled checklist");
                  return (
                    <div key={tabId} className={`tab${isActive ? " active" : ""}`} role="tab">
                      <button
                        type="button"
                        className="tab-label"
                        onClick={() => tabNote ? openNoteInTab(tabId) : openChecklistInTab(tabId)}
                        aria-selected={isActive}
                      >
                        {tabTitle}
                      </button>
                      <button
                        type="button"
                        className="tab-close"
                        onClick={() => closeTab(tabId)}
                        aria-label={`Close ${tabTitle}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="tab-bar-end">
                <button type="button" className="tab-new-btn" onClick={handleCreateNote} aria-label="New note">
                  +
                </button>
              </div>
            </div>

          <div className="editor-scroll">
            {openTabs.length === 0 ? (
              <div className="empty-state editor-empty editor-welcome">
                <p className="editor-welcome-label">Start something new</p>
                <div className="editor-welcome-actions">
                  <button type="button" className="primary-action" onClick={handleCreateNote}>
                    Create Note
                  </button>
                  <button
                    type="button"
                    className="ghost-action"
                    onClick={() => {
                      handleSelectView({ kind: "tasks" });
                      createChecklist();
                    }}
                  >
                    Create Task
                  </button>
                </div>
              </div>
            ) : activeTabChecklist ? (
                <div className="checklist-editor">
                  <input
                    ref={checklistTitleRef}
                    className="checklist-editor-title"
                    value={activeTabChecklist.title}
                    onChange={(e) => updateChecklistTitle(activeTabChecklist.id, e.target.value)}
                    placeholder="Name this list…"
                    aria-label="Checklist title"
                  />

                  <div className="checklist-add-row">
                    <span className="checklist-add-icon" aria-hidden="true">+</span>
                    <input
                      className="checklist-add-input"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newItemText.trim()) {
                          e.preventDefault();
                          addChecklistItem(activeTabChecklist.id, newItemText);
                          setNewItemText("");
                        }
                      }}
                      placeholder="Add an item…"
                      aria-label="New checklist item"
                    />
                  </div>

                  <div className="checklist-items">
                    {[
                      ...activeTabChecklist.items.filter((i) => !i.done),
                      ...activeTabChecklist.items.filter((i) => i.done)
                    ].map((item) => (
                      <div key={item.id} className={`checklist-item${item.done ? " done" : ""}`}>
                        <button
                          type="button"
                          className="checklist-checkbox"
                          role="checkbox"
                          aria-checked={item.done}
                          aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                          onClick={() => toggleChecklistItem(activeTabChecklist.id, item.id)}
                        >
                          {item.done && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </button>
                        <input
                          className="checklist-item-text"
                          value={item.text}
                          onChange={(e) => updateChecklistItemText(activeTabChecklist.id, item.id, e.target.value)}
                          aria-label="Item text"
                        />
                        <button
                          type="button"
                          className="checklist-item-delete"
                          aria-label="Delete item"
                          onClick={() => deleteChecklistItem(activeTabChecklist.id, item.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {activeTabChecklist.items.length > 0 && (
                    <div className="checklist-progress">
                      <div
                        className="checklist-progress-bar"
                        style={{ width: `${Math.round((activeTabChecklist.items.filter((i) => i.done).length / activeTabChecklist.items.length) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
            ) : activeNote ? (
              <>
                <label className="editor-field editor-title">
                  <span>Title</span>
                  <input
                    ref={titleRef}
                    value={activeNote.isTitleAuto && isTitleEditing ? "" : activeNote.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    onClick={() => { if (activeNote.isTitleAuto) setIsTitleEditing(true); }}
                    onBlur={() => setIsTitleEditing(false)}
                    placeholder={activeNote.title || "Untitled Note"}
                  />
                </label>

                <label className={`editor-field editor-body${showLineNumbers ? " show-line-numbers" : ""}`}>
                  <span>Body</span>
                  <div className="editor-body-inner">
                    {showLineNumbers && (
                      <div
                        className="line-numbers-gutter"
                        ref={lineNumbersRef}
                        aria-hidden="true"
                      >
                        {activeNote.content.split("\n").map((_, i) => (
                          <div key={i} className="line-number">{i + 1}</div>
                        ))}
                      </div>
                    )}
                    <textarea
                      aria-label="Body"
                      value={activeNote.content}
                      onChange={(event) => handleBodyChange(event.target.value)}
                      onScroll={(event) => {
                        if (lineNumbersRef.current) {
                          lineNumbersRef.current.scrollTop = event.target.scrollTop;
                        }
                      }}
                      placeholder="Write your note here."
                      rows={14}
                    />
                  </div>
                </label>
              </>
            ) : activeView.kind === "tasks" ? (
              <div className="empty-state editor-empty">
                <h3>No checklist open</h3>
                <p>Pick a checklist from the list or create a new one.</p>
                <button type="button" className="primary-action" onClick={createChecklist}>
                  New checklist
                </button>
              </div>
            ) : (
              <div className="empty-state editor-empty">
                <h3>No note selected</h3>
                <p>Create a note or choose one from the list to start editing.</p>
                <button type="button" className="primary-action" onClick={handleCreateNote}>
                  Create note
                </button>
              </div>
            )}
          </div>

          <div className="editor-footer" aria-label="Document statistics">
            {activeNote && (
              <>
                <div className="editor-footer-stats">
                  <span>Lines: <strong>{activeNote.content.split("\n").length}</strong></span>
                  <span>Words: <strong>{activeNote.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0}</strong></span>
                  <span>Characters: <strong>{activeNote.content.length}</strong></span>
                </div>
                <div className="editor-footer-right">
                  <span>{formatDateTime(activeNote.updatedAt)}</span>
                </div>
              </>
            )}
          </div>
          </section>

          <section
            className={`inspector-panel${isInspectorCollapsed ? " inspector-panel--collapsed" : ""}`}
            aria-label="Inspector"
          >
            <div className="inspector-toggle-row">
              <button
                type="button"
                className={`inspector-toggle-btn${!isInspectorCollapsed ? " active" : ""}`}
                onClick={() => setIsInspectorCollapsed((v) => !v)}
                aria-label={isInspectorCollapsed ? "Expand inspector" : "Collapse inspector"}
                title="Inspector"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="3" x2="16" y2="21" />
                </svg>
              </button>
            </div>
            <div className="inspector-content">
              {activeTabChecklist ? (
                <>
                  <div className="inspector-head">
                    <p className="eyebrow">Inspector</p>
                    <span className="inspector-note-location">Tasks</span>
                  </div>

                  <div className="inspector-actions">
                    <button type="button" className="ghost-action" onClick={() => pinChecklist(activeTabChecklist.id)}>
                      {activeTabChecklist.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" className="ghost-action" onClick={() => favoriteChecklist(activeTabChecklist.id)}>
                      {activeTabChecklist.isFavorite ? "Unfavorite" : "Favorite"}
                    </button>
                    <button type="button" className="ghost-action" onClick={() => archiveChecklist(activeTabChecklist.id)}>
                      {activeTabChecklist.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    {activeTabChecklist.isTrashed ? (
                      <>
                        <button type="button" className="ghost-action" onClick={() => restoreChecklist(activeTabChecklist.id)}>
                          Restore
                        </button>
                        <button type="button" className="danger-action" onClick={() => permanentlyDeleteChecklist(activeTabChecklist.id)}>
                          Delete forever
                        </button>
                      </>
                    ) : (
                      <button type="button" className="danger-action" onClick={() => trashChecklist(activeTabChecklist.id)}>
                        Move to trash
                      </button>
                    )}
                  </div>

                  <details className="editor-drawer" open>
                    <summary>Details</summary>
                    <div className="drawer-grid">
                      <div className="drawer-stack">
                        <span className="eyebrow">Progress</span>
                        <span>
                          {activeTabChecklist.items.length === 0
                            ? "No items"
                            : `${activeTabChecklist.items.filter((i) => i.done).length} of ${activeTabChecklist.items.length} done`}
                        </span>
                      </div>
                      <div className="drawer-stack">
                        <span className="eyebrow">Created</span>
                        <span>{formatDateTime(activeTabChecklist.createdAt)}</span>
                      </div>
                      <div className="drawer-stack">
                        <span className="eyebrow">Updated</span>
                        <span>{formatDateTime(activeTabChecklist.updatedAt)}</span>
                      </div>
                    </div>
                  </details>
                </>
              ) : activeNote ? (
                <>
                  <div className="inspector-head">
                    <p className="eyebrow">Inspector</p>
                    <span className="inspector-note-location">{folderName}</span>
                  </div>

                  <div className="inspector-actions">
                    <button type="button" className="ghost-action" onClick={togglePinned}>
                      {activeNote.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button type="button" className="ghost-action" onClick={toggleFavorite}>
                      {activeNote.isFavorite ? "Unfavorite" : "Favorite"}
                    </button>
                    <button type="button" className="ghost-action" onClick={toggleArchive}>
                      {activeNote.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    {activeNote.isDeleted ? (
                      <>
                        <button type="button" className="ghost-action" onClick={restoreFromTrash}>
                          Restore
                        </button>
                        <button type="button" className="danger-action" onClick={deleteForever}>
                          Delete forever
                        </button>
                      </>
                    ) : (
                      <button type="button" className="danger-action" onClick={sendToTrash}>
                        Move to trash
                      </button>
                    )}
                    <button type="button" className="ghost-action" onClick={handleDuplicateNote}>
                      Duplicate
                    </button>
                  </div>

                  <details className="editor-drawer" aria-label="Tags" open>
                    <summary>Tags</summary>
                    <div className="share-row drawer-body">
                      <div className="share-controls">
                        <input
                          aria-label="Tag name"
                          value={tagInput}
                          onChange={(event) => setTagInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                              event.preventDefault();
                              const nextTag = normalizeTagValue(tagInput);
                              if (!nextTag || activeNote.tags.includes(nextTag) || activeNote.tags.length >= 12) {
                                setTagInput("");
                                return;
                              }
                              updateActiveNote({ tags: [...activeNote.tags, nextTag] });
                              setTagInput("");
                            }
                          }}
                          placeholder="meeting-notes"
                        />
                        <button
                          type="button"
                          className="ghost-action"
                          onClick={() => {
                            const nextTag = normalizeTagValue(tagInput);
                            if (!nextTag || activeNote.tags.includes(nextTag) || activeNote.tags.length >= 12) {
                              setTagInput("");
                              return;
                            }
                            updateActiveNote({ tags: [...activeNote.tags, nextTag] });
                            setTagInput("");
                          }}
                        >
                          Add tag
                        </button>
                      </div>
                      <div className="share-chips">
                        {activeNote.tags.length > 0 ? (
                          activeNote.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className="share-chip"
                              onClick={() => updateActiveNote({ tags: activeNote.tags.filter((item) => item !== tag) })}
                              aria-label={`Remove tag ${tag}`}
                            >
                              <span>{tag}</span>
                              <span aria-hidden="true">×</span>
                            </button>
                          ))
                        ) : (
                          <p className="share-empty">Add tags to keep related notes grouped together.</p>
                        )}
                      </div>
                    </div>
                  </details>

                  <details className="editor-drawer" aria-label="Note details">
                    <summary>Details</summary>
                    <div className="drawer-grid">
                      <label className="editor-field">
                        <span>Folder</span>
                        <select
                          value={activeNote.folderId}
                          onChange={(event) => updateActiveNote({ folderId: event.target.value })}
                        >
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="drawer-stack">
                        <span className="eyebrow">Color</span>
                        <div className="color-row compact" aria-label="Color picker">
                          {colorOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`color-chip ${activeNote.color === option.value ? "selected" : ""}`}
                              style={{ "--chip-color": option.swatch }}
                              aria-label={`Set color ${option.label}`}
                              onClick={() => updateActiveNote({ color: option.value })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="editor-drawer" aria-label="Collaborators">
                    <summary>
                      Collaborators
                      <span>{activeNote.collaborators.length > 0 ? activeNote.collaborators.length : "Private"}</span>
                    </summary>
                    <div className="share-row drawer-body">
                      <div className="share-controls">
                        <input
                          aria-label="Collaborator handle"
                          value={collaboratorInput}
                          onChange={(event) => setCollaboratorInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addCollaborator();
                            }
                          }}
                          placeholder="@teammate"
                        />
                        <button type="button" className="ghost-action" onClick={addCollaborator}>
                          Share note
                        </button>
                      </div>
                      <div className="share-chips">
                        {activeNote.collaborators.length > 0 ? (
                          activeNote.collaborators.map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              className="share-chip"
                              onClick={() => removeCollaborator(handle)}
                              aria-label={`Remove ${handle}`}
                            >
                              <span>{handle}</span>
                              <span aria-hidden="true">×</span>
                            </button>
                          ))
                        ) : (
                          <p className="share-empty">Add a handle when the note needs collaborators.</p>
                        )}
                      </div>
                    </div>
                  </details>

                  <details className="editor-drawer" aria-label="Version history">
                    <summary>
                      History
                      <span>{activeNote.versions.length}</span>
                    </summary>
                    <div className="history-list">
                      {activeNote.versions.length > 0 ? (
                        activeNote.versions.slice(0, 6).map((version) => (
                          <div key={version.id} className="history-item">
                            <div>
                              <strong>{version.title || "Untitled Note"}</strong>
                              <span>{formatDateTime(version.savedAt)}</span>
                            </div>
                            <button
                              type="button"
                              className="ghost-action"
                              aria-label={`Restore version from ${formatDateTime(version.savedAt)}`}
                              onClick={() => restoreVersion(version)}
                            >
                              Restore
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="share-empty">Restore points will appear after note changes.</p>
                      )}
                    </div>
                  </details>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
