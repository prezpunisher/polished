import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./style.css";

const STORAGE_KEY = "polished-notes-app";
const UI_KEY = "polished-ui";

const THEMES = [
  { id: "default",  label: "Default",  group: "light", bg: "#efefef", accent: "#7d7d7d" },
  { id: "warm",     label: "Warm",     group: "light", bg: "#f0ece5", accent: "#c87a2e" },
  { id: "sepia",    label: "Sepia",    group: "light", bg: "#f4efe8", accent: "#8b6344" },
  { id: "ocean",    label: "Ocean",    group: "light", bg: "#e8eef5", accent: "#2d7abf" },
  { id: "bear",     label: "Bear",     group: "dark",  bg: "#1c1c1e", accent: "#4762e8" },
  { id: "dark",     label: "Dark",     group: "dark",  bg: "#202020", accent: "#9a9a9a" },
  { id: "neon",     label: "Neon",     group: "dark",  bg: "#0d0d0d", accent: "#00ff88" },
  { id: "matrix",   label: "Matrix",   group: "dark",  bg: "#000000", accent: "#00ff41" },
  { id: "midnight", label: "Midnight", group: "dark",  bg: "#0a0d1a", accent: "#7b8cde" },
];
const VALID_THEMES = THEMES.map((t) => t.id);

function loadUiPrefs() {
  try {
    const stored = window.localStorage?.getItem(UI_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      return {
        collectionCollapsed: Boolean(p.collectionCollapsed),
        inspectorCollapsed: Boolean(p.inspectorCollapsed),
        showLineNumbers: Boolean(p.showLineNumbers)
      };
    }
  } catch {}
  return { collectionCollapsed: false, inspectorCollapsed: false, showLineNumbers: false };
}
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

function normalizeChecklistItem(item) {
  return {
    id: item.id || createId(),
    text: typeof item.text === "string" ? item.text : "",
    done: Boolean(item.done),
    createdAt: item.createdAt || nowIso()
  };
}

