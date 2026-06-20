import { createId, nowIso } from "./constants.js";
import { folderSeed } from "./seed.js";

export function normalizeHandle(value) {
  const cleanedValue = value.trim().replace(/^@+/, "").replace(/\s+/g, "_").toLowerCase();

  return cleanedValue ? `@${cleanedValue}` : "";
}

export function normalizeTagValue(value) {
  return value.trim().replace(/^#+/, "").replace(/\s+/g, "-").toLowerCase();
}

export function normalizeFolder(folder, fallbackIndex = 0) {
  return {
    id: folder.id || `folder-${fallbackIndex}`,
    name: folder.name || "Folder",
    color: folder.color || "amber"
  };
}

export function normalizeChecklistItem(item) {
  return {
    id: item.id || createId(),
    text: typeof item.text === "string" ? item.text : "",
    done: Boolean(item.done),
    createdAt: item.createdAt || nowIso()
  };
}

export function normalizeChecklist(cl) {
  return {
    id: cl.id || createId(),
    title: typeof cl.title === "string" ? cl.title : "",
    items: Array.isArray(cl.items) ? cl.items.map(normalizeChecklistItem) : [],
    isPinned: Boolean(cl.isPinned),
    isFavorite: Boolean(cl.isFavorite),
    isTrashed: Boolean(cl.isTrashed),
    isArchived: Boolean(cl.isArchived),
    createdAt: cl.createdAt || nowIso(),
    updatedAt: cl.updatedAt || nowIso()
  };
}

export function normalizeNote(note, folders = folderSeed) {
  const fallbackFolderId = folders[0]?.id || "folder-default";
  const legacyPinned = note.pinned ?? note.isPinned;
  const hasExplicitAutoFlag = typeof note.isTitleAuto === "boolean";
  const normalizedTitle = note.title || "Untitled Note";

  return {
    id: note.id || createId(),
    title: normalizedTitle,
    content: note.content || "",
    tags: Array.isArray(note.tags) ? note.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    collaborators: Array.isArray(note.collaborators)
      ? note.collaborators.map((handle) => normalizeHandle(String(handle))).filter(Boolean)
      : [],
    shareDirection: note.shareDirection === "inbound" ? "inbound" : note.shareDirection === "outbound" ? "outbound" : null,
    folderId: note.folderId || fallbackFolderId,
    isPinned: Boolean(legacyPinned),
    isFavorite: Boolean(note.isFavorite),
    isArchived: Boolean(note.isArchived),
    isDeleted: Boolean(note.isDeleted),
    isTitleAuto: hasExplicitAutoFlag ? note.isTitleAuto : normalizedTitle === "Untitled Note",
    color: note.color || "amber",
    versions: Array.isArray(note.versions)
      ? note.versions.map((version, index) => ({
          id: version.id || `${note.id || "note"}-version-${index}`,
          savedAt: version.savedAt || note.updatedAt || nowIso(),
          title: version.title || normalizedTitle,
          content: version.content || "",
          tags: Array.isArray(version.tags) ? version.tags : [],
          collaborators: Array.isArray(version.collaborators)
            ? version.collaborators.map((handle) => normalizeHandle(String(handle))).filter(Boolean)
            : [],
          folderId: version.folderId || fallbackFolderId,
          color: version.color || note.color || "amber"
        }))
      : [],
    createdAt: note.createdAt || nowIso(),
    updatedAt: note.updatedAt || nowIso()
  };
}
