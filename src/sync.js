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

// ---------- Google Drive: planned ----------
//
// Plan (no backend needed; everything runs in the browser):
//   1. Auth: Google Identity Services token client, scope `drive.file`
//      (the app can only see files it created, so the rest of your Drive stays private).
//   2. Storage: a single file `Ritual/ritual-data.json` in My Drive, readable by you like any other file.
//   3. Push: subscribe to store changes, debounce about 5 s, PATCH the file via the Drive v3 upload API.
//   4. Pull: on app open and on focus, GET the file's `modifiedTime`. If it is newer than
//      the local `updatedAt`, load the remote copy with store.replace().
//   5. Conflicts: last write wins on the whole document, and before overwriting, a timestamped
//      backup is written next to it, e.g. `ritual-data.2026-11-02T18-30.json`.
//   6. Offline: changes stay in localStorage and push on the next successful connection.
//
// Setup needed later: a Google Cloud OAuth client ID with the GitHub Pages origin authorised.

export const drive = {
  available: false,
  label: 'Save to Google Drive',
  async connect() {
    throw new Error('Google Drive sync is not built yet.');
  },
};