function normalizeChecklist(cl) {
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

const checklistSeed = [
  {
    id: "cl-daily",
    title: "Daily tasks",
    items: [
      { id: "cli-1", text: "Review pull requests", done: false, createdAt: "2026-06-14T09:00:00Z" },
      { id: "cli-2", text: "Team standup notes", done: false, createdAt: "2026-06-14T09:00:00Z" },
      { id: "cli-3", text: "Update project board", done: true, createdAt: "2026-06-14T08:00:00Z" },
    ],
    createdAt: "2026-06-14T08:00:00Z",
    updatedAt: "2026-06-14T09:00:00Z"
  },
  {
    id: "cl-launch",
    title: "Launch prep",
    items: [
      { id: "cli-4", text: "Write release notes", done: false, createdAt: "2026-06-14T08:00:00Z" },
      { id: "cli-5", text: "QA sign-off", done: false, createdAt: "2026-06-14T08:00:00Z" },
    ],
    createdAt: "2026-06-14T08:00:00Z",
    updatedAt: "2026-06-14T08:00:00Z"
  }
];

function normalizeNote(note, folders = folderSeed) {
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

function normalizeView(view) {
  if (!view || typeof view !== "object") {
    return { kind: "all" };
  }

  if (view.kind === "folder" && typeof view.id === "string") {
    return { kind: "folder", id: view.id };
  }

  if (
    ["all", "pinned", "favorites", "shared", "inbound", "outbound", "archive", "trash", "tasks"].includes(
      view.kind
    )
  ) {
    return { kind: view.kind };
  }

  return { kind: "all" };
}

function createDefaultState() {
  const notes = seedNotes.map((note) => normalizeNote(note));
  const checklists = checklistSeed.map(normalizeChecklist);

  return {
    theme: "bear",
    activeView: { kind: "all" },
    activeId: notes[0]?.id ?? null,
    activeChecklistId: checklists[0]?.id ?? null,
    folders: folderSeed.map(normalizeFolder),
    notes,
    checklists
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

      const storedTheme = parsed.theme;
      const theme = VALID_THEMES.includes(storedTheme)
        ? storedTheme
        : storedTheme === "dark" ? "dark" : "default";

      const checklists = Array.isArray(parsed.checklists)
        ? parsed.checklists.map(normalizeChecklist)
        : createDefaultState().checklists;

      return {
        theme,
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
    return "Untitled Note";
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
    return "Untitled Note";
  }

  return firstMeaningfulLine.length > 68
    ? `${firstMeaningfulLine.slice(0, 68).trimEnd()}...`
    : firstMeaningfulLine;
}

function getNextUntitledTitle(notes) {
  const taken = new Set(notes.filter((n) => !n.isDeleted).map((n) => n.title));
  if (!taken.has("Untitled Note")) return "Untitled Note";
  let i = 2;
  while (taken.has(`Untitled Note ${i}`)) i++;
  return `Untitled Note ${i}`;
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
    all: "All",
    notes: "Notes",
    pinned: "Pinned",
    favorites: "Favorites",
    shared: "Shared notes",
    inbound: "Shared to you",
    outbound: "Shared by you",
    archive: "Archive",
    trash: "Trash"
  };

  return labels[view.kind] || "All";
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
    title: note.title || "Untitled Note",
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

  const { notes, folders, theme, activeView, activeId, checklists, activeChecklistId } = appState;
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    window.localStorage.setItem(UI_KEY, JSON.stringify({
      collectionCollapsed: isCollectionCollapsed,
      inspectorCollapsed: isInspectorCollapsed,
      showLineNumbers
    }));
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
  const lightThemes = THEMES.filter((t) => t.group === "light");
  const darkThemes = THEMES.filter((t) => t.group === "dark");

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

  function applyTheme(name) {
    setAppState((current) => ({ ...current, theme: name }));
    setShowSettings(false);
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
          versions: [currentSnapshot, ...(note.versions || [])].slice(0, MAX_NOTE_VERSIONS)
        };
      })
    }));
  }

  return (
    <main className={`app-shell theme-${theme}${isElectron ? ' electron-app' : ''}`}>
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
                    <p className="settings-group-label">Light</p>
                    <div className="theme-grid">
                      {lightThemes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`theme-option${theme === t.id ? " active" : ""}`}
                          onClick={() => applyTheme(t.id)}
                          aria-label={`${t.label} theme`}
                        >
                          <span className="theme-option-swatch" style={{ background: t.bg, borderColor: t.accent }} />
                          <span className="theme-option-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="settings-group-label">Dark</p>
                    <div className="theme-grid">
                      {darkThemes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`theme-option${theme === t.id ? " active" : ""}`}
                          onClick={() => applyTheme(t.id)}
                          aria-label={`${t.label} theme`}
                        >
                          <span className="theme-option-swatch" style={{ background: t.bg, borderColor: t.accent }} />
                          <span className="theme-option-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="settings-divider" />
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
                      return active.length > 0 ? active.map((cl) => {
                        const total = cl.items.length;
                        const done = cl.items.filter((i) => i.done).length;
                        const remaining = total - done;
                        return (
                          <div key={cl.id} className={`note-card checklist-card${cl.id === activeId && activeTabChecklist ? " active" : ""}`}>
                            <button
                              type="button"
                              className="checklist-card-select"
                              onClick={() => openChecklistInTab(cl.id)}
                            >
                              <div className="note-card-head">
                                <strong>
                                  {cl.isPinned && <span aria-hidden="true">📌 </span>}
                                  {cl.isFavorite && <span aria-hidden="true">★ </span>}
                                  {cl.title || <em style={{ opacity: 0.45 }}>Untitled</em>}
                                </strong>
                              </div>
                              <p>{total === 0 ? "No items" : remaining === 0 ? "All done" : `${remaining} remaining · ${done} done`}</p>
                            </button>
                            <button
                              type="button"
                              className="folder-delete"
                              aria-label={`Move to trash ${cl.title}`}
                              onClick={() => trashChecklist(cl.id)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      }) : (
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
                        {visibleNotes.length > 0 ? visibleNotes.map((note) => {
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
                                <strong>{note.title || "Untitled Note"}</strong>
                                <span>{formatDateTime(note.updatedAt)}</span>
                              </div>
                              <p>{previewText(note)}</p>
                            </button>
                          );
                        }) : (
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
                            {trashedNotes.map((note) => {
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
                                    <strong>{note.title || "Untitled Note"}</strong>
                                    <span>{formatDateTime(note.updatedAt)}</span>
                                  </div>
                                  <p>{previewText(note)}</p>
                                </button>
                              );
                            })}
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
                            {archivedNotes.map((note) => {
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
                                    <strong>{note.title || "Untitled Note"}</strong>
                                    <span>{formatDateTime(note.updatedAt)}</span>
                                  </div>
                                  <p>{previewText(note)}</p>
                                </button>
                              );
                            })}
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
                              const total = item.items.length;
                              const done = item.items.filter((i) => i.done).length;
                              const remaining = total - done;
                              return (
                                <div key={item.id} className={`note-card checklist-card${item.id === activeId && activeTabChecklist ? " active" : ""}`}>
                                  <button
                                    type="button"
                                    className="checklist-card-select"
                                    onClick={() => openChecklistInTab(item.id)}
                                  >
                                    <div className="note-card-head">
                                      <strong>{item.title || <em style={{ opacity: 0.45 }}>Untitled</em>}</strong>
                                      <span className="card-type-tag">Task</span>
                                    </div>
                                    <p>{total === 0 ? "No items" : remaining === 0 ? "All done" : `${remaining} remaining · ${done} done`}</p>
                                  </button>
                                </div>
                              );
                            }
                            const selected = item.id === activeNote?.id;
                            return (
                              <button
                                type="button"
                                role="listitem"
                                key={item.id}
                                className={`note-card ${selected ? "active" : ""}`}
                                onClick={() => openNoteInTab(item.id)}
                              >
                                <div className="note-card-head">
                                  <strong>{item.title || "Untitled Note"}</strong>
                                  <span>{formatDateTime(item.updatedAt)}</span>
                                </div>
                                <p>{previewText(item)}</p>
                              </button>
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
                                  <strong>{note.title || "Untitled Note"}</strong>
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
