// App shell: rendering, routing between tabs and sheets, and all user actions.
// Rendering is plain HTML strings with event delegation: tiny, fast, no dependencies.

import { store, mergeRecipes } from './store.js';
import { exportToFile, importFromFile } from './sync.js';
import { findDay, finishDay, lastEntry, logMetric, setsFor, suggestedDayId } from './domain.js';
import { EQUIPMENT } from './seed.js';
import { ICON } from './icons.js';
import { num, uid, today } from './util.js';
import { trainView, fmtClock, isExpanded } from './views/train.js';
import { nutritionView } from './views/nutrition.js';
import { progressView } from './views/progress.js';
import { settingsView, recipeEditorView } from './views/settings.js';
import { runView, runLiveView, runLogView, runPlanView, runLevelView, paintRun } from './views/run.js';
import { runner } from './runner.js';
import { nextSession, applyResult, longestRunSec, totalSec } from './runplan.js';

const root = document.getElementById('app');
const fileInput = document.getElementById('import-file');
let recipeDraft = null;
let runDraft = null;
let toastTimer = null;

store.init();
// Open on the day in progress, or the next one in the rotation.
store.ui.dayId = suggestedDayId(store.data);

// A guided run that was in progress when the app closed picks up where it was.
runner.onTick = paintRun;
runner.onDone = (result) => {
  const s = result.session;
  runDraft = {
    title: s.title, week: s.week, index: s.index, easeOff: !!s.easeOff,
    activeSec: result.activeSec, plannedSec: totalSec(s), completed: result.completed,
    longestSec: result.completed ? longestRunSec(s) : 0,
    breath: null, effort: null, pain: 0, where: null, km: '', note: '',
  };
  store.ui.view = 'run-log';
  render({ keepScroll: false });
};
if (runner.restore()) {
  store.ui.view = 'run-live';
  history.pushState({ guard: true }, '');
}

// ---------- render ----------

const TABS = [
  { id: 'train', label: 'Train' },
  { id: 'run', label: 'Run' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'progress', label: 'Progress' },
];

function render({ keepScroll = true } = {}) {
  const y = window.scrollY;
  const { data, ui } = store;
  let body;
  let chrome = true;

  if (ui.view === 'settings') {
    body = settingsView(data, ui);
    chrome = false;
  } else if (ui.view === 'run-live' && runner.live) {
    body = runLiveView();
    chrome = false;
  } else if (ui.view === 'run-log' && runDraft) {
    body = runLogView(runDraft, data.run.settings.distUnit);
    chrome = false;
  } else if (ui.view === 'run-plan') {
    body = runPlanView(data);
    chrome = false;
  } else if (ui.view === 'run-level') {
    body = runLevelView(data);
    chrome = false;
  } else if (ui.view === 'recipe' && recipeDraft) {
    body = recipeEditorView(recipeDraft);
    chrome = false;
  } else {
    const views = { train: trainView, run: runView, nutrition: nutritionView, progress: progressView };
    const view = views[ui.tab] || trainView;
    body = `
      <header class="topbar">
        <span class="brand">Ritual</span>
        <button class="round-btn" data-act="open-settings" aria-label="Settings">${ICON.gear}</button>
      </header>
      ${view(data, ui)}`;
  }

  const tabbar = chrome ? `
    <nav class="tabbar" aria-label="Sections">
      ${TABS.map((t) => `<button class="${ui.tab === t.id ? 'on' : ''}" data-act="tab" data-tab="${t.id}" aria-current="${ui.tab === t.id ? 'page' : 'false'}">${t.label}</button>`).join('')}
    </nav>` : '';

  root.innerHTML = `<div class="status-scrim" aria-hidden="true"></div><main class="app">${body}</main>${chrome ? '<div class="tab-fade" aria-hidden="true"></div>' : ''}${tabbar}`;
  window.scrollTo(0, keepScroll ? y : 0);

  if (ui.tab === 'train' && !ui.view) {
    // Bring the selected day pill into view horizontally only; never move the page.
    const row = root.querySelector('.pill-row');
    const active = row?.querySelector('.pill.on');
    if (row && active) {
      const left = active.offsetLeft - row.offsetLeft;
      if (left < row.scrollLeft || left + active.offsetWidth > row.scrollLeft + row.clientWidth) {
        row.scrollLeft = left - 20;
      }
    }
    paintTimer();
  }
  if (ui.view === 'run-live') paintRun();
  if (ui.view === 'run-plan' && !keepScroll) {
    root.querySelector('.plan-week.current')?.scrollIntoView({ block: 'center' });
  }
}

