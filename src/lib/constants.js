export const STORAGE_KEY = "polished-notes-app";
export const UI_KEY = "polished-ui";
export const MAX_VERSIONS = 20;

export const colorOptions = [
  { value: "amber", label: "Amber", swatch: "#f1b879" },
  { value: "rose", label: "Rose", swatch: "#f28b9e" },
  { value: "jade", label: "Jade", swatch: "#69d3b0" },
  { value: "sky", label: "Sky", swatch: "#7fb7ff" },
  { value: "violet", label: "Violet", swatch: "#b59bff" }
];

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
