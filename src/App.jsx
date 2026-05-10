import React, { useEffect, useMemo, useState } from "react";
import { formatDate, formatLocation, getCondition } from "./weather";
import "./style.css";

export default function App() {
  const [city, setCity] = useState("Dallas");
  const [submittedCity, setSubmittedCity] = useState("Dallas");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [themePreference, setThemePreference] = useState("auto");
  const [isBarCompact, setIsBarCompact] = useState(false);

  useEffect(() => {
    getWeather("Dallas");
  }, []);

  useEffect(() => {
    function handleScroll() {
      setIsBarCompact(window.scrollY > 80);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function getWeather(searchCity) {
    const cleanCity = searchCity.trim();

    if (!cleanCity) {
      setError("Enter a city to search.");
      setWeather(null);
      setLocationName("");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cleanCity
      )}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error("Could not search for that city. Try again.");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        throw new Error("City not found. Try another city.");
      }

      const place = geoData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,cloud_cover_mean,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_hours=24`;
      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        throw new Error("Could not load weather right now. Try again.");
      }

      const weatherData = await weatherResponse.json();
      setWeather(weatherData);
      setLocationName(formatLocation(place));
      setSubmittedCity(cleanCity);
    } catch (err) {
      setWeather(null);
      setLocationName("");
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    getWeather(city);
  }

  function toggleTheme() {
    setThemePreference((currentThemePreference) => {
      const currentTheme = currentThemePreference === "auto" ? locationTheme : currentThemePreference;
      return currentTheme === "dark" ? "light" : "dark";
    });
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const locationTheme = current?.is_day === 1 ? "light" : "dark";
  const theme = themePreference === "auto" ? locationTheme : themePreference;
  const currentCondition = useMemo(
    () => getCondition(current?.weather_code, current?.is_day !== 0),
    [current?.weather_code, current?.is_day]
  );
  const todayHigh = daily ? Math.round(daily.temperature_2m_max[0]) : null;
  const todayLow = daily ? Math.round(daily.temperature_2m_min[0]) : null;

  return (
    <main className={`app ${currentCondition.tone} ${theme}-theme`}>
      <section className="weather-app" aria-label="Weather search app">
        <header className={`app-bar ${isBarCompact ? "compact" : ""}`}>
          <div className="location-stack">
            <div>
              <p className="location-name">{locationName || "Weather"}</p>
            </div>
          </div>

          {!isBarCompact && (
            <>
              <form onSubmit={handleSubmit} className="search">
                <label htmlFor="city">Search city</label>
                <div className="search-row">
                  <input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="City or place"
                    autoComplete="address-level2"
                  />
                  <button type="submit" disabled={loading} aria-label="Search weather">
                    {loading ? "..." : "Search"}
                  </button>
                </div>
              </form>

              <button
                className="theme-toggle"
                type="button"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-pressed={theme === "light"}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                onClick={toggleTheme}
              >
                <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
              </button>
            </>
          )}
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        {loading && !weather && <p className="empty">Loading the latest forecast...</p>}

        {current && daily && (
          <div className="home-grid">
            <section className="hero-panel" aria-label={`Current weather for ${locationName}`}>
              <div className="weather-animation" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="condition-row">
                <div>
                  <p className="eyebrow">Current weather</p>
                  <p className="condition">{currentCondition.label}</p>
                </div>
                <div className="weather-visual" aria-label={currentCondition.label} role="img">
                  <span>{currentCondition.icon}</span>
                </div>
              </div>

              <div className="temperature-header">
                <h1>{Math.round(current.temperature_2m)}°</h1>
                <div>
                  <span>Feels like {Math.round(current.apparent_temperature)}°</span>
                  <span>{todayHigh}° daytime / {todayLow}° nighttime</span>
                </div>
              </div>

              <p className="quick-note">
                {submittedCity} forecast from Open-Meteo. Daily values follow the main-screen pattern:
                condition, high, low, and precipitation probability.
              </p>
            </section>

            <section className="block alert-block" aria-label="Weather alerts">
              <div className="section-title">
                <div>
                  <p>Alerts</p>
                  <h2>No active alerts</h2>
                </div>
                <span>Current location</span>
              </div>
              <p className="muted-copy">No severe weather alert data is available from this MVP source.</p>
            </section>

            {hourly && (
              <section className="block hourly" aria-label="24-hour forecast">
                <div className="section-title">
                  <div>
                    <p>Hourly forecast</p>
                    <h2>Next 24 hours</h2>
                  </div>
                  <span>Temperature and rain</span>
                </div>

                <div className="hourly-strip">
                  {hourly.time.slice(0, 24).map((time, index) => {
                    const hourCondition = getCondition(hourly.weather_code[index]);
                    const hourLabel = new Date(time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      hour12: true
                    });

                    return (
                      <article className="hour-card" key={time}>
                        <strong>{index === 0 ? "Now" : hourLabel}</strong>
                        <span aria-hidden="true">{hourCondition.icon}</span>
                        <p>{Math.round(hourly.temperature_2m[index])}°</p>
                        <small>{hourly.precipitation_probability[index] ?? 0}%</small>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <aside className="block details-panel" aria-label="Weather details">
              <div className="section-title">
                <div>
                  <p>Blocks</p>
                  <h2>Conditions</h2>
                </div>
                <span>Right now</span>
              </div>
              <div className="stats">
                <div>
                  <span>Feels Like</span>
                  <strong>{Math.round(current.apparent_temperature)}°</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{current.relative_humidity_2m}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{Math.round(current.wind_speed_10m)} mph</strong>
                </div>
                <div>
                  <span>Rain Chance</span>
                  <strong>{daily.precipitation_probability_max[0] ?? 0}%</strong>
                </div>
              </div>
            </aside>

            <section className="block forecast" aria-label="7-day forecast">
              <div className="section-title">
                <div>
                  <p>Daily forecast</p>
                  <h2>Daily outlook</h2>
                </div>
                <span>{locationName}</span>
              </div>

              <div className="daily-trend">
                {daily.time.map((day, index) => {
                  return (
                    <article className="forecast-card" key={day}>
                      <div className="forecast-day">
                        <strong>
                          {index === 0
                            ? "Today"
                            : new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
                                weekday: "short"
                              })}
                        </strong>
                        <span>{formatDate(day)}</span>
                      </div>
                      <div className="forecast-summary">
                        <p className="forecast-temp">{Math.round(daily.temperature_2m_max[index])}°</p>
                        <p className="forecast-low">{Math.round(daily.temperature_2m_min[index])}° low</p>
                      </div>
                      <div className="rain-summary">
                        <span>Overcast</span>
                        <strong>{daily.cloud_cover_mean[index] ?? 0}%</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {!weather && !loading && !error && (
          <p className="empty">Search a city to see the current weather and weekly forecast.</p>
        )}
      </section>
    </main>
  );
}
