import React, { useEffect, useMemo, useRef, useState } from "react";
import "./style.css";

const STORAGE_KEY = "polished-notes-app";
const MAX_NOTE_VERSIONS = 20;

const folderSeed = [
  { id: "folder-work", name: "Work", color: "sky" },
  { id: "folder-personal", name: "Personal", color: "rose" },
  { id: "folder-ideas", name: "Ideas", color: "amber" },
  { id: "folder-reference", name: "Reference", color: "violet" }
];

const colorOptions = [
  { value: "amber", label: "Amber", swatch: "#f1b879" },
  { value: "rose", label: "Rose", swatch: "#f28b9e" },
  { value: "jade", label: "Jade", swatch: "#69d3b0" },
  { value: "sky", label: "Sky", swatch: "#7fb7ff" },
  { value: "violet", label: "Violet", swatch: "#b59bff" }
];

const seedNotes = [
  {
    id: "note-1",
    title: "Design the notes surface",
    content:
      "# Layout direction\n\nKeep the interface editorial and calm.\n\n- Left navigation for organization\n- Center list for fast scanning\n- Right editor for focused writing",
    tags: ["design", "ui", "product"],
    collaborators: ["@maya", "@leo"],
    shareDirection: "outbound",
    folderId: "folder-ideas",
    isPinned: true,
    isFavorite: true,
    color: "amber",
    createdAt: "2026-06-11T08:30:00.000Z",
    updatedAt: "2026-06-13T08:40:00.000Z",
    versions: [
      {
        id: "note-1-version-1",
        savedAt: "2026-06-13T08:40:00.000Z",
        title: "Design the notes surface",
        content:
          "# Layout direction\n\nKeep the interface editorial and calm.\n\n- Left navigation for organization\n- Center list for fast scanning\n- Right editor for focused writing",
        tags: ["design", "ui", "product"],
        collaborators: ["@maya", "@leo"],
        folderId: "folder-ideas",
        color: "amber"
      }
    ]
  },
  {
    id: "note-2",
    title: "Weekly priorities",
    content:
      "Ship the layout polish, tighten the onboarding copy, and review the first usage data after release.",
    tags: ["work", "planning"],
    collaborators: ["@finance_ops"],
    shareDirection: "inbound",
    folderId: "folder-work",
    isFavorite: false,
    color: "sky",
    createdAt: "2026-06-10T12:15:00.000Z",
    updatedAt: "2026-06-12T19:15:00.000Z",
    versions: [
      {
        id: "note-2-version-1",
        savedAt: "2026-06-12T19:15:00.000Z",
        title: "Weekly priorities",
        content:
          "Ship the layout polish, tighten the onboarding copy, and review the first usage data after release.",
        tags: ["work", "planning"],
        collaborators: ["@finance_ops"],
        folderId: "folder-work",
        color: "sky"
      }
    ]
  },
  {
    id: "note-3",
    title: "Reading list",
    content:
      "Collect articles on typography, interaction states, and strong empty states.\n\n- Keep the best takeaways\n- Turn them into small product decisions",
    tags: ["reading", "ideas"],
    folderId: "folder-reference",
    color: "violet",
    createdAt: "2026-06-09T10:20:00.000Z",
    updatedAt: "2026-06-11T16:20:00.000Z",
    versions: [
      {
        id: "note-3-version-1",
        savedAt: "2026-06-11T16:20:00.000Z",
        title: "Reading list",
        content:
          "Collect articles on typography, interaction states, and strong empty states.\n\n- Keep the best takeaways\n- Turn them into small product decisions",
        tags: ["reading", "ideas"],
        collaborators: [],
        folderId: "folder-reference",
        color: "violet"
      }
    ]
  }
];

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeFolder(folder, fallbackIndex = 0) {
  return {
    id: folder.id || `folder-${fallbackIndex}`,
    name: folder.name || "Folder",
    color: folder.color || "amber"
  };
}

