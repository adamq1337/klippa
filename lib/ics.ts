// Minimal iCalendar (RFC 5545) generator for all-day events. Deliberately
// small: we only ever emit a flat list of single-day VEVENTs.

export interface IcsEvent {
  /** ISO date (YYYY-MM-DD) of the all-day event. */
  date: string;
  /** Stable id: same input config + date must always produce the same UID,
   *  so calendar apps update the event in place on refresh instead of
   *  duplicating it. */
  uid: string;
  summary: string;
}

function toIcsDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function nextDayIcs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return toIcsDate(date.toISOString().slice(0, 10));
}

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines longer than 75 octets should be folded with a
  // leading space on continuation lines.
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function escapeText(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildIcsCalendar(events: IcsEvent[], calendarName: string): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//klippa//hair-wash-schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
      `DTEND;VALUE=DATE:${nextDayIcs(event.date)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
