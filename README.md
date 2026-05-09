# Simple Weather App

A beginner-friendly React weather app based on `weather_app_scope.md`.

## MVP

- Search for any city.
- Show current temperature and basic weather condition.
- Show a large weather visual for the current condition.
- Show a 7-day forecast with highs, lows, conditions, and rain chance.
- Keep the interface simple and responsive.

## Tech

- React
- Vite
- Open-Meteo Geocoding API
- Open-Meteo Forecast API

Open-Meteo does not require an API key for this MVP.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually:

```bash
http://localhost:5173
```

## Project Structure

```text
simple-weather-app/
  index.html
  src/
    main.jsx
    style.css
```

## Version 1 Scope

Out of scope for this first version:

- User accounts
- Saved favorite locations
- Advanced analytics such as UV index and pressure
- Push notifications
- Maps or radar
- Dark mode
