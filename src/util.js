// Small, dependency-free helpers.

/** Escape text for safe interpolation into HTML. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Short random id, good enough for a single-user local dataset. */
export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

/** Local calendar date as YYYY-MM-DD (not UTC, so late-night sessions land on the right day). */
export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-02" -> "Nov 2" */
export function shortDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** Monday of the week containing the given date, as YYYY-MM-DD. */
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return today(d);
}

/** Parse a user-typed number; returns null for blanks or garbage. */
export function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Format a number without trailing ".0". */
export function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/** Low end of a rep range string: "6-10" -> "6", "8-12 per leg" -> "8". */
export function repLow(reps) {
  const m = String(reps || '').match(/\d+/);
  return m ? m[0] : '';
}

/** Normalised key so the same lift on different days shares history. */
export function liftKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