function normalizeHandle(value) {
  const cleanedValue = value.trim().replace(/^@+/, "").replace(/\s+/g, "_").toLowerCase();

  return cleanedValue ? `@${cleanedValue}` : "";
}

function normalizeTagValue(value) {
  return value.trim().replace(/^#+/, "").replace(/\s+/g, "-").toLowerCase();
}

function normalizeNote(note, folders = folderSeed) {
  const fallbackFolderId = folders[0]?.id || "folder-default";
  const legacyPinned = note.pinned ?? note.isPinned;
  const hasExplicitAutoFlag = typeof note.isTitleAuto === "boolean";
  const normalizedTitle = note.title || "Untitled note";

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
    isTitleAuto: hasExplicitAutoFlag ? note.isTitleAuto : normalizedTitle === "Untitled note",
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

function normalizeView(view) {
  if (!view || typeof view !== "object") {
    return { kind: "all" };
  }

  if (view.kind === "folder" && typeof view.id === "string") {
    return { kind: "folder", id: view.id };
  }

  if (
    ["all", "pinned", "favorites", "shared", "inbound", "outbound", "archive", "trash"].includes(
      view.kind
    )
  ) {
    return { kind: view.kind };
  }

  return { kind: "all" };
}

function createDefaultState() {
  const notes = seedNotes.map((note) => normalizeNote(note));

  return {
    theme: "light",
    activeView: { kind: "all" },
    activeId: notes[0]?.id ?? null,
    folders: folderSeed.map(normalizeFolder),
    notes
  };
}

function loadAppState() {
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

      return {
        theme: parsed.theme === "dark" ? "dark" : "light",
        activeView: normalizeView(parsed.activeView),
        activeId: typeof parsed.activeId === "string" ? parsed.activeId : notes[0]?.id ?? null,
        folders,
        notes
      };
    }
  } catch {
    return createDefaultState();
  }

  return createDefaultState();
}

