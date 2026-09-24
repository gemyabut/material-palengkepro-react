// H12 — dates formatted via `.toISOString().slice(0, 10)` are wrong in any
// timezone ahead of UTC: toISOString() first converts to UTC, so in Manila
// (UTC+8) that expression yields yesterday's date between midnight and
// 8 a.m., and a date built at local midnight (e.g. `new Date(y, m, 1)`) is
// ALWAYS one day early — bank reconciliation's "start of month" showed the
// previous month's last day, every time, regardless of hour.
//
// toLocalDateString() reads the Date object's LOCAL getters (getFullYear/
// getMonth/getDate) directly, never converting to UTC, so the calendar day
// shown always matches the viewer's own wall-clock day.

export function toLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
