import NoteCard from "./NoteCard.jsx";
import TaskCard from "./TaskCard.jsx";

function TrashedTask({ cl, onRestore, onDelete }) {
  return (
    <div className="note-card checklist-card unified-card">
      <div className="unified-card-body">
        <strong>{cl.title || <em style={{ opacity: 0.45 }}>Untitled task</em>}</strong>
        <p>{cl.items.length === 0 ? "No items" : `${cl.items.length} item${cl.items.length !== 1 ? "s" : ""}`}</p>
      </div>
      <div className="unified-card-actions">
        <button type="button" className="ghost-action" onClick={onRestore}>Restore</button>
        {onDelete && <button type="button" className="danger-action" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}

export default function CollectionPanel({
  activeView,
  notes,
  checklists,
  visibleNotes,
  noteCounts,
  activeNoteId,
  activeId,
  hasActiveChecklist,
  query,
  onQueryChange,
  isCollectionCollapsed,
  onToggleCollapsed,
  onOpenNote,
  onOpenChecklist,
  onCreateNote,
  onCreateChecklist,
  onTrashChecklist,
  onRestoreChecklist,
  onPermanentlyDeleteChecklist,
  searchRef,
}) {
  const sortedActiveTasks = [...checklists]
    .filter((cl) => !cl.isTrashed && !cl.isArchived)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return (
    <section className={`list-panel${isCollectionCollapsed ? " list-panel--collapsed" : ""}`} aria-label="Notes list">
      <div className="collection-toggle-row">
        <button
          type="button"
          className="collection-toggle-btn"
          onClick={onToggleCollapsed}
          aria-label={isCollectionCollapsed ? "Expand collection" : "Collapse collection"}
          title="Collection"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <div className="list-panel-content">
        {activeView.kind === "tasks" ? (
          <>
            <div className="collection-panel-actions">
              <button type="button" className="ghost-action" onClick={onCreateChecklist} aria-label="New checklist">+</button>
            </div>
            <div className="note-list" role="list">
              {sortedActiveTasks.length > 0 ? sortedActiveTasks.map((cl) => (
                <TaskCard
                  key={cl.id}
                  checklist={cl}
                  isActive={cl.id === activeId && hasActiveChecklist}
                  onOpen={() => onOpenChecklist(cl.id)}
                  onTrash={() => onTrashChecklist(cl.id)}
                />
              )) : (
                <div className="empty-state">
                  <h3>No tasks yet</h3>
                  <p>Create a task list to start tracking your work.</p>
                  <button type="button" className="primary-action" onClick={onCreateChecklist}>New task list</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="search collection-search">
              <div className="search-box">
                <span className="search-box-icon" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  ref={searchRef}
                  id="note-search"
                  aria-label="Search notes"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search"
                  autoComplete="off"
                />
              </div>
            </div>

            {query.trim() ? (
              <>
                <div className="collection-panel-actions"><span>Across workspace</span></div>
                <div className="panel-summary" aria-label="Note statistics">
                  <span>{visibleNotes.length} matches</span>
                  <span>{notes.length} total notes</span>
                  <span>Includes archive and trash</span>
                </div>
                <div className="note-list" role="list">
                  {visibleNotes.length > 0 ? visibleNotes.map((note) => (
                    <NoteCard key={note.id} note={note} isActive={note.id === activeNoteId} onClick={() => onOpenNote(note.id)} />
                  )) : (
                    <div className="empty-state"><h3>No results</h3><p>No notes matched your search.</p></div>
                  )}
                </div>
              </>
            ) : activeView.kind === "trash" ? (
              <div className="note-list" role="list">
                {(() => {
                  const trashedNotes = notes.filter((n) => n.isDeleted);
                  const trashedTasks = checklists.filter((cl) => cl.isTrashed);
                  if (trashedNotes.length === 0 && trashedTasks.length === 0) {
                    return <div className="empty-state"><h3>Trash is empty</h3><p>Deleted notes and tasks appear here.</p></div>;
                  }
                  return (
                    <>
                      {trashedNotes.map((note) => (
                        <NoteCard key={note.id} note={note} isActive={note.id === activeNoteId} onClick={() => onOpenNote(note.id)} />
                      ))}
                      {trashedTasks.map((cl) => (
                        <TrashedTask
                          key={cl.id}
                          cl={cl}
                          onRestore={() => onRestoreChecklist(cl.id)}
                          onDelete={() => onPermanentlyDeleteChecklist(cl.id)}
                        />
                      ))}
                    </>
                  );
                })()}
              </div>
            ) : activeView.kind === "archive" ? (
              <div className="note-list" role="list">
                {(() => {
                  const archivedNotes = notes.filter((n) => n.isArchived && !n.isDeleted);
                  const archivedTasks = checklists.filter((cl) => cl.isArchived && !cl.isTrashed);
                  if (archivedNotes.length === 0 && archivedTasks.length === 0) {
                    return <div className="empty-state"><h3>Archive is empty</h3><p>Archived notes and tasks appear here.</p></div>;
                  }
                  return (
                    <>
                      {archivedNotes.map((note) => (
                        <NoteCard key={note.id} note={note} isActive={note.id === activeNoteId} onClick={() => onOpenNote(note.id)} />
                      ))}
                      {archivedTasks.map((cl) => (
                        <TrashedTask key={cl.id} cl={cl} onRestore={() => onRestoreChecklist(cl.id)} />
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
                    const activeTasks = checklists.filter((cl) => !cl.isTrashed && !cl.isArchived);
                    const allItems = [...visibleNotes, ...activeTasks].sort(
                      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                    );
                    if (allItems.length === 0) {
                      return (
                        <div className="empty-state">
                          <h3>Nothing here yet</h3>
                          <p>Create a note or task to get started.</p>
                          <button type="button" className="primary-action" onClick={onCreateNote}>Create note</button>
                        </div>
                      );
                    }
                    return allItems.map((item) =>
                      "items" in item ? (
                        <TaskCard
                          key={item.id}
                          checklist={item}
                          isActive={item.id === activeId && hasActiveChecklist}
                          onOpen={() => onOpenChecklist(item.id)}
                          showTaskTag
                        />
                      ) : (
                        <NoteCard key={item.id} note={item} isActive={item.id === activeNoteId} onClick={() => onOpenNote(item.id)} />
                      )
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="panel-summary" aria-label="Note statistics">
                  {["shared", "inbound", "outbound"].includes(activeView.kind) && (
                    <>
                      <span>{noteCounts.shared} shared notes</span>
                      <span>{noteCounts.outbound} shared by you</span>
                      <span>{noteCounts.inbound} shared to you</span>
                    </>
                  )}
                </div>
                <div className="note-list" role="list">
                  {visibleNotes.length > 0 ? (
                    visibleNotes.map((note) => (
                      <NoteCard key={note.id} note={note} isActive={note.id === activeNoteId} onClick={() => onOpenNote(note.id)} />
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>No notes here yet</h3>
                      <p>Create a note in this view or clear your search to see more results.</p>
                      <button type="button" className="primary-action" onClick={onCreateNote}>Create note</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
