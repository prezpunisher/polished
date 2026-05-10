import { describe, expect, it } from "vitest";
import { formatDate, formatLocation, getCondition } from "./weather";

describe("weather helpers", () => {
  it("maps known weather codes to user-facing conditions", () => {
    expect(getCondition(0)).toEqual({
      label: "Clear sky",
      icon: "☀️",
      tone: "clear"
    });
    expect(getCondition(95).label).toBe("Thunderstorm");
  });

  it("returns a fallback condition for unknown weather codes", () => {
    expect(getCondition(999)).toEqual({
      label: "Weather unavailable",
      icon: "🌡️",
      tone: "cloudy"
    });
  });

  it("formats locations with region or country when available", () => {
    expect(formatLocation({ name: "Dallas", admin1: "Texas", country: "United States" })).toBe(
      "Dallas, Texas"
    );
    expect(formatLocation({ name: "Paris", country: "France" })).toBe("Paris, France");
    expect(formatLocation({ name: "Atlantis" })).toBe("Atlantis");
  });

  it("formats ISO dates for compact forecast cards", () => {
    expect(formatDate("2026-05-09")).toBe("May 9");
  });
});
