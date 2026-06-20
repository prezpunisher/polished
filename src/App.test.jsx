import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockStorage(initialValue = null) {
  const store = new Map();

  if (initialValue) {
    store.set("polished-notes-app", JSON.stringify(initialValue));
  }

  const localStorage = {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    })
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });
}

describe("App", () => {
  beforeEach(() => {
    mockStorage();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0
    });
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {
        randomUUID: vi.fn(() => "note-new")
      }
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback) => {
        callback();
        return 0;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the polished note workspace", () => {
    render(<App />);

    expect(screen.getByLabelText("Title")).toHaveValue("Design the notes surface");
    expect(screen.getByLabelText("Body")).toHaveValue(
      "# Layout direction\n\nKeep the interface editorial and calm.\n\n- Left navigation for organization\n- Center list for fast scanning\n- Right editor for focused writing"
    );
    expect(screen.getByRole("button", { name: "Remove tag design" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove tag ui" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove tag product" })).toBeInTheDocument();

    expect(screen.getByLabelText("Note statistics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appearance settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New note" })).toBeInTheDocument();
    expect(screen.getAllByText("@maya").length).toBeGreaterThan(0);
  });

  it("creates a note and keeps it editable", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "New note" }));

    expect(screen.getByLabelText("Title")).toHaveValue("Untitled Note");
    expect(screen.getByLabelText("Body")).toHaveValue("");
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Meeting notes");
    expect(screen.getByLabelText("Title")).toHaveValue("Meeting notes");
    expect(screen.getAllByText("Meeting notes").length).toBeGreaterThan(0);
  });

  it("auto-generates a title from the note body", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.type(
      screen.getByLabelText("Body"),
      "Quarterly roadmap review with finance and platform leads"
    );

    expect(screen.getByLabelText("Title")).toHaveValue(
      "Quarterly roadmap review with finance and platform leads"
    );
  });

  it("keeps a manual title after the body changes", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Team sync");
    await user.type(screen.getByLabelText("Body"), "We covered budgets and open hiring.");

    expect(screen.getByLabelText("Title")).toHaveValue("Team sync");
  });


  it("adds a collaborator handle and marks the note as shared", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByText("Collaborators"));
    await user.clear(screen.getByLabelText("Collaborator handle"));
    await user.type(screen.getByLabelText("Collaborator handle"), "@alex");
    await user.click(screen.getByRole("button", { name: "Share note" }));

    expect(screen.getAllByText("@alex").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Shared by you").length).toBeGreaterThan(0);
    expect(screen.getByText("Collaborators")).toBeInTheDocument();
  });

  it("shows inbound and outbound collaboration notes in the collaboration filters", async () => {
    const user = userEvent.setup();

    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Navigation" });
    await user.click(within(navigation).getByRole("button", { name: /All shared/ }));

    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getAllByText("Design the notes surface").length).toBeGreaterThan(0);
    expect(within(notesList).getAllByText("Weekly priorities").length).toBeGreaterThan(0);
    expect(within(notesList).queryByText("Reading list")).not.toBeInTheDocument();

    await user.click(within(navigation).getByRole("button", { name: /^Shared to you/ }));
    expect(within(notesList).getAllByText("Weekly priorities").length).toBeGreaterThan(0);
    expect(within(notesList).queryByText("Design the notes surface")).not.toBeInTheDocument();

    await user.click(within(navigation).getByRole("button", { name: /^Shared by you/ }));
    expect(within(notesList).getAllByText("Design the notes surface").length).toBeGreaterThan(0);
    expect(within(notesList).queryByText("Weekly priorities")).not.toBeInTheDocument();
  });

  it("adds tags as removable chips without relying on comma parsing", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText("Tag name"));
    await user.type(screen.getByLabelText("Tag name"), "meeting-notes,");

    expect(screen.getByRole("button", { name: "Remove tag meeting-notes" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Tag name"), "followup");
    await user.click(screen.getByRole("button", { name: "Add tag" }));

    expect(screen.getByRole("button", { name: "Remove tag followup" })).toBeInTheDocument();
  });

  it("creates a user folder from the left pane", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText("Folder name"));
    await user.type(screen.getByLabelText("Folder name"), "Meeting archive");
    await user.click(screen.getByRole("button", { name: "Add folder" }));

    expect(screen.getByRole("button", { name: "Meeting archive" })).toBeInTheDocument();
  });


  it("filters notes by search query", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText("Search notes"), "reading");

    expect(screen.getAllByText("Reading list").length).toBeGreaterThan(0);
    expect(within(screen.getByLabelText("Notes list")).queryByText("Weekly priorities")).not.toBeInTheDocument();
    const notesList = within(screen.getByLabelText("Notes list")).getByRole("list");
    expect(within(notesList).getAllByRole("listitem")).toHaveLength(1);
  });

  it("collapses and restores the collection column", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(document.querySelector(".workspace-grid")).not.toHaveClass("collection-collapsed");

    await user.click(screen.getByRole("button", { name: "Collapse collection" }));
    expect(document.querySelector(".workspace-grid")).toHaveClass("collection-collapsed");
    expect(screen.getByRole("button", { name: "Expand collection" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand collection" }));
    expect(document.querySelector(".workspace-grid")).not.toHaveClass("collection-collapsed");
  });

  it("collapses and expands sidebar sections", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByRole("button", { name: /^Notes/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All shared/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Work" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse workspace" }));
    expect(screen.queryByRole("button", { name: /^Notes/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand workspace" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse folders" }));
    expect(screen.queryByRole("button", { name: "Work" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand folders" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse collaboration" }));
    expect(screen.queryByRole("button", { name: /All shared/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand collaboration" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand workspace" }));
    await user.click(screen.getByRole("button", { name: "Expand folders" }));
    await user.click(screen.getByRole("button", { name: "Expand collaboration" }));

    expect(screen.getByRole("button", { name: /^Notes/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All shared/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Work" })).toBeInTheDocument();
  });

  it("searches across the whole workspace regardless of the current view", async () => {
    const user = userEvent.setup();

    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Navigation" });
    await user.click(within(navigation).getByRole("button", { name: /Archive/ }));
    await user.type(screen.getByLabelText("Search notes"), "weekly");

    expect(screen.getAllByText("Weekly priorities").length).toBeGreaterThan(0);
    expect(screen.getByText("Across workspace")).toBeInTheDocument();
  });

  it("switches between organization views and restores archived notes", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByText("Weekly priorities"));
    await user.click(screen.getByRole("button", { name: "Archive" }));

    const navigation = screen.getByRole("navigation", { name: "Navigation" });
    await user.click(within(navigation).getByRole("button", { name: /Archive/ }));

    expect(screen.getAllByText("Weekly priorities").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Unarchive" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unarchive" }));
    await user.click(within(navigation).getByRole("button", { name: /^Notes/ }));
    expect(screen.queryByRole("button", { name: "Unarchive" })).not.toBeInTheDocument();
  });

  it("moves a note to trash and restores it", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByText("Weekly priorities"));
    await user.click(screen.getByRole("button", { name: "Move to trash" }));

    const navigation = screen.getByRole("navigation", { name: "Navigation" });
    await user.click(within(navigation).getByRole("button", { name: /Trash/ }));
    expect(screen.getAllByText("Weekly priorities").length).toBeGreaterThan(0);

    const inspector = screen.getByLabelText("Inspector");
    await user.click(within(inspector).getByRole("button", { name: /^Restore$/ }));
    expect(within(inspector).queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
  });

  it("stores restore points and can roll back to an earlier version", async () => {
    const user = userEvent.setup();

    render(<App />);

    const title = screen.getByLabelText("Title");
    const body = screen.getByLabelText("Body");

    fireEvent.change(title, { target: { value: "Changed title" } });
    fireEvent.change(body, { target: { value: "Temporary meeting notes" } });

    await user.click(screen.getByText("History"));
    const history = screen.getByLabelText("Version history");
    expect(history).toBeInTheDocument();
    const restoreButtons = within(history).getAllByRole("button", { name: /Restore version from/ });
    fireEvent.click(restoreButtons[restoreButtons.length - 1]);

    expect(screen.getByLabelText("Title")).toHaveValue("Design the notes surface");
    expect(screen.getByLabelText("Body")).toHaveValue(
      "# Layout direction\n\nKeep the interface editorial and calm.\n\n- Left navigation for organization\n- Center list for fast scanning\n- Right editor for focused writing"
    );
  });

  it("creates a note via keyboard shortcut", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.keyboard("{Control>}n{/Control}");
    expect(screen.getByLabelText("Title")).toHaveValue("Untitled Note");
  });
});

  it("settings popover opens when gear button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const btn = screen.getByRole("button", { name: "Appearance settings" });
    await user.click(btn);
    expect(screen.getByText("Light")).toBeInTheDocument();
  });