// ---------- rest timer ----------

function timerElapsed() {
  const t = store.ui.timer || { start: null, acc: 0 };
  return (t.acc || 0) + (t.start ? Date.now() - t.start : 0);
}

function paintTimer() {
  const el = document.getElementById('rest');
  if (!el) return;
  const ms = timerElapsed();
  const target = Number(el.dataset.target) * 1000;
  document.getElementById('rest-clock').textContent = fmtClock(ms);
  document.getElementById('rest-line').style.width = `${Math.min(100, (ms / target) * 100)}%`;
  el.classList.toggle('over', ms >= target);
}

setInterval(() => { if (store.ui.timer?.start) paintTimer(); }, 250);

function toast(message, action) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-act';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { el.remove(); action.fn(); });
    el.appendChild(btn);
  }
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), action ? 5000 : 2200);
}

/**
 * Run a change with a 5-second Undo. Snapshots the whole document (it's small),
 * so undo is exact no matter what the change touched.
 */
function withUndo(message, change) {
  const snap = JSON.parse(JSON.stringify(store.data));
  const uiSnap = { dayId: store.ui.dayId, open: { ...store.ui.open } };
  if (change() === false) return;
  toast(message, {
    label: 'Undo',
    fn: () => {
      store.data = snap;
      Object.assign(store.ui, uiSnap);
      store.commit();
      store.saveUI();
      render();
      toast('Undone');
    },
  });
}

// ---------- sheets (full-screen pages with ← Back) ----------
// Each sheet adds a history entry, so the phone's back gesture closes it too.

const SHEETS = new Set(['settings', 'recipe', 'run-plan', 'run-level']);

function openSheet(view) {
  store.ui.view = view;
  if (!history.state?.sheet) history.pushState({ sheet: view }, '');
  render({ keepScroll: false });
}

function closeSheet() {
  store.ui.view = null;
  store.ui.resetArmed = false;
  recipeDraft = null;
  render({ keepScroll: false });
}

function leaveSheet() {
  if (history.state?.sheet) history.back(); // popstate closes it
  else closeSheet();
}

window.addEventListener('popstate', () => {
  if (SHEETS.has(store.ui.view)) closeSheet();
  else if (store.ui.view === 'run-live' || store.ui.view === 'run-log') {
    // Never lose a run to a stray back swipe.
    history.pushState({ guard: true }, '');
  }
});

// ---------- helpers ----------

const data = () => store.data;
const dayById = (id) => data().program.find((d) => d.id === id);
const exById = (dayId, exId) => dayById(dayId)?.exercises.find((e) => e.id === exId);

function readRecipeForm(form) {
  const f = new FormData(form);
  const lines = (v) => String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
  Object.assign(recipeDraft, {
    title: String(f.get('title') || '').trim(),
    protein: String(f.get('protein') || '').trim(),
    minutes: String(f.get('minutes') || '').trim(),
    ingredients: lines(f.get('ingredients')),
    steps: lines(f.get('steps')),
    url: String(f.get('url') || '').trim(),
    notes: String(f.get('notes') || '').trim(),
  });
}

function addGroceries(names) {
  const list = data().nutrition.groceries;
  const have = new Set(list.map((g) => g.name.toLowerCase()));
  let added = 0;
  for (const name of names) {
    const clean = name.trim();
    if (!clean || have.has(clean.toLowerCase())) continue;
    list.push({ id: uid('g_'), name: clean, done: false });
    have.add(clean.toLowerCase());
    added++;
  }
  return added;
}

