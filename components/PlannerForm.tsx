"use client";

import { useMemo, useState } from "react";
import { addDays, generateWashDates, parseISODate, toISODate, type Weekday } from "@/lib/schedule";

const WEEKDAY_OPTIONS: { label: string; value: Weekday }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

function todayISO(): string {
  return toISODate(new Date());
}

export default function PlannerForm() {
  const [startDate, setStartDate] = useState(todayISO);
  const [intervalDays, setIntervalDays] = useState(3);
  const [weekdays, setWeekdays] = useState<Set<Weekday>>(new Set());
  const [skipDatesText, setSkipDatesText] = useState("");
  const [copied, setCopied] = useState(false);

  // Only defined in the browser; SSR renders a relative path instead, and
  // the input below opts out of hydration warnings for this one attribute.
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const skipDates = useMemo(
    () =>
      skipDatesText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    [skipDatesText],
  );

  const weekdayList = useMemo(() => [...weekdays].sort(), [weekdays]);

  const feedPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set("start", startDate);
    params.set("interval", String(intervalDays));
    if (weekdayList.length > 0) params.set("weekdays", weekdayList.join(","));
    if (skipDates.length > 0) params.set("skip", skipDates.join(","));
    return `/api/feed?${params.toString()}`;
  }, [startDate, intervalDays, weekdayList, skipDates]);

  const feedUrl = origin ? `${origin}${feedPath}` : feedPath;

  const previewDates = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || intervalDays < 1) return [];
    // Horizon derived purely from the inputs (not "now") so this preview
    // stays a pure function of state: enough interval-lengths ahead to
    // guarantee 6 occurrences even after skip-date pushes.
    const horizon = addDays(parseISODate(startDate), intervalDays * 8 + 30);
    return generateWashDates(
      { startDate, intervalDays, weekdays: weekdayList, skipDates },
      horizon,
    ).slice(0, 6);
  }, [startDate, intervalDays, weekdayList, skipDates]);

  function toggleWeekday(value: Weekday) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable (e.g. insecure context) — user can select
      // the text field manually.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Last wash date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="interval" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Wash every N days
          </label>
          <input
            id="interval"
            type="number"
            min={1}
            max={60}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Preferred weekdays <span className="font-normal text-zinc-500">(optional)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((opt) => {
              const active = weekdays.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleWeekday(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-500">
            Leave all unselected to wash on whatever day the interval lands
            on. Selecting some nudges each wash day to the nearest one.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="skipDates" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Dates to avoid <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <input
            id="skipDates"
            type="text"
            placeholder="2026-10-12, 2026-11-01"
            value={skipDatesText}
            onChange={(e) => setSkipDatesText(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <p className="text-xs text-zinc-500">
            Comma-separated YYYY-MM-DD dates, e.g. a big event you never want
            to be mid-routine on.
          </p>
        </div>
      </section>

      {previewDates.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Next wash days
          </h2>
          <ul className="flex flex-wrap gap-2">
            {previewDates.map((d) => (
              <li
                key={d}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Your calendar feed
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            suppressHydrationWarning
            value={feedUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 truncate rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          />
          <button
            type="button"
            onClick={copyFeedUrl}
            className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Google Calendar</p>
            <p>
              Settings → Add calendar → From URL → paste the link above → Add
              calendar.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Apple Calendar (iOS / macOS)
            </p>
            <p>
              Settings → Calendar → Accounts → Add Account → Other → Add
              Subscribed Calendar → paste the link above.
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Once subscribed, future wash days keep appearing automatically as
            time passes — no need to touch it again. If you change your
            routine above, the link changes too, so re-subscribe with the new
            one (and remove the old subscription).
          </p>
        </div>
      </section>
    </div>
  );
}
