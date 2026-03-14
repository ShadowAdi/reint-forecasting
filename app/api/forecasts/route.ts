import { NextRequest, NextResponse } from "next/server";

const BMRS_BASE = "https://data.elexon.co.uk/bmrs/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const horizon = parseFloat(searchParams.get("horizon") || "4");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters (ISO 8601)" },
      { status: 400 }
    );
  }

  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const publishFrom = new Date(fromDate.getTime() - 48 * 3600 * 1000);
    const publishTo = new Date(toDate.getTime());

    const url = `${BMRS_BASE}/datasets/WINDFOR/stream?publishDateTimeFrom=${publishFrom.toISOString()}&publishDateTimeTo=${publishTo.toISOString()}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("BMRS WINDFOR error:", res.status, text);
      throw new Error(`BMRS API returned ${res.status}`);
    }

    const data = await res.json();

    const horizonMs = horizon * 3600 * 1000;
    const targetFrom = fromDate.getTime();
    const targetTo = toDate.getTime();
    const maxHorizonMs = 48 * 3600 * 1000;

    const forecastMap = new Map<
      string,
      { publishTime: string; generation: number; publishMs: number }
    >();

    for (const d of data) {
      const startMs = new Date(d.startTime as string).getTime();
      const publishMs = new Date(d.publishTime as string).getTime();
      const forecastHorizonMs = startMs - publishMs;

      if (startMs < targetFrom || startMs > targetTo) continue;
      if (forecastHorizonMs < horizonMs) continue;
      if (forecastHorizonMs > maxHorizonMs) continue;

      const key = new Date(startMs).toISOString();
      const existing = forecastMap.get(key);
      if (!existing || publishMs > existing.publishMs) {
        forecastMap.set(key, {
          publishTime: d.publishTime as string,
          generation: d.generation as number,
          publishMs,
        });
      }
    }

    const forecasts = Array.from(forecastMap.entries())
      .map(([startTime, val]) => ({
        startTime,
        generation: val.generation,
        publishTime: val.publishTime,
      }))
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

    return NextResponse.json(forecasts, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch forecast data";
    console.error("Error fetching forecasts:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
