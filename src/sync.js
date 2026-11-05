// Where the data document can live besides this device.
//
// Every provider moves the same JSON document defined in store.js, so adding Google Drive
// later is an extra provider, not a data-model change.

import { store, migrate } from './store.js';
import { today } from './util.js';

// ---------- File (export / import): available now ----------

export function exportToFile() {
  const json = JSON.stringify(store.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ritual-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read a File chosen by the user and replace local data with it. Throws a readable error. */
export async function importFromFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  migrate(parsed); // validate before touching local data
  store.replace(parsed);
}

// ---------- Calendar reminders (.ics): no server needed ----------
// iPhone Calendar imports the file and then reminds you itself, which is the most reliable
// prompt a home-screen web app can get.

const BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function nextDate(isoWeekday) {
  const d = new Date();
  const cur = ((d.getDay() + 6) % 7) + 1; // 1 = Mon … 7 = Sun
  d.setDate(d.getDate() + ((isoWeekday - cur + 7) % 7));
  return d;
}

function stamp(d, time) {
  const [h, m] = (time || '18:00').split(':').map(Number);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(h)}${p(m)}00`;
}

function vevent(uid, title, desc, day, time, minutes) {
  const start = nextDate(day);
  const [h, m] = (time || '18:00').split(':').map(Number);
  const endMin = h * 60 + m + minutes;
  const endTime = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@ritual`,
    `DTSTAMP:${stamp(new Date(), '00:00')}Z`,
    `DTSTART:${stamp(start, time)}`,
    `DTEND:${stamp(start, endTime)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[day]}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'TRIGGER:-PT15M', 'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

/** Build weekly gym/run/planning events and hand them to Calendar. */
export function buildCalendar(sched) {
  const events = [];
  for (const d of sched.gymDays || []) events.push(vevent(`gym-${d}`, 'Ritual · Train', 'Open Ritual: today’s session is ready.', d, sched.gymTime, 75));
  for (const d of sched.runDays || []) events.push(vevent(`run-${d}`, 'Ritual · Run', 'Open Ritual: run-walk session, talking pace.', d, sched.runTime, 35));
  if (sched.sundayPlan) events.push(vevent('plan-sun', 'Ritual · Plan the week', 'Pick this week’s meals and check the grocery list.', 7, '17:00', 15));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ritual//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function downloadCalendar(sched) {
  const blob = new Blob([buildCalendar(sched)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ritual-schedule.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ---------- Google Drive sync ----------
// Browser-only: Google Identity Services gives a short-lived token with the `drive.file`
// scope, so Ritual can only see the one file it creates (Ritual/ritual-data.json).
// Setup: a Google Cloud OAuth client ID (Web) with this site's origin authorised; pasted
// into Settings. Tokens last about an hour; after that, sync asks you to reconnect.

const DRIVE_KEY = 'ritual-drive';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'ritual-data.json';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

function loadState() {
  try { return JSON.parse(localStorage.getItem(DRIVE_KEY) || '{}'); } catch { return {}; }
}
function saveState(st) {
  try { localStorage.setItem(DRIVE_KEY, JSON.stringify(st)); } catch { /* full */ }
}

let gisLoading = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Couldn’t reach Google. Check your connection.'));
    document.head.appendChild(s);
  });
  return gisLoading;
}

export const drive = {
  state: loadState(),

  connected() { return !!this.state.fileId || !!this.state.token; },
  tokenValid() { return !!this.state.token && Date.now() < (this.state.expiresAt || 0) - 60000; },

  /** Get a token. interactive=true may show Google's consent popup (must follow a tap). */
  async token(clientId, interactive) {
    if (this.tokenValid()) return this.state.token;
    if (!interactive) return null;
    if (!clientId) throw new Error('Add your Google OAuth client ID in Settings first.');
    await loadGis();
    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (res) => {
          if (res.error) return reject(new Error(res.error_description || res.error));
          this.state.token = res.access_token;
          this.state.expiresAt = Date.now() + (Number(res.expires_in) || 3600) * 1000;
          saveState(this.state);
          resolve(res.access_token);
        },
        error_callback: (err) => reject(new Error(err?.message || 'Google sign-in was closed.')),
      });
      client.requestAccessToken({ prompt: this.state.consented ? '' : 'consent' });
      this.state.consented = true;
    });
  },

  async api(token, url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
    if (res.status === 401) {
      this.state.token = null;
      saveState(this.state);
      throw new Error('Google session expired. Tap Sync to reconnect.');
    }
    if (!res.ok) throw new Error(`Drive error ${res.status}`);
    return res;
  },

  async findFile(token) {
    if (this.state.fileId) return { id: this.state.fileId };
    const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
    const res = await this.api(token, `${API}/files?q=${q}&spaces=drive&fields=files(id,modifiedTime)`);
    const { files } = await res.json();
    return files?.[0] || null;
  },

  async ensureFolder(token) {
    if (this.state.folderId) return this.state.folderId;
    const q = encodeURIComponent("name='Ritual' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const found = await (await this.api(token, `${API}/files?q=${q}&fields=files(id)`)).json();
    if (found.files?.[0]) return (this.state.folderId = found.files[0].id);
    const res = await this.api(token, `${API}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ritual', mimeType: 'application/vnd.google-apps.folder' }),
    });
    return (this.state.folderId = (await res.json()).id);
  },

  async download(token, id) {
    const res = await this.api(token, `${API}/files/${id}?alt=media`);
    return res.json();
  },

  async upload(token, doc) {
    const body = JSON.stringify(doc);
    if (this.state.fileId) {
      await this.api(token, `${UPLOAD}/files/${this.state.fileId}?uploadType=media&fields=id`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body,
      });
    } else {
      const folder = await this.ensureFolder(token);
      const boundary = 'ritual' + Math.random().toString(36).slice(2);
      const meta = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json', parents: [folder] });
      const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
      const res = await this.api(token, `${UPLOAD}/files?uploadType=multipart&fields=id`, {
        method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart,
      });
      this.state.fileId = (await res.json()).id;
    }
    this.state.lastSyncAt = new Date().toISOString();
    this.state.lastUpdatedAt = doc.updatedAt;
    saveState(this.state);
  },

  /**
   * Two-way sync. If Drive holds a newer copy than this phone (written by another device or
   * an earlier session), `confirmLoad(remote)` decides whether to load it; otherwise this
   * phone's data is uploaded. Returns 'pulled' | 'pushed' | 'needs-auth'.
   */
  async sync({ clientId, interactive = false, confirmLoad }) {
    const token = await this.token(clientId, interactive);
    if (!token) return 'needs-auth';
    const file = await this.findFile(token);
    if (file) {
      this.state.fileId = file.id;
      const remote = await this.download(token, file.id);
      const remoteNewer = remote?.updatedAt && remote.updatedAt > (store.data.updatedAt || '')
        && remote.updatedAt !== this.state.lastUpdatedAt;
      if (remoteNewer && (await confirmLoad(remote))) {
        migrate(remote);
        store.replace(remote);
        this.state.lastSyncAt = new Date().toISOString();
        this.state.lastUpdatedAt = store.data.updatedAt;
        saveState(this.state);
        return 'pulled';
      }
    }
    await this.upload(token, store.data);
    return 'pushed';
  },

  /** Quiet upload after edits, only while a token is valid. */
  async push() {
    if (!this.tokenValid() || !this.state.fileId) return false;
    await this.upload(this.state.token, store.data);
    return true;
  },

  disconnect() {
    const t = this.state.token;
    try { if (t) window.google?.accounts?.oauth2?.revoke?.(t, () => {}); } catch { /* ignore */ }
    this.state = {};
    saveState(this.state);
  },
};
