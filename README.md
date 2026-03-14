# Wind Power Forecast Monitor

A forecast monitoring application for UK national-level wind power generation. Displays actual vs forecasted wind generation for January 2024, allowing users to explore forecast accuracy across different time ranges and forecast horizons.

## Live Demo

App link: *TODO — add Vercel/Heroku link after deployment*

## Files & Directories

```
app/
  page.tsx              — Main page with controls (date pickers, horizon slider) and chart
  layout.tsx            — Root layout with metadata and fonts
  globals.css           — Global styles and custom slider styling
  lib/
    types.ts            — Shared TypeScript interfaces (ActualDataPoint, ForecastDataPoint, etc.)
  components/
    forecast-chart.tsx  — Recharts line chart with custom tooltip, loading and empty states
    stats-cards.tsx     — Error metric cards (MAE, RMSE, MAPE, Max Error)
  api/
    actuals/route.ts    — Next.js API route proxying BMRS FUELHH endpoint (actual wind generation)
    forecasts/route.ts  — Next.js API route proxying BMRS WINDFOR endpoint (wind forecasts)
public/                 — Static assets
```

## How It Works

1. The user selects a **start time**, **end time** (within January 2024), and a **forecast horizon** (0–48 hours).
2. Two API calls run in parallel from the client:
   - `/api/actuals` fetches half-hourly actual wind generation from the BMRS FUELHH dataset filtered by `fuelType=WIND`.
   - `/api/forecasts` fetches wind forecasts from the BMRS WINDFOR dataset. For each 30-minute target time, the API keeps only the **latest** forecast that was published at least *horizon* hours before that target time (and no more than 48 hours before).
3. The frontend merges both datasets by rounding timestamps to the nearest 30-minute boundary, then renders an overlaid line chart (blue = actual, green = forecast).
4. Error metrics (MAE, RMSE, MAPE, Max Error) are computed from the matched data points.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** (App Router, API Routes)
- **React 19**
- **Recharts** (charting)
- **Tailwind CSS 4** (styling)
- **TypeScript**

## Data Source

- [BMRS Elexon API](https://bmrs.elexon.co.uk/api-documentation) — FUELHH and WINDFOR datasets
- Data is scoped to **January 2024** with forecast horizons between **0–48 hours**

## AI Tools Usage

AI tools (GitHub Copilot) were used to assist with:
- CSS/Tailwind styling and responsive layout
- TypeScript type definitions
- Boilerplate code generation

All application logic, API integration, data processing, and chart configuration were written and reviewed manually.
