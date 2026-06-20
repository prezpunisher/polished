export function matchesQuery(note, query) {
  if (!query) {
    return true;
  }

  const target = [note.title, note.content, note.tags.join(" ")].join(" ").toLowerCase();
  return target.includes(query);
}

export function filterNotes(notes, view) {
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

export function sortNotes(notes, viewKind = "all") {
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

export function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function previewText(note) {
  const text = note.content.trim().replace(/\s+/g, " ");

  if (!text) {
    return "Start writing something.";
  }

  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}
