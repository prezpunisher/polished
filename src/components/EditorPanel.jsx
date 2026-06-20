import { useState, useEffect, useRef } from "react";
import { formatDateTime } from "../lib/filters.js";

export default function EditorPanel({
  openTabs,
  activeId,
  activeNote,
  activeTabChecklist,
  notes,
  checklists,
  showLineNumbers,
  titleRef,
  checklistTitleRef,
  onOpenNote,
  onOpenChecklist,
  onCloseTab,
  onCreateNote,
  onCreateChecklist,
  onSelectView,
  onTitleChange,
  onBodyChange,
  onChecklistTitleChange,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItemText,
  activeView,
}) {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    setIsTitleEditing(false);
  }, [activeNote?.id]);

  return (
    <section className="editor-panel" aria-label="Note editor">
      <div className="tab-bar">
        <div className="tab-list" role="tablist">
          {openTabs.map((tabId) => {
            const tabNote = notes.find((n) => n.id === tabId);
            const tabCl = !tabNote ? checklists.find((cl) => cl.id === tabId) : null;
            if (!tabNote && !tabCl) return null;
            const isActive = tabId === activeId;
            const tabTitle = tabNote ? (tabNote.title || "Untitled Note") : (tabCl.title || "Untitled checklist");
            return (
              <div key={tabId} className={`tab${isActive ? " active" : ""}`} role="tab">
                <button
                  type="button"
                  className="tab-label"
                  onClick={() => tabNote ? onOpenNote(tabId) : onOpenChecklist(tabId)}
                  aria-selected={isActive}
                >
                  {tabTitle}
                </button>
                <button type="button" className="tab-close" onClick={() => onCloseTab(tabId)} aria-label={`Close ${tabTitle}`}>×</button>
              </div>
            );
          })}
        </div>
        <div className="tab-bar-end">
          <button type="button" className="tab-new-btn" onClick={onCreateNote} aria-label="New note">+</button>
        </div>
      </div>

      <div className="editor-scroll">
        {openTabs.length === 0 ? (
          <div className="empty-state editor-empty editor-welcome">
            <p className="editor-welcome-label">Start something new</p>
            <div className="editor-welcome-actions">
              <button type="button" className="primary-action" onClick={onCreateNote}>Create Note</button>
              <button
                type="button"
                className="ghost-action"
                onClick={() => { onSelectView({ kind: "tasks" }); onCreateChecklist(); }}
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
              onChange={(e) => onChecklistTitleChange(activeTabChecklist.id, e.target.value)}
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
                    onAddItem(activeTabChecklist.id, newItemText);
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
                ...activeTabChecklist.items.filter((i) => i.done),
              ].map((item) => (
                <div key={item.id} className={`checklist-item${item.done ? " done" : ""}`}>
                  <button
                    type="button"
                    className="checklist-checkbox"
                    role="checkbox"
                    aria-checked={item.done}
                    aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                    onClick={() => onToggleItem(activeTabChecklist.id, item.id)}
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
                    onChange={(e) => onUpdateItemText(activeTabChecklist.id, item.id, e.target.value)}
                    aria-label="Item text"
                  />
                  <button type="button" className="checklist-item-delete" aria-label="Delete item" onClick={() => onDeleteItem(activeTabChecklist.id, item.id)}>×</button>
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
                onChange={(e) => onTitleChange(e.target.value)}
                onClick={() => { if (activeNote.isTitleAuto) setIsTitleEditing(true); }}
                onBlur={() => setIsTitleEditing(false)}
                placeholder={activeNote.title || "Untitled Note"}
              />
            </label>
            <label className={`editor-field editor-body${showLineNumbers ? " show-line-numbers" : ""}`}>
              <span>Body</span>
              <div className="editor-body-inner">
                {showLineNumbers && (
                  <div className="line-numbers-gutter" ref={lineNumbersRef} aria-hidden="true">
                    {activeNote.content.split("\n").map((_, i) => (
                      <div key={i} className="line-number">{i + 1}</div>
                    ))}
                  </div>
                )}
                <textarea
                  aria-label="Body"
                  value={activeNote.content}
                  onChange={(e) => onBodyChange(e.target.value)}
                  onScroll={(e) => {
                    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop;
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
            <button type="button" className="primary-action" onClick={onCreateChecklist}>New checklist</button>
          </div>
        ) : (
          <div className="empty-state editor-empty">
            <h3>No note selected</h3>
            <p>Create a note or choose one from the list to start editing.</p>
            <button type="button" className="primary-action" onClick={onCreateNote}>Create note</button>
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
  );
}
