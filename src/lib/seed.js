export const folderSeed = [
  { id: "folder-work", name: "Work", color: "sky" },
  { id: "folder-personal", name: "Personal", color: "rose" },
  { id: "folder-ideas", name: "Ideas", color: "amber" },
  { id: "folder-reference", name: "Reference", color: "violet" }
];

export const seedNotes = [
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

export const checklistSeed = [
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
