export const weatherCodes = {
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

export function getCondition(code) {
  return weatherCodes[code] || { label: "Weather unavailable", icon: "🌡️", tone: "cloudy" };
}

export function formatLocation(place) {
  const region = place.admin1 || place.country;
  return region ? `${place.name}, ${region}` : place.name;
}

export function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}
