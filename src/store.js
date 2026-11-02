// The single source of truth. One JSON document, versioned, saved to localStorage.
//
// The same document is what gets exported to a file and, later, synced to Google Drive.
// UI-only state (selected tab, open sections) lives under a separate key and is never exported.
//
// Document shape (schema 2):
// {
//   app: 'ritual', schema: 1, updatedAt: ISO string,
//   settings:  { unit: 'lb', waistUnit: 'in', proteinMin, proteinMax },
//   program:   [{ id, num, name, focus, note, optional, noRir, exercises: [{ id, name, sets, reps, effort, eq, url }] }],
//   current:   { [dayId]: { startedAt, sets: { [exerciseId]: [{ w, r, c }] } } },   // in-progress workout
//   sessions:  [{ id, dayId, dayName, date, startedAt, finishedAt,
//                 exercises: [{ exId, name, sets: [{ w, r }] }] }],                 // every finished workout, every set
//   body:      { weight: [{ d, v }], waist: [{ d, v }] },
//   nutrition: { meals: [{ id, name, portions }], portions: [{ label, value }],
//                today: { d, done: { [mealId]: true } },
//                recipes: [{ id, cat, title, protein, minutes, ingredients: [], steps: [], url, notes }],
//                groceries: [{ id, name, done }] }
// }

import { SEED_PROGRAM, SEED_MEALS, SEED_PORTIONS } from './seed.js';
import { clone, today } from './util.js';

export const SCHEMA = 2;
const DATA_KEY = 'ritual-v1';
const UI_KEY = 'ritual-ui';

export function defaultData() {
  return {
    app: 'ritual',
    schema: SCHEMA,
    updatedAt: new Date().toISOString(),
    settings: { unit: 'lb', waistUnit: 'in', proteinMin: 170, proteinMax: 190 },
    program: clone(SEED_PROGRAM),
    current: {},
    sessions: [],
    body: { weight: [], waist: [] },
    nutrition: {
      meals: clone(SEED_MEALS),
      portions: clone(SEED_PORTIONS),
      today: { d: today(), done: {} },
      recipes: [],
      groceries: [],
    },
  };
}

/**
 * Bring any older or partial document up to the current schema.
 * Add a step here whenever SCHEMA is bumped; never mutate old exports in place.
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a Ritual data file.');
  if (raw.app && raw.app !== 'ritual') throw new Error('This file is from a different app.');
  const schema = Number(raw.schema || 1);
  if (schema > SCHEMA) throw new Error('This file was made by a newer version of Ritual. Update the app first.');

  // Fill in anything missing with defaults, so partial or hand-edited files still load.
  const base = defaultData();
  const data = {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings || {}) },
    body: { ...base.body, ...(raw.body || {}) },
    nutrition: { ...base.nutrition, ...(raw.nutrition || {}) },
  };
  if (!Array.isArray(data.program) || data.program.length === 0) data.program = base.program;
  if (!Array.isArray(data.sessions)) data.sessions = [];
  if (!data.current || typeof data.current !== 'object') data.current = {};

  // v2: the 4-day program (Upper A, Legs, Upper B + leg top-up, Upper C, optional Pump) replaces the old 5-day one.
  if (schema < 2) data.program = clone(SEED_PROGRAM);

  // Drop in-progress logs for days that no longer exist.
  const dayIds = new Set(data.program.map((d) => d.id));
  for (const id of Object.keys(data.current)) if (!dayIds.has(id)) delete data.current[id];

  // Future migrations go here: if (schema < 3) { ... }

  data.app = 'ritual';
  data.schema = SCHEMA;
  return data;
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------- live state ----------

export const store = {
  data: null,
  ui: null,
  listeners: new Set(),

  init() {
    const saved = readJSON(DATA_KEY);
    try {
      this.data = saved ? migrate(saved) : defaultData();
    } catch {
      this.data = defaultData();
    }
    this.ui = {
      tab: 'train',
      view: null,        // null | 'settings' | 'recipe'
      dayId: null,
      editDayId: null,
      open: {},          // collapsible sections + expanded recipes
      ...(readJSON(UI_KEY) || {}),
    };
    this.ui.view = null; // always reopen on a main tab
    this.rolloverDay();
    this.persist();
  },

  /** Daily meal checklist resets when the calendar day changes. */
  rolloverDay() {
    const t = today();
    if (this.data.nutrition.today?.d !== t) {
      this.data.nutrition.today = { d: t, done: {} };
    }
  },

  /** Call after any change to the document. */
  commit() {
    this.data.updatedAt = new Date().toISOString();
    this.persist();
    for (const fn of this.listeners) fn(this.data);
  },

  persist() {
    writeJSON(DATA_KEY, this.data);
    writeJSON(UI_KEY, { tab: this.ui.tab, dayId: this.ui.dayId, editDayId: this.ui.editDayId, open: this.ui.open });
  },

  saveUI() {
    writeJSON(UI_KEY, { tab: this.ui.tab, dayId: this.ui.dayId, editDayId: this.ui.editDayId, open: this.ui.open });
  },

  /** Replace the whole document (import, cloud pull). */
  replace(raw) {
    this.data = migrate(raw);
    this.rolloverDay();
    this.commit();
  },

  reset() {
    this.data = defaultData();
    this.ui.open = {};
    this.ui.dayId = null;
    this.commit();
  },

  /** Subscribe to document changes (used by sync providers). Returns an unsubscribe fn. */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};
