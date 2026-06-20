function summary(items) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const remaining = total - done;
  if (total === 0) return "No items";
  if (remaining === 0) return "All done";
  return `${remaining} remaining · ${done} done`;
}

export default function TaskCard({ checklist, isActive, onOpen, onTrash, showTaskTag = false }) {
  return (
    <div className={`note-card checklist-card${isActive ? " active" : ""}`}>
      <button
        type="button"
        className="checklist-card-select"
        onClick={onOpen}
      >
        <div className="note-card-head">
          <strong>
            {checklist.isPinned && <span aria-hidden="true">📌 </span>}
            {checklist.isFavorite && <span aria-hidden="true">★ </span>}
            {checklist.title || <em style={{ opacity: 0.45 }}>Untitled</em>}
          </strong>
          {showTaskTag && <span className="card-type-tag">Task</span>}
        </div>
        <p>{summary(checklist.items)}</p>
      </button>
      {onTrash && (
        <button
          type="button"
          className="folder-delete"
          aria-label={`Move to trash ${checklist.title}`}
          onClick={onTrash}
        >
          ×
        </button>
      )}
    </div>
  );
}