// ---------- click actions ----------

const actions = {
  tab(el) {
    if (store.ui.tab === el.dataset.tab && !store.ui.view) {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // tap the active tab: back to top
      return;
    }
    store.ui.tab = el.dataset.tab;
    store.ui.resetArmed = false;
    store.saveUI();
    render({ keepScroll: false });
  },

  'open-settings'() {
    store.ui.editDayId = store.ui.dayId;
    openSheet('settings');
  },

  'close-view'() {
    leaveSheet();
  },

  // ----- train -----
  'pick-day'(el) {
    store.ui.dayId = el.dataset.day;
    store.saveUI();
    render({ keepScroll: false });
  },

  // ----- run -----
  'run-start-week'(el) {
    const week = Number(el.dataset.week);
    const wasStarted = data().run.started;
    const apply = () => {
      Object.assign(data().run, { started: true, week, index: 0 });
      store.commit();
    };
    if (!wasStarted) { apply(); return render({ keepScroll: false }); }
    withUndo(`Starting from week ${week}`, apply);
    if (store.ui.view) leaveSheet(); else render({ keepScroll: false });
  },

  'run-plan'() { openSheet('run-plan'); },
  'run-level'() { openSheet('run-level'); },

  'run-go'() {
    const r = data().run;
    r.verdict = null;
    store.commit();
    runner.start(nextSession(r), { detail: r.settings.voice, beeps: r.settings.beeps });
    store.ui.view = 'run-live';
    history.pushState({ guard: true }, ''); // a back swipe can't drop you out of a run
    render({ keepScroll: false });
  },

  'run-pause'() { runner.togglePause(); },
  'run-skip'() { runner.skip(); },

  'run-end'(el) {
    if (el.dataset.armed !== '1') {
      el.dataset.armed = '1';
      el.textContent = 'Tap again';
      setTimeout(() => { if (el.isConnected) { el.dataset.armed = ''; el.textContent = 'End'; } }, 3000);
      return;
    }
    runner.finish();
  },

  'run-pocket'() {
    document.getElementById('pocket').hidden = false;
  },

  'rl-pick'(el) {
    const k = el.dataset.k;
    const v = k === 'effort' || k === 'pain' ? Number(el.dataset.v) : el.dataset.v;
    const form = root.querySelector('[data-form="run-log"]');
    runDraft.km = form.elements.km.value;
    runDraft.note = form.elements.note.value;
    runDraft[k] = runDraft[k] === v && k === 'where' ? null : v;
    render();
  },

  'rl-discard'(el) {
    if (el.dataset.armed !== '1') {
      el.dataset.armed = '1';
      el.textContent = 'Tap again to discard';
      return;
    }
    runDraft = null;
    store.ui.view = null;
    store.ui.tab = 'run';
    render({ keepScroll: false });
  },

  'run-ease-clear'() {
    data().run.easeOff = 0;
    store.commit();
    render();
  },

  'run-week'(el) {
    const r = data().run;
    const week = Math.min(24, Math.max(1, r.week + Number(el.dataset.delta)));
    if (week === r.week) return;
    withUndo(`Moved to week ${week}`, () => {
      r.week = week;
      r.index = 0;
      store.commit();
    });
    render();
  },

  'run-set'(el) {
    const r = data().run;
    r.settings[el.dataset.k] = el.dataset.k === 'beeps' ? el.dataset.v === '1' : el.dataset.v;
    store.commit();
    render();
  },

  'run-test-voice'() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance('Run. A minute and a half. Easy pace. You should be able to talk.'));
    }
  },

  'lift-view'(el) {
    store.ui.liftView = el.dataset.v;
    store.saveUI();
    render();
  },

  'toggle-ex'(el) {
    const ex = exById(store.ui.dayId, el.dataset.ex);
    if (!ex) return;
    const done = setsFor(data(), store.ui.dayId, ex).every((x) => x.c);
    store.ui.open[`ex:${ex.id}`] = isExpanded(store.ui, ex, done) ? 'closed' : 'open';
    store.saveUI();
    render();
  },

  'fold-all'(el) {
    for (const ex of findDay(data(), store.ui.dayId).exercises) store.ui.open[`ex:${ex.id}`] = el.dataset.mode;
    store.saveUI();
    render();
  },

  'timer-toggle'() {
    const t = (store.ui.timer ||= { start: null, acc: 0 });
    if (t.start) { t.acc += Date.now() - t.start; t.start = null; }
    else t.start = Date.now();
    store.saveUI();
    render();
  },

  'timer-reset'() {
    const t = (store.ui.timer ||= { start: null, acc: 0 });
    t.acc = 0;
    t.start = t.start ? Date.now() : null; // "Restart" keeps it running from zero
    store.saveUI();
    render();
  },

  'toggle-set'(el) {
    const dayId = store.ui.dayId;
    const ex = exById(dayId, el.dataset.ex);
    if (!ex) return;
    const sets = setsFor(data(), dayId, ex);
    const i = Number(el.dataset.i);
    const set = sets[i];
    set.c = !set.c;
    if (set.c) {
      // Blank inputs on check: copy from last time (same set number, else that day's top set), or from the set above.
      const last = lastEntry(data(), ex.name);
      const ref = last ? (last.sets[i] || last.sets.at(-1)) : null;
      const prev = i > 0 ? sets[i - 1] : null;
      if (set.w === '') set.w = ref?.w != null ? String(ref.w) : prev?.w || '';
      if (set.r === '') set.r = ref?.r != null ? String(ref.r) : prev?.r || '';
      const cur = data().current[dayId];
      cur.startedAt ||= new Date().toISOString();
    }
    // Finishing the last set folds the exercise away.
    if (sets.every((x) => x.c)) delete store.ui.open[`ex:${ex.id}`];
    store.commit();
    render();
  },

  video(el) {
    if (el.dataset.url) window.open(el.dataset.url, '_blank', 'noopener');
  },

  finish() {
    const day = findDay(data(), store.ui.dayId);
    if (!data().current[day.id] || !Object.values(data().current[day.id].sets).some((l) => l.some((x) => x.c))) {
      return toast('Check at least one set first');
    }
    withUndo(`${day.name} logged`, () => {
      finishDay(data(), day.id);
      for (const ex of day.exercises) delete store.ui.open[`ex:${ex.id}`]; // next session starts open
      store.ui.dayId = suggestedDayId(data());
      store.commit();
      store.saveUI();
    });
    render({ keepScroll: false });
  },

  // ----- nutrition -----
  'toggle-meal'(el) {
    store.rolloverDay();
    const done = data().nutrition.today.done;
    if (done[el.dataset.id]) delete done[el.dataset.id];
    else done[el.dataset.id] = true;
    store.commit();
    render();
  },

  'toggle-open'(el) {
    const k = el.dataset.key;
    store.ui.open[k] = !store.ui.open[k];
    store.saveUI();
    render();
  },

  'toggle-groc'(el) {
    const g = data().nutrition.groceries.find((x) => x.id === el.dataset.id);
    if (g) g.done = !g.done;
    store.commit();
    render();
  },

  'remove-groc'(el) {
    const n = data().nutrition;
    const g = n.groceries.find((x) => x.id === el.dataset.id);
    withUndo(`Removed ${g?.name.replace(/\s*\(.*\)$/, '') || 'item'}`, () => {
      n.groceries = n.groceries.filter((x) => x.id !== el.dataset.id);
      store.commit();
    });
    render();
  },

  'clear-groc'() {
    data().nutrition.groceries.forEach((g) => { g.done = false; });
    store.commit();
    render();
  },

  'new-recipe'(el) {
    recipeDraft = { isNew: true, id: uid('r_'), cat: el.dataset.cat, title: '', protein: '', minutes: '', ingredients: [], steps: [], url: '', notes: '' };
    openSheet('recipe');
  },

  'edit-recipe'(el) {
    const r = data().nutrition.recipes.find((x) => x.id === el.dataset.id);
    if (!r) return;
    recipeDraft = { ...JSON.parse(JSON.stringify(r)), isNew: false };
    openSheet('recipe');
  },

  'recipe-cat'(el) {
    readRecipeForm(root.querySelector('[data-form="recipe"]'));
    recipeDraft.cat = el.dataset.cat;
    render();
  },

  'delete-recipe'() {
    if (!recipeDraft.deleteArmed) {
      readRecipeForm(root.querySelector('[data-form="recipe"]'));
      recipeDraft.deleteArmed = true;
      return render();
    }
    const n = data().nutrition;
    const id = recipeDraft.id;
    leaveSheet();
    withUndo('Recipe deleted', () => {
      n.recipes = n.recipes.filter((r) => r.id !== id);
      store.commit();
    });
    render();
  },

  'recipe-to-groc'(el) {
    const r = data().nutrition.recipes.find((x) => x.id === el.dataset.id);
    if (!r) return;
    const added = addGroceries(r.ingredients);
    store.commit();
    render();
    toast(added ? `Added ${added} to groceries` : 'Already on your list');
  },

  // ----- progress -----
  'undo-metric'(el) {
    const list = data().body[el.dataset.metric];
    withUndo('Entry removed', () => {
      list.pop();
      store.commit();
    });
    render();
  },

  // ----- settings -----
  'edit-day'(el) {
    store.ui.editDayId = el.dataset.day;
    store.saveUI();
    render();
  },

  'cycle-eq'(el) {
    const ex = exById(el.dataset.day, el.dataset.ex);
    ex.eq = EQUIPMENT[(EQUIPMENT.indexOf(ex.eq) + 1) % EQUIPMENT.length];
    store.commit();
    render();
  },

  'remove-ex'(el) {
    const day = dayById(el.dataset.day);
    const ex = day.exercises.find((e) => e.id === el.dataset.ex);
    withUndo(`Removed ${ex?.name || 'exercise'}`, () => {
      day.exercises = day.exercises.filter((e) => e.id !== el.dataset.ex);
      store.commit();
    });
    render();
  },

  'add-ex'(el) {
    const day = dayById(el.dataset.day);
    day.exercises.push({ id: uid('e_'), name: '', sets: 3, reps: '8-12', effort: '1-2', eq: 'db', url: '' });
    store.commit();
    render();
    const inputs = root.querySelectorAll('[data-in="ex"][data-field="name"]');
    inputs[inputs.length - 1]?.focus();
  },

  'import-recipes'() {
    const box = document.getElementById('recipe-json');
    let pack;
    try {
      pack = JSON.parse(box.value.trim().replace(/^```(?:json)?|```$/g, ''));
    } catch {
      return toast('That isn’t valid JSON');
    }
    if (Array.isArray(pack)) pack = { recipes: pack };
    const added = mergeRecipes(data(), pack);
    store.commit();
    box.value = '';
    toast(`Added ${added.recipes} recipes · ${added.groceries} staples`);
  },

  'groc-store'(el) {
    store.ui.grocStore = el.dataset.store;
    render();
  },

  export() {
    exportToFile();
    toast('Exported');
  },

  import() {
    fileInput.value = '';
    fileInput.click();
  },

  reset() {
    if (!store.ui.resetArmed) {
      store.ui.resetArmed = true;
      render();
      setTimeout(() => { if (store.ui.resetArmed) { store.ui.resetArmed = false; render(); } }, 4000);
      return;
    }
    store.ui.resetArmed = false;
    store.reset();
    store.ui.dayId = suggestedDayId(data());
    store.ui.editDayId = store.ui.dayId;
    render();
    toast('All data erased');
  },
};

