import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const dallasPlace = {
  name: "Dallas",
  admin1: "Texas",
  country: "United States",
  latitude: 32.78306,
  longitude: -96.80667
};

const londonPlace = {
  name: "London",
  admin1: "England",
  country: "United Kingdom",
  latitude: 51.50853,
  longitude: -0.12574
};

function makeWeatherData(overrides = {}) {
  return {
    current: {
      time: "2026-05-09T14:00",
      temperature_2m: 72.4,
      apparent_temperature: 74.1,
      relative_humidity_2m: 45,
      weather_code: 1,
      wind_speed_10m: 8.2,
      ...overrides.current
    },
    daily: {
      time: [
        "2026-05-09",
        "2026-05-10",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15"
      ],
      weather_code: [1, 2, 3, 61, 80, 0, 95],
      temperature_2m_max: [74, 76, 75, 72, 73, 80, 79],
      temperature_2m_min: [61, 62, 60, 58, 59, 64, 66],
      precipitation_probability_max: [10, 20, 30, 60, 50, 0, 70],
      ...overrides.daily
    },
    hourly: {
      time: Array.from({ length: 24 }, (_, index) => {
        return `2026-05-${String(9 + Math.floor(index / 24)).padStart(2, "0")}T${String(index).padStart(2, "0")}:00`;
      }),
      weather_code: Array.from({ length: 24 }, (_, index) => [1, 2, 3, 61][index % 4]),
      temperature_2m: Array.from({ length: 24 }, (_, index) => 65 + (index % 8)),
      precipitation_probability: Array.from({ length: 24 }, (_, index) => (index % 6) * 10),
      ...overrides.hourly
    }
  };
}

function jsonResponse(data, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data)
  };
}

function mockSuccessfulWeatherFetch(place = dallasPlace, weather = makeWeatherData()) {
  fetch.mockResolvedValueOnce(jsonResponse({ results: [place] }));
  fetch.mockResolvedValueOnce(jsonResponse(weather));
}

describe("App", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads Dallas weather by default", async () => {
    mockSuccessfulWeatherFetch();

    render(<App />);

    expect(screen.getByText("Loading the latest forecast...")).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Current weather for Dallas, Texas" })).toBeInTheDocument();
    expect(screen.getAllByText("Mainly clear").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "72°" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "7-day forecast" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "24-hour forecast" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Weather alerts" })).toHaveTextContent("No active alerts");
  });

  it("searches another city and renders the returned forecast", async () => {
    const user = userEvent.setup();
    mockSuccessfulWeatherFetch();
    mockSuccessfulWeatherFetch(
      londonPlace,
      makeWeatherData({
        current: {
          temperature_2m: 58.8,
          apparent_temperature: 57.1,
          relative_humidity_2m: 71,
          weather_code: 61,
          wind_speed_10m: 12
        },
        daily: {
          precipitation_probability_max: [65, 40, 25, 20, 15, 10, 5]
        }
      })
    );

    render(<App />);

    await screen.findByRole("region", { name: "Current weather for Dallas, Texas" });

    await user.clear(screen.getByLabelText("Search city"));
    await user.type(screen.getByLabelText("Search city"), "London");
    await user.click(screen.getByRole("button", { name: "Search weather" }));

    expect(await screen.findByRole("region", { name: "Current weather for London, England" })).toBeInTheDocument();
    expect(screen.getAllByText("Slight rain").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "59°" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Weather details")).getByText("71%")).toBeInTheDocument();
  });

  it("shows a validation message for an empty search", async () => {
    const user = userEvent.setup();
    mockSuccessfulWeatherFetch();

    render(<App />);

    await screen.findByRole("region", { name: "Current weather for Dallas, Texas" });

    await user.clear(screen.getByLabelText("Search city"));
    await user.click(screen.getByRole("button", { name: "Search weather" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a city to search.");
    expect(screen.queryByText("Dallas, Texas")).not.toBeInTheDocument();
  });

  it("shows an error when a city cannot be found", async () => {
    const user = userEvent.setup();
    mockSuccessfulWeatherFetch();
    fetch.mockResolvedValueOnce(jsonResponse({ results: [] }));

    render(<App />);

    await screen.findByRole("region", { name: "Current weather for Dallas, Texas" });

    await user.clear(screen.getByLabelText("Search city"));
    await user.type(screen.getByLabelText("Search city"), "Nopeville");
    await user.click(screen.getByRole("button", { name: "Search weather" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("City not found. Try another city.");
    expect(screen.queryByText("Dallas, Texas")).not.toBeInTheDocument();
  });
});
