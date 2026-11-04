// The single source of truth. One JSON document, versioned, saved to localStorage.
//
// The same document is what gets exported to a file and, later, synced to Google Drive.
// UI-only state (selected tab, open sections) lives under a separate key and is never exported.
//
// Document shape (schema 2):
// {
//   app: 'ritual', schema: 1, updatedAt: ISO string,
//   settings:  { unit: 'lb', waistUnit: 'in', proteinMin, proteinMax, restSeconds },
//   program:   [{ id, num, name, focus, note, optional, noRir, exercises: [{ id, name, sets, reps, effort, eq, url }] }],
//   current:   { [dayId]: { startedAt, sets: { [exerciseId]: [{ w, r, c }] } } },   // in-progress workout
//   sessions:  [{ id, dayId, dayName, date, startedAt, finishedAt,
//                 exercises: [{ exId, name, sets: [{ w, r }] }] }],                 // every finished workout, every set
//   body:      { weight: [{ d, v }], waist: [{ d, v }] },
//   run:       { started, week, index, easeOff, verdict, settings: { voice, beeps, distUnit },
//                log: [{ id, date, week, index, title, activeSec, plannedSec, longestSec, completed,
//                        breath, effort, pain, where, km, note, easeOff }] },
//   nutrition: { meals: [{ id, name, portions }], portions: [{ label, value }],
//                today: { d, done: { [mealId]: true } }, packs: [packId],
//                recipes: [{ id, cat (meal|snack|dessert|prep), title, protein, minutes, ingredients: [], steps: [], url, notes }],
//                groceries: [{ id, name, done }] }
// }

import { SEED_PROGRAM, SEED_MEALS, SEED_PORTIONS } from './seed.js';
import { clone, today, uid } from './util.js';
import AUSTIN_PACK from './packs/austin-2026-11.js';
import AUSTIN_PACK_2 from './packs/austin-2026-11b.js';
import AUSTIN_PACK_3 from './packs/austin-2026-11c.js';

/** Content packs shipped with the app, merged once into existing data. */
const PACKS = [AUSTIN_PACK, AUSTIN_PACK_2, AUSTIN_PACK_3];

export const SCHEMA = 2;
const DATA_KEY = 'ritual-v1';
const UI_KEY = 'ritual-ui';

