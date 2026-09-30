"use client";

import { useMemo, useState } from "react";
import { addDays, generateWashDates, parseISODate, toISODate, type Weekday } from "@/lib/schedule";

const WEEKDAY_OPTIONS: { label: string; value: Weekday }[] = [
  { label: "Mån", value: 1 },
  { label: "Tis", value: 2 },
  { label: "Ons", value: 3 },
  { label: "Tor", value: 4 },
  { label: "Fre", value: 5 },
  { label: "Lör", value: 6 },
  { label: "Sön", value: 0 },
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
      <section className="flex flex-col gap-5 rounded-2xl border border-card-border/40 bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-foreground">
            Senaste tvättdag
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-card-border/40 bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="interval" className="text-sm font-medium text-foreground">
            Tvätta var N:e dag
          </label>
          <input
            id="interval"
            type="number"
            min={1}
            max={60}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-24 rounded-lg border border-card-border/40 bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Föredragna veckodagar <span className="font-normal text-muted">(valfritt)</span>
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
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-card-border/40 text-muted hover:border-accent/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Lämna alla omarkerade för att tvätta den dag intervallet hamnar
            på. Markerar du några flyttas varje tvättdag till närmaste valda
            dag.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="skipDates" className="text-sm font-medium text-foreground">
            Datum att undvika <span className="font-normal text-muted">(valfritt)</span>
          </label>
          <input
            id="skipDates"
            type="text"
            placeholder="2026-10-12, 2026-11-01"
            value={skipDatesText}
            onChange={(e) => setSkipDatesText(e.target.value)}
            className="rounded-lg border border-card-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
          />
          <p className="text-xs text-muted">
            Kommaseparerade datum i formatet ÅÅÅÅ-MM-DD, t.ex. en stor
            händelse du aldrig vill vara mitt i rutinen på.
          </p>
        </div>
      </section>

      {previewDates.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Nästa tvättdagar</h2>
          <ul className="flex flex-wrap gap-2">
            {previewDates.map((d) => (
              <li
                key={d}
                className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-foreground"
              >
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-card-border/40 bg-card p-6">
        <h2 className="text-sm font-medium text-foreground">Ditt kalenderflöde</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            suppressHydrationWarning
            value={feedUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 truncate rounded-lg border border-card-border/40 bg-background px-3 py-2 font-mono text-xs text-muted"
          />
          <button
            type="button"
            onClick={copyFeedUrl}
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            {copied ? "Kopierad!" : "Kopiera länk"}
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-4 text-sm text-muted">
          <div>
            <p className="font-medium text-foreground">Google Kalender</p>
            <p>
              Inställningar → Lägg till kalender → Från URL → klistra in
              länken ovan → Lägg till kalender.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Apple Kalender (iOS / macOS)</p>
            <p>
              Inställningar → Kalender → Konton → Lägg till konto → Annat →
              Lägg till prenumererad kalender → klistra in länken ovan.
            </p>
          </div>
          <p className="text-xs text-muted/80">
            När du väl prenumererar dyker framtida tvättdagar upp automatiskt
            allt eftersom tiden går — du behöver inte röra det igen. Ändrar
            du rutinen ovan ändras även länken, så prenumerera på den nya
            (och ta bort den gamla prenumerationen).
          </p>
        </div>
      </section>
    </div>
  );
}
