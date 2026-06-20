import { formatDateTime, previewText } from "../lib/filters.js";

export default function NoteCard({ note, isActive, onClick }) {
  return (
    <button type="button" role="listitem" className={`note-card ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="note-card-head">
        <strong>{note.title || "Untitled Note"}</strong>
        <span>{formatDateTime(note.updatedAt)}</span>
      </div>
      <p>{previewText(note)}</p>
    </button>
  );
}