export function defaultData() {
  return {
    app: 'ritual',
    schema: SCHEMA,
    updatedAt: new Date().toISOString(),
    settings: { unit: 'lb', waistUnit: 'in', proteinMin: 170, proteinMax: 190, restSeconds: 60 },
    program: clone(SEED_PROGRAM),
    current: {},
    sessions: [],
    body: { weight: [], waist: [] },
    run: {
      started: false, week: 2, index: 0, easeOff: 0, verdict: null,
      settings: { voice: 'full', beeps: true, distUnit: 'km' },
      log: [],
    },
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
    run: { ...base.run, ...(raw.run || {}), settings: { ...base.run.settings, ...(raw.run?.settings || {}) } },
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

  applyPacks(data);

  data.app = 'ritual';
  data.schema = SCHEMA;
  return data;
}

/**
 * Merge recipes and grocery staples into the document, skipping anything already there
 * (matched by title / name, case-insensitive). Accepts the shape the meal-planning prompt
 * produces: { recipes: [...], groceries: [{ name } | "name"] }. Returns counts added.
 */
export function mergeRecipes(data, pack) {
  const n = data.nutrition;
  const cats = new Set(['meal', 'snack', 'dessert', 'prep']);
  const titles = new Set(n.recipes.map((r) => String(r.title).trim().toLowerCase()));
  const names = new Set(n.groceries.map((g) => String(g.name).trim().toLowerCase()));
  const list = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
  let recipes = 0;
  let groceries = 0;
  for (const r of pack.recipes || []) {
    const title = String(r?.title || '').trim();
    if (!title || titles.has(title.toLowerCase())) continue;
    n.recipes.push({
      id: uid('r_'),
      cat: cats.has(r.cat) ? r.cat : 'meal',
      title,
      protein: r.protein ?? '',
      minutes: r.minutes ?? '',
      ingredients: list(r.ingredients),
      steps: list(r.steps),
      url: String(r.url || ''),
      notes: String(r.notes || ''),
    });
    titles.add(title.toLowerCase());
    recipes++;
  }
  for (const g of pack.groceries || []) {
    const name = String(typeof g === 'string' ? g : g?.name || '').trim();
    if (!name || names.has(name.toLowerCase())) continue;
    n.groceries.push({ id: uid('g_'), name, done: false });
    names.add(name.toLowerCase());
    groceries++;
  }
  return { recipes, groceries };
}

function applyPacks(data) {
  const applied = (data.nutrition.packs ||= []);
  for (const pack of PACKS) {
    if (applied.includes(pack.id)) continue;
    mergeRecipes(data, pack);
    applied.push(pack.id);
  }
  for (const rev of REVISIONS) {
    if (applied.includes(rev.id)) continue;
    rev.apply(data);
    applied.push(rev.id);
  }
}

/**
 * One-time fixes to pack content that's already on a device. Packs above are the
 * corrected source; a revision brings older copies in line with them.
 */
const REVISIONS = [
  {
    // Nov 4: no fish or seafood except shrimp; avoid recipes built on sugary or
    // seed-oil-heavy products (adobo, TJ za'atar blend, pre-marinated meats, store pickles).
    id: 'clean-2026-11-04',
    apply(data) {
      const n = data.nutrition;
      const drop = new Set(['salmon crunch salad', 'crispy rice salmon bowl']);
      n.recipes = n.recipes.filter((r) => !drop.has(String(r.title).trim().toLowerCase()));
      const fresh = new Map(PACKS.flatMap((p) => p.recipes).map((r) => [r.title.trim().toLowerCase(), r]));
      for (const r of n.recipes) {
        const src = fresh.get(String(r.title).trim().toLowerCase());
        if (!src) continue;
        Object.assign(r, {
          protein: src.protein ?? '', minutes: src.minutes ?? '',
          ingredients: [...src.ingredients], steps: [...src.steps], notes: src.notes || '',
        });
      }
      const gone = new Set([
        "middle eastern za'atar blend (trader joe's / whole foods)",
        'san marcos chipotle peppers in adobo (h-e-b)',
        'fish sauce, no sugar (h-e-b)',
        "wild alaskan pink salmon, skinless boneless, 2 cans (trader joe's)",
      ]);
      n.groceries = n.groceries.filter((g) => !gone.has(String(g.name).trim().toLowerCase()));
      mergeRecipes(data, { groceries: ["Za'atar spices: dried thyme, sumac, sesame (Pantry)", 'Chipotle powder (H-E-B)'] });
    },
  },
];

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
      this.data = migrate(saved || defaultData());
    } catch {
      this.data = migrate(defaultData());
    }
    this.ui = {
      tab: 'train',
      view: null,        // null | 'settings' | 'recipe'
      dayId: null,
      editDayId: null,
      open: {},          // collapsible sections, expanded recipes, re-opened finished exercises
      timer: { start: null, acc: 0 }, // rest stopwatch: running since `start` (ms), plus banked `acc` ms
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
    writeJSON(UI_KEY, this.uiSnapshot());
  },

  uiSnapshot() {
    const { tab, dayId, editDayId, open, timer } = this.ui;
    return { tab, dayId, editDayId, open, timer };
  },

  saveUI() {
    writeJSON(UI_KEY, this.uiSnapshot());
  },

  /** Replace the whole document (import, cloud pull). */
  replace(raw) {
    this.data = migrate(raw);
    this.rolloverDay();
    this.commit();
  },

  reset() {
    this.data = migrate(defaultData());
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