let lastPocketTap = 0;
root.addEventListener('click', (e) => {
  const pocket = e.target.closest('#pocket');
  if (pocket) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastPocketTap < 400) pocket.hidden = true;
    lastPocketTap = now;
    return;
  }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) {
    e.preventDefault();
    fn(el);
  }
});

// ---------- inputs (saved as you type, no re-render so focus stays put) ----------

root.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset.in;
  if (!kind) return;
  const d = data();

  if (kind === 'set') {
    const ex = exById(store.ui.dayId, el.dataset.ex);
    if (!ex) return;
    const sets = setsFor(d, store.ui.dayId, ex);
    const set = sets[Number(el.dataset.i)];
    set[el.dataset.field] = el.value.trim();
    if (el.dataset.field === 'w') {
      // A typed weight flows down to the untouched sets below it, live, without stealing focus.
      set.t = true;
      set.a = false;
      setsFor(d, store.ui.dayId, ex);
      root.querySelectorAll(`[data-in="set"][data-field="w"][data-ex="${ex.id}"]`).forEach((input) => {
        if (input !== el) input.value = sets[Number(input.dataset.i)].w;
      });
    }
  } else if (kind === 'ex') {
    const ex = exById(el.dataset.day, el.dataset.ex);
    if (!ex) return;
    const f = el.dataset.field;
    ex[f] = f === 'sets' ? Math.max(1, Math.min(10, parseInt(el.value, 10) || 1)) : el.value;
  } else if (kind === 'day') {
    const day = dayById(el.dataset.day);
    day[el.dataset.field] = el.value;
  } else if (kind === 'setting') {
    d.settings[el.dataset.field] = num(el.value) ?? '';
  }
  store.commit();
});

