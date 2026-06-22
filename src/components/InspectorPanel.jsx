import { useEffect, useState } from "react";
import { colorOptions } from "../lib/constants.js";
import { normalizeTagValue, normalizeHandle } from "../lib/normalizers.js";
import { formatDateTime } from "../lib/filters.js";
import Icon from "./Icon.jsx";

export default function InspectorPanel({
  activeNote,
  activeTabChecklist,
  isCollapsed,
  onToggleCollapsed,
  folders,
  onUpdateActiveNote,
  onTogglePinned,
  onToggleFavorite,
  onToggleArchive,
  onSendToTrash,
  onRestoreFromTrash,
  onDeleteForever,
  onDuplicate,
  onPinChecklist,
  onFavoriteChecklist,
  onArchiveChecklist,
  onTrashChecklist,
  onRestoreChecklist,
  onPermanentlyDeleteChecklist,
  onRestoreVersion,
}) {
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setCollaboratorInput("");
    setTagInput("");
  }, [activeNote?.id, activeTabChecklist?.id]);

  function handleAddCollaborator() {
    if (!activeNote) return;
    const handle = normalizeHandle(collaboratorInput);
    if (!handle) return;
    const next = activeNote.collaborators.includes(handle)
      ? activeNote.collaborators
      : [...activeNote.collaborators, handle];
    onUpdateActiveNote({ collaborators: next, shareDirection: next.length > 0 ? "outbound" : null });
    setCollaboratorInput("");
  }

  function handleRemoveCollaborator(handle) {
    if (!activeNote) return;
    const next = activeNote.collaborators.filter((h) => h !== handle);
    onUpdateActiveNote({
      collaborators: next,
      shareDirection: next.length > 0 ? (activeNote.shareDirection || "outbound") : null,
    });
  }

  function handleAddTag() {
    if (!activeNote) return;
    const tag = normalizeTagValue(tagInput);
    if (!tag || activeNote.tags.includes(tag) || activeNote.tags.length >= 12) {
      setTagInput("");
      return;
    }
    onUpdateActiveNote({ tags: [...activeNote.tags, tag] });
    setTagInput("");
  }

  return (
    <section
      className={`inspector-panel${isCollapsed ? " inspector-panel--collapsed" : ""}`}
      aria-label="Details"
    >
      <div className="inspector-toggle-row">
        <button
          type="button"
          className={`inspector-toggle-btn${!isCollapsed ? " active" : ""}`}
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expand details" : "Collapse details"}
          title="Details"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="3" x2="16" y2="21" />
          </svg>
        </button>
      </div>

      <div className="inspector-content">
        {activeTabChecklist ? (
          <>
            <div className="inspector-head">
              <p className="eyebrow">Details</p>
            </div>
            <div className="inspector-actions">
              <button type="button" className="ghost-action" onClick={() => onPinChecklist(activeTabChecklist.id)}>
                <Icon name="pinned" />{activeTabChecklist.isPinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" className="ghost-action" onClick={() => onFavoriteChecklist(activeTabChecklist.id)}>
                <Icon name="favorites" />{activeTabChecklist.isFavorite ? "Unfavorite" : "Favorite"}
              </button>
              <button type="button" className="ghost-action" onClick={() => onArchiveChecklist(activeTabChecklist.id)}>
                <Icon name="archive" />{activeTabChecklist.isArchived ? "Unarchive" : "Archive"}
              </button>
              {activeTabChecklist.isTrashed ? (
                <>
                  <button type="button" className="ghost-action" onClick={() => onRestoreChecklist(activeTabChecklist.id)}><Icon name="restore" />Restore</button>
                  <button type="button" className="danger-action" onClick={() => onPermanentlyDeleteChecklist(activeTabChecklist.id)}><Icon name="trash" />Delete forever</button>
                </>
              ) : (
                <button type="button" className="danger-action" onClick={() => onTrashChecklist(activeTabChecklist.id)}><Icon name="trash" />Move to trash</button>
              )}
            </div>
            <details className="editor-drawer" open>
              <summary>Properties<Icon name="chevron" /></summary>
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
              <p className="eyebrow">Details</p>
            </div>
            <div className="inspector-actions">
              <button type="button" className="ghost-action" onClick={onTogglePinned}><Icon name="pinned" />{activeNote.isPinned ? "Unpin" : "Pin"}</button>
              <button type="button" className="ghost-action" onClick={onToggleFavorite}><Icon name="favorites" />{activeNote.isFavorite ? "Unfavorite" : "Favorite"}</button>
              <button type="button" className="ghost-action" onClick={onToggleArchive}><Icon name="archive" />{activeNote.isArchived ? "Unarchive" : "Archive"}</button>
              {activeNote.isDeleted ? (
                <>
                  <button type="button" className="ghost-action" onClick={onRestoreFromTrash}><Icon name="restore" />Restore</button>
                  <button type="button" className="danger-action" onClick={onDeleteForever}><Icon name="trash" />Delete forever</button>
                </>
              ) : (
                <button type="button" className="danger-action" onClick={onSendToTrash}><Icon name="trash" />Move to trash</button>
              )}
              <button type="button" className="ghost-action" onClick={onDuplicate}><Icon name="duplicate" />Duplicate</button>
            </div>

            <details className="editor-drawer" aria-label="Tags" open>
              <summary>Tags<Icon name="chevron" /></summary>
              <div className="share-row drawer-body">
                <div className="share-controls">
                  <input
                    aria-label="Tag name"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(); }
                    }}
                    placeholder="meeting-notes"
                  />
                  <button type="button" className="ghost-action" onClick={handleAddTag}>Add tag</button>
                </div>
                <div className="share-chips">
                  {activeNote.tags.length > 0 ? (
                    activeNote.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="share-chip"
                        onClick={() => onUpdateActiveNote({ tags: activeNote.tags.filter((t) => t !== tag) })}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <span>{tag}</span><span aria-hidden="true">×</span>
                      </button>
                    ))
                  ) : (
                    <p className="share-empty">Add tags to keep related notes grouped together.</p>
                  )}
                </div>
              </div>
            </details>

            <details className="editor-drawer" aria-label="Note properties">
              <summary>Properties<Icon name="chevron" /></summary>
              <div className="drawer-grid">
                <label className="editor-field">
                  <span>Folder</span>
                  <select value={activeNote.folderId} onChange={(e) => onUpdateActiveNote({ folderId: e.target.value })}>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
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
                        onClick={() => onUpdateActiveNote({ color: option.value })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </details>

            <details className="editor-drawer" aria-label="Collaborators">
              <summary>
                <span className="drawer-summary-label">
                  Collaborators
                  <span className="drawer-count">{activeNote.collaborators.length > 0 ? activeNote.collaborators.length : "Private"}</span>
                </span>
                <Icon name="chevron" />
              </summary>
              <div className="share-row drawer-body">
                <div className="share-controls">
                  <input
                    aria-label="Collaborator handle"
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCollaborator(); } }}
                    placeholder="@teammate"
                  />
                  <button type="button" className="ghost-action" onClick={handleAddCollaborator}>Share note</button>
                </div>
                <div className="share-chips">
                  {activeNote.collaborators.length > 0 ? (
                    activeNote.collaborators.map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        className="share-chip"
                        onClick={() => handleRemoveCollaborator(handle)}
                        aria-label={`Remove ${handle}`}
                      >
                        <span>{handle}</span><span aria-hidden="true">×</span>
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
                <span className="drawer-summary-label">History<span className="drawer-count">{activeNote.versions.length}</span></span>
                <Icon name="chevron" />
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
                        onClick={() => onRestoreVersion(version)}
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
  );
}
