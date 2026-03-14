import { NextRequest, NextResponse } from "next/server";

const BMRS_BASE = "https://data.elexon.co.uk/bmrs/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  try {
    const url = `${BMRS_BASE}/datasets/FUELHH/stream?settlementDateFrom=${from}&settlementDateTo=${to}&fuelType=WIND`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("BMRS FUELHH error:", res.status, text);
      throw new Error(`BMRS API returned ${res.status}`);
    }

    const data = await res.json();

    const actuals = data
      .map((d: Record<string, unknown>) => ({
        startTime: d.startTime as string,
        generation: d.generation as number,
      }))
      .sort(
        (a: { startTime: string }, b: { startTime: string }) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

    return NextResponse.json(actuals, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch actual generation data";
    console.error("Error fetching actuals:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