function sortNotes(notes, viewKind = "all") {
  return [...notes].sort((a, b) => {
    if (viewKind !== "trash") {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function previewText(note) {
  const text = note.content.trim().replace(/\s+/g, " ");

  if (!text) {
    return "Start writing something.";
  }

  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

function stripInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/^[-*]\s+/g, "")
    .trim();
}

function deriveTitleFromContent(content) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return "Untitled note";
  }

  const codeFenceMatch = trimmedContent.match(/^```([a-z0-9_-]+)?/im);
  if (codeFenceMatch && trimmedContent.replace(/```/g, "").trim().split("\n").length <= 6) {
    const language = codeFenceMatch[1]?.toUpperCase() || "Code";
    return `${language} snippet`;
  }

  const lines = trimmedContent
    .split("\n")
    .map((line) => stripInlineMarkdown(line))
    .filter(Boolean);

  const firstMeaningfulLine = lines.find((line) => !/^```/.test(line));
  if (!firstMeaningfulLine) {
    return "Untitled note";
  }

  return firstMeaningfulLine.length > 68
    ? `${firstMeaningfulLine.slice(0, 68).trimEnd()}...`
    : firstMeaningfulLine;
}

function matchesQuery(note, query) {
  if (!query) {
    return true;
  }

  const target = [note.title, note.content, note.tags.join(" ")].join(" ").toLowerCase();
  return target.includes(query);
}

function filterNotes(notes, view) {
  return notes.filter((note) => {
    if (view.kind === "trash") {
      return note.isDeleted;
    }

    if (note.isDeleted) {
      return false;
    }

    if (view.kind === "archive") {
      return note.isArchived;
    }

    if (note.isArchived) {
      return false;
    }

    if (view.kind === "pinned") {
      return note.isPinned;
    }

    if (view.kind === "favorites") {
      return note.isFavorite;
    }

    if (view.kind === "shared") {
      return note.collaborators.length > 0;
    }

    if (view.kind === "inbound") {
      return note.collaborators.length > 0 && note.shareDirection === "inbound";
    }

    if (view.kind === "outbound") {
      return note.collaborators.length > 0 && note.shareDirection !== "inbound";
    }

    if (view.kind === "folder") {
      return note.folderId === view.id;
    }

    return true;
  });
}

function getViewLabel(view, folders) {
  if (view.kind === "folder") {
    return folders.find((folder) => folder.id === view.id)?.name || "Folder";
  }

  const labels = {
    all: "All notes",
    pinned: "Pinned notes",
    favorites: "Favorites",
    shared: "Shared notes",
    inbound: "Shared to you",
    outbound: "Shared by you",
    archive: "Archive",
    trash: "Trash"
  };

  return labels[view.kind] || "All notes";
}

function getSearchScopeLabel(note) {
  if (note.isDeleted) {
    return "Trash";
  }

  if (note.isArchived) {
    return "Archive";
  }

  if (note.isPinned) {
    return "Pinned";
  }

  if (note.isFavorite) {
    return "Favorites";
  }

  return "Active";
}

function getShareLabel(note) {
  if (note.shareDirection === "inbound") {
    return "Shared to you";
  }

  if (note.shareDirection === "outbound") {
    return "Shared by you";
  }

  return note.collaborators.length > 0 ? "Shared" : "Private";
}

function createVersionSnapshot(note, savedAt) {
  return {
    id: `${note.id}-version-${savedAt}`,
    savedAt,
    title: note.title || "Untitled note",
    content: note.content || "",
    tags: note.tags || [],
    collaborators: note.collaborators || [],
    folderId: note.folderId,
    color: note.color
  };
}

function shouldStoreVersion(previousNote, nextNote) {
  if (!previousNote) {
    return true;
  }

  const contentChanged = previousNote.content !== nextNote.content;
  const titleChanged = previousNote.title !== nextNote.title;
  const tagsChanged = JSON.stringify(previousNote.tags) !== JSON.stringify(nextNote.tags);
  const collaboratorsChanged =
    JSON.stringify(previousNote.collaborators) !== JSON.stringify(nextNote.collaborators);
  const folderChanged = previousNote.folderId !== nextNote.folderId;
  const colorChanged = previousNote.color !== nextNote.color;

  if (!contentChanged && !titleChanged && !tagsChanged && !collaboratorsChanged && !folderChanged && !colorChanged) {
    return false;
  }

  const previousSnapshot = previousNote.versions?.[0];
  if (!previousSnapshot) {
    return true;
  }

  const elapsed = new Date(nextNote.updatedAt).getTime() - new Date(previousSnapshot.savedAt).getTime();
  const contentDelta = Math.abs((nextNote.content || "").length - (previousNote.content || "").length);

  return elapsed >= 60_000 || titleChanged || collaboratorsChanged || tagsChanged || folderChanged || colorChanged || contentDelta >= 120;
}

function parseInlineMarkdown(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-strong-${partIndex++}`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${keyPrefix}-em-${partIndex++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={`${keyPrefix}-code-${partIndex++}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a key={`${keyPrefix}-link-${partIndex++}`} href={linkMatch[2]} target="_blank" rel="noreferrer">
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderMarkdownPreview(content) {
  const lines = content.split("\n");
  const nodes = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      nodes.push(<div key={`gap-${index}`} className="preview-gap" />);
      index += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const language = line.trim().replace(/^```/, "").trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && /^```/.test(lines[index].trim())) {
        index += 1;
      }

      nodes.push(
        <div key={`code-${index}`} className="preview-code-block">
          {language && <div className="preview-code-label">{language}</div>}
          <pre>
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#{1,3}/)[0].length;
      const text = line.replace(/^#{1,3}\s+/, "");
      const HeadingTag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      nodes.push(<HeadingTag key={`heading-${index}`}>{parseInlineMarkdown(text, `heading-${index}`)}</HeadingTag>);
      index += 1;
      continue;
    }

    if (/^[-*]\s+\[( |x|X)\]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+\[( |x|X)\]\s+/.test(lines[index])) {
        const match = lines[index].match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
        items.push({
          checked: match[1].toLowerCase() === "x",
          text: match[2]
        });
        index += 1;
      }

      nodes.push(
        <ul key={`checklist-${index}`} className="preview-checklist">
          {items.map((item, itemIndex) => (
            <li key={`check-${index}-${itemIndex}`}>
              <label>
                <input type="checkbox" checked={item.checked} readOnly />
                <span>{parseInlineMarkdown(item.text, `check-${index}-${itemIndex}`)}</span>
              </label>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }

      nodes.push(
        <ul key={`list-${index}`} className="preview-list">
          {items.map((item, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`}>{parseInlineMarkdown(item, `item-${index}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^#{1,3}\s+/.test(lines[index]) && !/^[-*]\s+/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }

    nodes.push(
      <p key={`paragraph-${index}`} className="preview-paragraph">
        {parseInlineMarkdown(paragraph.join(" "), `paragraph-${index}`)}
      </p>
    );
  }

  return nodes;
}

function noteMatchesFolder(note, activeView) {
  return activeView.kind === "folder" ? note.folderId === activeView.id : true;
}

const isElectron = typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);

export default function App() {
  const [appState, setAppState] = useState(loadAppState);
  const [query, setQuery] = useState("");
  const [isCompact, setIsCompact] = useState(false);
  const [isCollectionCollapsed, setIsCollectionCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [openTabs, setOpenTabs] = useState(() => {
    const s = loadAppState();
    return s.activeId ? [s.activeId] : (s.notes[0]?.id ? [s.notes[0].id] : []);
  });
  const [sidebarSections, setSidebarSections] = useState({
    workspace: true,
    folders: true,
    collaboration: true
  });
  const [codeLanguage, setCodeLanguage] = useState("json");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [folderInput, setFolderInput] = useState("");
  const searchRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  const { notes, folders, theme, activeView, activeId } = appState;

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

  const activeNote = notes.find((note) => note.id === activeId) || visibleNotes[0] || null;

  useEffect(() => {
    if (!activeNote) {
      return;
    }

    if (!visibleNotes.some((note) => note.id === activeNote.id) && visibleNotes.length > 0) {
      setAppState((current) => ({ ...current, activeId: visibleNotes[0].id }));
    }
  }, [activeNote, visibleNotes]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    function handleScroll() {
      setIsCompact(window.scrollY > 72);
    }

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

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleShortcuts);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleShortcuts);
    };
  });

  const noteCounts = useMemo(() => {
    const visible = notes.filter((note) => !note.isDeleted && !note.isArchived);
    const archived = notes.filter((note) => note.isArchived && !note.isDeleted);
    const trash = notes.filter((note) => note.isDeleted);
    const shared = visible.filter((note) => note.collaborators.length > 0);

    return {
      all: visible.length,
      pinned: visible.filter((note) => note.isPinned).length,
      favorites: visible.filter((note) => note.isFavorite).length,
      shared: shared.length,
      inbound: shared.filter((note) => note.shareDirection === "inbound").length,
      outbound: shared.filter((note) => note.shareDirection !== "inbound").length,
      archive: archived.length,
      trash: trash.length
    };
  }, [notes]);

  const folderCounts = useMemo(() => {
    return folders.map((folder) => ({
      ...folder,
      count: notes.filter((note) => note.folderId === folder.id && !note.isDeleted && !note.isArchived).length
    }));
  }, [folders, notes]);

  const folderName = activeNote ? folderMap.get(activeNote.folderId)?.name || "Folder" : "Folder";
  const viewLabel = query.trim() ? "Search results" : getViewLabel(activeView, folders);
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

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
            ].slice(0, MAX_NOTE_VERSIONS)
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

  function closeTab(noteId) {
    setOpenTabs((prev) => {
      const next = prev.filter((id) => id !== noteId);
      if (activeId === noteId) {
        const idx = prev.indexOf(noteId);
        const nextActiveId = next[idx] ?? next[idx - 1] ?? null;
        setAppState((curr) => ({ ...curr, activeId: nextActiveId }));
      }
      return next;
    });
  }

  function handleSelectView(nextView) {
    setAppState((current) => ({
      ...current,
      activeView: nextView
    }));
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

  function handleCreateNote() {
    const defaultFolder = activeView.kind === "folder" ? activeView.id : folders[0]?.id;
    const note = normalizeNote(
      {
        id: createId(),
        title: "Untitled note",
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

  function toggleTheme() {
    setAppState((current) => ({
      ...current,
      theme: current.theme === "dark" ? "light" : "dark"
    }));
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

  function insertCodeBlock() {
    if (!activeNote || !bodyRef.current) {
      return;
    }

    const textarea = bodyRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = activeNote.content.slice(selectionStart, selectionEnd);
    const codeContent = selectedText || "{\n  \n}";
    const block = `\n\`\`\`${codeLanguage}\n${codeContent}\n\`\`\`\n`;
    const nextContent =
      activeNote.content.slice(0, selectionStart) + block + activeNote.content.slice(selectionEnd);

    if (activeNote.isTitleAuto) {
      updateActiveNote({
        content: nextContent,
        title: deriveTitleFromContent(nextContent),
        isTitleAuto: true
      });
    } else {
      updateActiveNote({ content: nextContent });
    }

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + block.length - 5;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertCheckbox() {
    if (!activeNote || !bodyRef.current) {
      return;
    }

    const textarea = bodyRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = activeNote.content.slice(selectionStart, selectionEnd).trim();
    const line = `- [ ] ${selectedText}`;
    const nextContent =
      activeNote.content.slice(0, selectionStart) + line + activeNote.content.slice(selectionEnd);

    if (activeNote.isTitleAuto) {
      updateActiveNote({
        content: nextContent,
        title: deriveTitleFromContent(nextContent),
        isTitleAuto: true
      });
    } else {
      updateActiveNote({ content: nextContent });
    }

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + 6;
      textarea.setSelectionRange(cursor, cursor);
    });
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
          title: version.title || "Untitled note",
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
          versions: [currentSnapshot, ...(note.versions || [])].slice(0, MAX_NOTE_VERSIONS)
        };
      })
    }));
  }

  return (
    <main className={`app-shell theme-${theme}${isElectron ? ' electron-app' : ''}`}>
      <div className="backdrop backdrop-a" aria-hidden="true" />
      <div className="backdrop backdrop-b" aria-hidden="true" />

      <section className="notes-app" aria-label="Polished notes app">
        <header className={`topbar ${isCompact ? "compact" : ""}`}>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <div>
              <p className="eyebrow">Private workspace</p>
              <h1>polished</h1>
            </div>
          </div>

          <label className="search" htmlFor="note-search">
            <span>Search notes</span>
            <input
              ref={searchRef}
              id="note-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, body, or tags"
              autoComplete="off"
            />
          </label>

          <div className="toolbar-actions">
            <button className="ghost-action" type="button" onClick={toggleTheme} aria-label={themeLabel}>
              {theme === "dark" ? "Dark" : "Light"}
            </button>
            <button className="primary-action" type="button" onClick={handleCreateNote}>
              New note
            </button>
          </div>
        </header>

        <div className={`workspace-grid${isCollectionCollapsed ? " collection-collapsed" : ""}${isInspectorCollapsed ? " inspector-collapsed" : ""}`}>
          <nav className="sidebar" aria-label="Navigation">
            <div className="sidebar-section">
              <div className="section-heading">
                <div className="section-heading-copy">
                  <p className="eyebrow">Workspace</p>
                  <span>{noteCounts.all} active</span>
                </div>
                <button
                  type="button"
                  className={`section-toggle ${sidebarSections.workspace ? "open" : ""}`}
                  aria-label={sidebarSections.workspace ? "Collapse workspace" : "Expand workspace"}
                  onClick={() => toggleSidebarSection("workspace")}
                >
                  <span aria-hidden="true">▾</span>
                </button>
              </div>

              {sidebarSections.workspace && (
                <div className="sidebar-section-body">
                  <button
                    type="button"
                    className={`nav-item ${activeView.kind === "all" ? "active" : ""}`}
                    onClick={() => handleSelectView({ kind: "all" })}
                  >
                    <span>All notes</span>
                    <strong>{noteCounts.all}</strong>
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
              <div className="section-heading">
                <div className="section-heading-copy">
                  <p className="eyebrow">Folders</p>
                  <span>{folders.length} spaces</span>
                </div>
                <button
                  type="button"
                  className={`section-toggle ${sidebarSections.folders ? "open" : ""}`}
                  aria-label={sidebarSections.folders ? "Collapse folders" : "Expand folders"}
                  onClick={() => toggleSidebarSection("folders")}
                >
                  <span aria-hidden="true">▾</span>
                </button>
              </div>

              {sidebarSections.folders && (
                <div className="sidebar-section-body">
                  <div className="sidebar-inline-form">
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
                    <button
                      type="button"
                      className="ghost-action inline-add"
                      onClick={createFolder}
                    >
                      Add
                    </button>
                  </div>
                  {folderCounts.map((folder) => (
                    <button
                      type="button"
                      key={folder.id}
                      className={`nav-item folder-item ${
                        activeView.kind === "folder" && activeView.id === folder.id ? "active" : ""
                      }`}
                      onClick={() => handleSelectView({ kind: "folder", id: folder.id })}
                    >
                      <span>
                        <span className={`folder-dot folder-${folder.color}`} aria-hidden="true" />
                        {folder.name}
                      </span>
                      <strong>{folder.count}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <div className="section-heading">
                <div className="section-heading-copy">
                  <p className="eyebrow">Collaboration</p>
                  <span>{noteCounts.shared} shared</span>
                </div>
                <button
                  type="button"
                  className={`section-toggle ${sidebarSections.collaboration ? "open" : ""}`}
                  aria-label={
                    sidebarSections.collaboration
                      ? "Collapse collaboration"
                      : "Expand collaboration"
                  }
                  onClick={() => toggleSidebarSection("collaboration")}
                >
                  <span aria-hidden="true">▾</span>
                </button>
              </div>

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
          </nav>

          <button
            type="button"
            className={`list-panel-toggle ${!isCollectionCollapsed ? "open" : ""}`}
            onClick={() => setIsCollectionCollapsed((v) => !v)}
            aria-label={isCollectionCollapsed ? "Expand collection" : "Collapse collection"}
          >
            <span aria-hidden="true">›</span>
          </button>

          <section className={`list-panel${isCollectionCollapsed ? " list-panel--collapsed" : ""}`} aria-label="Notes list">
            <div className="list-panel-content">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Collection</p>
                  <h3>{viewLabel}</h3>
                </div>
                <div className="panel-head-actions">
                  <span>{query.trim() ? "Across workspace" : `${visibleNotes.length} shown`}</span>
                </div>
              </div>

              <div className="panel-summary" aria-label="Note statistics">
                {query.trim() ? (
                  <>
                    <span>{visibleNotes.length} matches</span>
                    <span>{notes.length} total notes</span>
                    <span>Includes archive and trash</span>
                  </>
                ) : ["shared", "inbound", "outbound"].includes(activeView.kind) ? (
                  <>
                    <span>{noteCounts.shared} shared notes</span>
                    <span>{noteCounts.outbound} shared by you</span>
                    <span>{noteCounts.inbound} shared to you</span>
                  </>
                ) : (
                  <>
                    <span>{noteCounts.pinned} pinned</span>
                    <span>{noteCounts.favorites} favorites</span>
                  </>
                )}
              </div>

              <div className="note-list" role="list">
                {visibleNotes.length > 0 ? (
                  visibleNotes.map((note) => {
                    const selected = note.id === activeNote?.id;

                    return (
                      <button
                        type="button"
                        role="listitem"
                        key={note.id}
                        className={`note-card ${selected ? "active" : ""}`}
                        onClick={() => openNoteInTab(note.id)}
                      >
                        <div className="note-card-head">
                          <strong>{note.title || "Untitled note"}</strong>
                          <span>{formatDateTime(note.updatedAt)}</span>
                        </div>
                        <p>{previewText(note)}</p>
                      </button>
                    );
                  })
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
            </div>
          </section>

          <section className="editor-panel" aria-label="Note editor">
            <div className="tab-bar">
              <div className="tab-list" role="tablist">
                {openTabs.map((noteId) => {
                  const tabNote = notes.find((n) => n.id === noteId);
                  if (!tabNote) return null;
                  const isActive = noteId === activeId;
                  return (
                    <div key={noteId} className={`tab${isActive ? " active" : ""}`} role="tab">
                      <button
                        type="button"
                        className="tab-label"
                        onClick={() => openNoteInTab(noteId)}
                        aria-selected={isActive}
                      >
                        {tabNote.title || "Untitled note"}
                      </button>
                      <button
                        type="button"
                        className="tab-close"
                        onClick={() => closeTab(noteId)}
                        aria-label={`Close ${tabNote.title || "Untitled note"}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="tab-bar-end">
                <button type="button" className="tab-new-btn" onClick={handleCreateNote} aria-label="New tab">
                  +
                </button>
                <button
                  type="button"
                  className={`inspector-toggle-btn${!isInspectorCollapsed ? " open" : ""}`}
                  onClick={() => setIsInspectorCollapsed((v) => !v)}
                  aria-label={isInspectorCollapsed ? "Show inspector" : "Hide inspector"}
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>

            {activeNote ? (
              <>
                <label className="editor-field editor-title">
                  <span>Title</span>
                  <input
                    ref={titleRef}
                    value={activeNote.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Untitled note"
                  />
                </label>

                <div className="editor-tools" aria-label="Editor tools">
                  <select
                    aria-label="Code block language"
                    value={codeLanguage}
                    onChange={(event) => setCodeLanguage(event.target.value)}
                  >
                    <option value="json">JSON</option>
                    <option value="sql">SQL</option>
                    <option value="js">JavaScript</option>
                    <option value="ts">TypeScript</option>
                    <option value="bash">Bash</option>
                    <option value="text">Plain text</option>
                  </select>
                  <button type="button" className="ghost-action" onClick={insertCodeBlock}>
                    Insert code block
                  </button>
                  <button type="button" className="ghost-action" onClick={insertCheckbox}>
                    Insert checkbox
                  </button>
                </div>

                <label className="editor-field editor-body">
                  <span>Body</span>
                  <textarea
                    ref={bodyRef}
                    aria-label="Body"
                    value={activeNote.content}
                    onChange={(event) => handleBodyChange(event.target.value)}
                    placeholder={"Write in markdown. Use ```json for pasted code blocks."}
                    rows={14}
                  />
                </label>

                <div className="editor-meta minimal">
                  <span aria-label="Autosave status">Autosaved {formatDateTime(activeNote.updatedAt)}</span>
                </div>
              </>
            ) : (
              <div className="empty-state editor-empty">
                <h3>No note selected</h3>
                <p>Create a note or choose one from the list to start editing.</p>
                <button type="button" className="primary-action" onClick={handleCreateNote}>
                  Create note
                </button>
              </div>
            )}
          </section>

          <section
            className={`inspector-panel${isInspectorCollapsed ? " inspector-panel--collapsed" : ""}`}
            aria-label="Inspector"
          >
            <div className="inspector-content">
              {activeNote && (
                <>
                  <div className="inspector-head">
                    <div>
                      <p className="eyebrow">Page</p>
                      <h3>{folderName}</h3>
                    </div>
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
                              <span>#{tag}</span>
                              <strong>x</strong>
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
                              <strong>x</strong>
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
                              <strong>{version.title || "Untitled note"}</strong>
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
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
