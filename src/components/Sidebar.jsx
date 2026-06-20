import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const WORKSPACE_NAV = [
  { kind: "all",       label: "All" },
  { kind: "notes",     label: "Notes" },
  { kind: "tasks",     label: "Tasks" },
  { kind: "pinned",    label: "Pinned" },
  { kind: "favorites", label: "Favorites" },
  { kind: "archive",   label: "Archive" },
  { kind: "trash",     label: "Trash" },
];

const COLLAB_NAV = [
  { kind: "shared",   label: "All shared" },
  { kind: "inbound",  label: "Shared to you" },
  { kind: "outbound", label: "Shared by you" },
];

export default function Sidebar({
  activeView,
  onSelectView,
  noteCounts,
  folderCounts,
  folders,
  isCollectionCollapsed,
  onOpenSearch,
  showLineNumbers,
  onToggleLineNumbers,
  onCreateFolder,
  onDeleteFolder,
}) {
  const [sections, setSections] = useState({ workspace: true, folders: true, collaboration: true });
  const [folderInput, setFolderInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const settingsBtnRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!showSettings) return;
    function handleOutside(e) {
      if (!settingsBtnRef.current?.contains(e.target) && !settingsRef.current?.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSettings]);

  function handleCreateFolder() {
    onCreateFolder(folderInput);
    setFolderInput("");
  }

  function toggle(key) {
    setSections((s) => ({ ...s, [key]: !s[key] }));
  }

  function navCount(kind) {
    const map = {
      all: noteCounts.all,
      notes: noteCounts.notes,
      tasks: noteCounts.tasks || "",
      pinned: noteCounts.pinned,
      favorites: noteCounts.favorites,
      archive: noteCounts.archive,
      trash: noteCounts.trash,
      shared: noteCounts.shared,
      inbound: noteCounts.inbound,
      outbound: noteCounts.outbound,
    };
    return map[kind] ?? "";
  }

  return (
    <nav className="sidebar" aria-label="Navigation">
      <div className="sidebar-body">
        <button type="button" className="sidebar-search-trigger" aria-label="Open search" onClick={onOpenSearch}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </button>

        <div className="sidebar-section">
          <button
            type="button"
            className={`section-heading${sections.workspace ? " open" : ""}`}
            aria-label={sections.workspace ? "Collapse workspace" : "Expand workspace"}
            onClick={() => toggle("workspace")}
          >
            <div className="section-heading-copy">
              <p className="eyebrow">Workspace</p>
              <span>{noteCounts.notes} notes · {noteCounts.tasks} tasks</span>
            </div>
            <span className="section-toggle-arrow" aria-hidden="true">▾</span>
          </button>
          {sections.workspace && (
            <div className="sidebar-section-body">
              {WORKSPACE_NAV.map(({ kind, label }) => (
                <button
                  key={kind}
                  type="button"
                  className={`nav-item ${activeView.kind === kind ? "active" : ""}`}
                  onClick={() => onSelectView({ kind })}
                >
                  <span>{label}</span>
                  <strong>{navCount(kind)}</strong>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <button
            type="button"
            className={`section-heading${sections.folders ? " open" : ""}`}
            aria-label={sections.folders ? "Collapse folders" : "Expand folders"}
            onClick={() => toggle("folders")}
          >
            <div className="section-heading-copy">
              <p className="eyebrow">Folders</p>
              <span>{folders.length} spaces</span>
            </div>
            <span className="section-toggle-arrow" aria-hidden="true">▾</span>
          </button>
          {sections.folders && (
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
                    onChange={(e) => setFolderInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateFolder(); } }}
                    placeholder="New folder"
                  />
                </div>
                <button type="button" className="ghost-action inline-add" onClick={handleCreateFolder} aria-label="Add folder">+</button>
              </div>
              {folderCounts.map((folder) => (
                <div
                  key={folder.id}
                  className={`nav-item folder-item ${activeView.kind === "folder" && activeView.id === folder.id ? "active" : ""}`}
                >
                  <button type="button" className="folder-select" onClick={() => onSelectView({ kind: "folder", id: folder.id })}>
                    <span className={`folder-dot folder-${folder.color}`} aria-hidden="true" />
                    {folder.name}
                  </button>
                  <div className="folder-item-right">
                    <strong>{folder.count}</strong>
                    <button
                      type="button"
                      className="folder-delete"
                      aria-label={`Delete folder ${folder.name}`}
                      onClick={() => onDeleteFolder(folder.id)}
                      disabled={folderCounts.length <= 1}
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
            className={`section-heading${sections.collaboration ? " open" : ""}`}
            aria-label={sections.collaboration ? "Collapse collaboration" : "Expand collaboration"}
            onClick={() => toggle("collaboration")}
          >
            <div className="section-heading-copy">
              <p className="eyebrow">Collaboration</p>
              <span>{noteCounts.shared} shared</span>
            </div>
            <span className="section-toggle-arrow" aria-hidden="true">▾</span>
          </button>
          {sections.collaboration && (
            <div className="sidebar-section-body">
              {COLLAB_NAV.map(({ kind, label }) => (
                <button
                  key={kind}
                  type="button"
                  className={`nav-item ${activeView.kind === kind ? "active" : ""}`}
                  onClick={() => onSelectView({ kind })}
                >
                  <span>{label}</span>
                  <strong>{navCount(kind)}</strong>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-callout">
          <p className="eyebrow">Quick keys</p>
          <ul>
            <li><kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> focus search</li>
            <li><kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> new note</li>
            <li><kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> favorite</li>
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
                  onClick={onToggleLineNumbers}
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
  );
}