// Selects and day-name edits update labels elsewhere on the page, so refresh on change.
root.addEventListener('change', (e) => {
  const el = e.target;
  if (el.tagName === 'SELECT' || (el.dataset.in === 'day' && el.dataset.field === 'name')) render();
});

// ---------- forms ----------

const forms = {
  'run-log'(form) {
    if (!runDraft.breath || runDraft.effort === null) return toast('Pick breathing and effort');
    const entry = {
      id: uid('run_'), date: today(),
      ...runDraft,
      km: num(form.elements.km.value),
      note: form.elements.note.value.trim(),
    };
    const r = data().run;
    r.log.push(entry);
    r.verdict = { ...applyResult(r, entry), date: today() };
    runDraft = null;
    store.ui.view = null;
    store.ui.tab = 'run';
    store.commit();
    store.saveUI();
    render({ keepScroll: false });
  },

  'add-groc'(form) {
    const input = form.elements.item;
    const added = addGroceries([input.value]);
    store.commit();
    render();
    if (added) root.querySelector('[data-form="add-groc"] input')?.focus();
  },

  'log-metric'(form) {
    const v = num(form.elements.v.value);
    if (v === null) return toast('Enter a number first');
    const metric = form.dataset.metric;
    logMetric(data().body[metric], v);
    store.commit();
    render();
    toast(`${metric === 'weight' ? 'Bodyweight' : 'Waist'} logged`);
  },

  recipe(form) {
    readRecipeForm(form);
    if (!recipeDraft.title) return toast('Give it a name');
    const { isNew, deleteArmed, ...recipe } = recipeDraft;
    const list = data().nutrition.recipes;
    const i = list.findIndex((r) => r.id === recipe.id);
    if (i >= 0) list[i] = recipe; else list.push(recipe);
    store.ui.open[`sec:${recipe.cat}`] = true;
    store.ui.tab = 'nutrition';
    store.commit();
    store.saveUI();
    leaveSheet();
    toast('Saved');
  },
};

root.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  forms[form.dataset.form]?.(form);
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    await importFromFile(file);
    store.ui.dayId = suggestedDayId(data());
    store.ui.editDayId = store.ui.dayId;
    render();
    toast('Imported');
  } catch (err) {
    toast(err.message || 'Import failed');
  }
});

// New day while the app sat in the background: reset the meal checklist.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const before = data().nutrition.today.d;
  store.rolloverDay();
  if (data().nutrition.today.d !== before) {
    store.commit();
    render();
  }
});

render({ keepScroll: false });

// ---------- offline ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Exposed for debugging from the console only.
window.ritual = { store, runner };
