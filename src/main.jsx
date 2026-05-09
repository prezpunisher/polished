import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const weatherCodes = {
  0: { label: "Clear sky", icon: "☀️", tone: "clear" },
  1: { label: "Mainly clear", icon: "🌤️", tone: "clear" },
  2: { label: "Partly cloudy", icon: "⛅", tone: "cloudy" },
  3: { label: "Overcast", icon: "☁️", tone: "cloudy" },
  45: { label: "Fog", icon: "🌫️", tone: "fog" },
  48: { label: "Rime fog", icon: "🌫️", tone: "fog" },
  51: { label: "Light drizzle", icon: "🌦️", tone: "rain" },
  53: { label: "Moderate drizzle", icon: "🌦️", tone: "rain" },
  55: { label: "Dense drizzle", icon: "🌧️", tone: "rain" },
  56: { label: "Freezing drizzle", icon: "🌧️", tone: "rain" },
  57: { label: "Freezing drizzle", icon: "🌧️", tone: "rain" },
  61: { label: "Slight rain", icon: "🌧️", tone: "rain" },
  63: { label: "Moderate rain", icon: "🌧️", tone: "rain" },
  65: { label: "Heavy rain", icon: "🌧️", tone: "rain" },
  66: { label: "Freezing rain", icon: "🌧️", tone: "rain" },
  67: { label: "Freezing rain", icon: "🌧️", tone: "rain" },
  71: { label: "Slight snow", icon: "🌨️", tone: "snow" },
  73: { label: "Moderate snow", icon: "🌨️", tone: "snow" },
  75: { label: "Heavy snow", icon: "❄️", tone: "snow" },
  77: { label: "Snow grains", icon: "❄️", tone: "snow" },
  80: { label: "Rain showers", icon: "🌦️", tone: "rain" },
  81: { label: "Rain showers", icon: "🌧️", tone: "rain" },
  82: { label: "Heavy showers", icon: "⛈️", tone: "storm" },
  85: { label: "Snow showers", icon: "🌨️", tone: "snow" },
  86: { label: "Snow showers", icon: "🌨️", tone: "snow" },
  95: { label: "Thunderstorm", icon: "⛈️", tone: "storm" },
  96: { label: "Thunderstorm with hail", icon: "⛈️", tone: "storm" },
  99: { label: "Thunderstorm with hail", icon: "⛈️", tone: "storm" }
};

function getCondition(code) {
  return weatherCodes[code] || { label: "Weather unavailable", icon: "🌡️", tone: "cloudy" };
}

function formatLocation(place) {
  const region = place.admin1 || place.country;
  return region ? `${place.name}, ${region}` : place.name;
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function App() {
  const [city, setCity] = useState("Dallas");
  const [submittedCity, setSubmittedCity] = useState("Dallas");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWeather("Dallas");
  }, []);

  async function getWeather(searchCity) {
    const cleanCity = searchCity.trim();

    if (!cleanCity) {
      setError("Enter a city to search.");
      setWeather(null);
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
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
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

  const current = weather?.current;
  const daily = weather?.daily;
  const currentCondition = useMemo(
    () => getCondition(current?.weather_code),
    [current?.weather_code]
  );
  const todayHigh = daily ? Math.round(daily.temperature_2m_max[0]) : null;
  const todayLow = daily ? Math.round(daily.temperature_2m_min[0]) : null;

  return (
    <main className={`app ${currentCondition.tone}`}>
      <section className="window" aria-label="Weather search app">
        <header className="titlebar">
          <div className="traffic-lights" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="brand">
            <p>Weather</p>
            <span>Current conditions and 7-day outlook</span>
          </div>

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
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        {loading && !weather && <p className="empty">Loading the latest forecast...</p>}

        {current && daily && (
          <div className="dashboard">
            <section className="current-weather" aria-label={`Current weather for ${locationName}`}>
              <div className="current-topline">
                <p className="location">{locationName}</p>
                <span>{new Date().toLocaleDateString("en-US", { weekday: "long" })}</span>
              </div>

              <div className="hero-weather">
                <div>
                  <p className="eyebrow">Now</p>
                  <h1>{Math.round(current.temperature_2m)}°</h1>
                  <p className="condition">{currentCondition.label}</p>
                </div>

                <div className="weather-visual" aria-label={currentCondition.label} role="img">
                  <span>{currentCondition.icon}</span>
                </div>
              </div>

              <div className="today-range">
                <span>High {todayHigh}°</span>
                <span>Low {todayLow}°</span>
                <span>Feels {Math.round(current.apparent_temperature)}°</span>
              </div>

              <p className="quick-note">
                A clean forecast for {submittedCity}, updated from Open-Meteo.
              </p>
            </section>

            <aside className="details-panel" aria-label="Weather details">
              <div className="panel-head">
                <p>Details</p>
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

            <section className="forecast" aria-label="7-day forecast">
              <div className="section-title">
                <div>
                  <p>Forecast</p>
                  <h2>Next 7 days</h2>
                </div>
                <span>{locationName}</span>
              </div>

              <div className="forecast-grid">
                {daily.time.map((day, index) => {
                  const dayCondition = getCondition(daily.weather_code[index]);

                  return (
                    <article className="forecast-card" key={day}>
                      <div className="forecast-day">
                        <strong>
                          {new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
                            weekday: "short"
                          })}
                        </strong>
                        <span>{formatDate(day)}</span>
                      </div>
                      <span className="forecast-icon" aria-hidden="true">{dayCondition.icon}</span>
                      <p className="forecast-temp">
                        {Math.round(daily.temperature_2m_max[index])}°
                        <span>{Math.round(daily.temperature_2m_min[index])}°</span>
                      </p>
                      <p className="forecast-condition">{dayCondition.label}</p>
                      <p className="rain">{daily.precipitation_probability_max[index] ?? 0}% rain</p>
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

createRoot(document.getElementById("root")).render(<App />);
