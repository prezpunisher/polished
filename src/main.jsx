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

  return (
    <main className={`app ${currentCondition.tone}`}>
      <section className="workspace" aria-label="Weather search app">
        <div className="hero">
          <div>
            <p className="eyebrow">Simple Weather</p>
            <h1>Fast forecasts without the clutter.</h1>
            <p className="subtitle">
              Search any city for current conditions and a clean 7-day outlook.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="search">
            <label htmlFor="city">City</label>
            <div className="search-row">
              <input
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Enter a city"
                autoComplete="address-level2"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Searching" : "Search"}
              </button>
            </div>
          </form>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {current && (
          <section className="current-weather" aria-label={`Current weather for ${locationName}`}>
            <div className="current-copy">
              <p className="location">{locationName}</p>
              <div className="temperature-line">
                <h2>{Math.round(current.temperature_2m)}°F</h2>
                <p>{currentCondition.label}</p>
              </div>
              <p className="quick-note">
                Feels like {Math.round(current.apparent_temperature)}°F in {submittedCity}.
              </p>
            </div>

            <div className="weather-visual" aria-label={currentCondition.label} role="img">
              <span>{currentCondition.icon}</span>
            </div>

            <div className="stats" aria-label="Current weather details">
              <div>
                <span>Feels Like</span>
                <strong>{Math.round(current.apparent_temperature)}°F</strong>
              </div>
              <div>
                <span>Humidity</span>
                <strong>{current.relative_humidity_2m}%</strong>
              </div>
              <div>
                <span>Wind</span>
                <strong>{Math.round(current.wind_speed_10m)} mph</strong>
              </div>
            </div>
          </section>
        )}

        {daily && (
          <section className="forecast" aria-label="7-day forecast">
            <div className="section-title">
              <h3>7-Day Forecast</h3>
              <p>Highs, lows, rain chance, and condition at a glance.</p>
            </div>

            <div className="forecast-grid">
              {daily.time.map((day, index) => {
                const dayCondition = getCondition(daily.weather_code[index]);

                return (
                  <article className="forecast-card" key={day}>
                    <div className="forecast-top">
                      <strong>
                        {new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
                          weekday: "short"
                        })}
                      </strong>
                      <span aria-hidden="true">{dayCondition.icon}</span>
                    </div>
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
        )}

        {!weather && !loading && !error && (
          <p className="empty">Search a city to see the current weather and weekly forecast.</p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
