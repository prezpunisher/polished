import { STORAGE_KEY, UI_KEY } from "./constants.js";
import { normalizeFolder, normalizeNote, normalizeChecklist } from "./normalizers.js";
import { folderSeed, seedNotes, checklistSeed } from "./seed.js";

function normalizeView(view) {
  if (!view || typeof view !== "object") {
    return { kind: "all" };
  }

  if (view.kind === "folder" && typeof view.id === "string") {
    return { kind: "folder", id: view.id };
  }

  if (
    ["all", "notes", "tasks", "pinned", "favorites", "shared", "inbound", "outbound", "archive", "trash"].includes(
      view.kind
    )
  ) {
    return { kind: view.kind };
  }

  return { kind: "all" };
}

const defaultSidebarSections = { workspace: true, folders: true, collaboration: true };

export function loadUiPrefs() {
  try {
    const stored = window.localStorage?.getItem(UI_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      return {
        collectionCollapsed: Boolean(p.collectionCollapsed),
        inspectorCollapsed: Boolean(p.inspectorCollapsed),
        showLineNumbers: Boolean(p.showLineNumbers),
        sidebarSections: {
          ...defaultSidebarSections,
          ...(p.sidebarSections && typeof p.sidebarSections === "object" ? p.sidebarSections : {})
        }
      };
    }
  } catch {}
  return {
    collectionCollapsed: false,
    inspectorCollapsed: false,
    showLineNumbers: false,
    sidebarSections: defaultSidebarSections
  };
}

export function saveUiPrefs(prefs) {
  try {
    window.localStorage.setItem(UI_KEY, JSON.stringify(prefs));
  } catch {}
}

export function createDefaultState() {
  const notes = seedNotes.map((note) => normalizeNote(note));
  const checklists = checklistSeed.map(normalizeChecklist);

  return {
    activeView: { kind: "all" },
    activeId: notes[0]?.id ?? null,
    activeChecklistId: checklists[0]?.id ?? null,
    folders: folderSeed.map(normalizeFolder),
    notes,
    checklists
  };
}

export function loadAppState() {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return createDefaultState();
    }

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      const notes = parsed.map((note) => normalizeNote(note));

      return {
        ...createDefaultState(),
        notes,
        activeId: notes[0]?.id ?? null
      };
    }

    if (parsed && typeof parsed === "object") {
      const folders = Array.isArray(parsed.folders)
        ? parsed.folders.map((folder, index) => normalizeFolder(folder, index))
        : folderSeed.map(normalizeFolder);
      const notes = Array.isArray(parsed.notes)
        ? parsed.notes.map((note) => normalizeNote(note, folders))
        : createDefaultState().notes;

      const checklists = Array.isArray(parsed.checklists)
        ? parsed.checklists.map(normalizeChecklist)
        : createDefaultState().checklists;

      return {
        activeView: normalizeView(parsed.activeView),
        activeId: typeof parsed.activeId === "string" ? parsed.activeId : notes[0]?.id ?? null,
        activeChecklistId: typeof parsed.activeChecklistId === "string" ? parsed.activeChecklistId : checklists[0]?.id ?? null,
        folders,
        notes,
        checklists
      };
    }
  } catch {
    return createDefaultState();
  }

  return createDefaultState();
}

export function saveAppState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
