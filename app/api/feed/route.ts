import { NextRequest, NextResponse } from "next/server";
import { generateWashDates, validateConfig, type Weekday } from "@/lib/schedule";
import { buildIcsCalendar } from "@/lib/ics";

export const runtime = "nodejs";

const HORIZON_DAYS_AHEAD = 365;
const LOOKBACK_DAYS = 14; // keep a couple of recent events visible too

function parseIntList(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
}

function parseDateList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const startDate = params.get("start") ?? "";
  const intervalDays = Number(params.get("interval") ?? "");
  const weekdays = parseIntList(params.get("weekdays")) as Weekday[];
  const skipDates = parseDateList(params.get("skip"));

  const errors = validateConfig({ startDate, intervalDays, weekdays, skipDates });
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const today = new Date();
  const horizon = new Date(today.getTime() + HORIZON_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const cutoff = new Date(today.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const dates = generateWashDates({ startDate, intervalDays, weekdays, skipDates }, horizon).filter(
    (d) => new Date(d).getTime() >= cutoff.getTime(),
  );

  const events = dates.map((date) => ({
    date,
    uid: `wash-${date}@klippa`,
    summary: "Tvätta håret",
  }));

  const ics = buildIcsCalendar(events, "Hårtvättdagar");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
