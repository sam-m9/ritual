// Training and progress logic. Pure functions over the data document, with no DOM access.

import { liftKey, num, today, uid, weekStart } from './util.js';

export function findDay(data, dayId) {
  return data.program.find((d) => d.id === dayId) || data.program[0];
}

/** The in-progress set list for one exercise, sized to the current set count. */
export function setsFor(data, dayId, ex) {
  const day = (data.current[dayId] ||= { startedAt: null, sets: {} });
  const list = (day.sets[ex.id] ||= []);
  const n = Math.max(1, Number(ex.sets) || 1);
  while (list.length < n) list.push({ w: '', r: '', c: false });
  if (list.length > n) list.length = n;
  return list;
}

export function dayProgress(data, day) {
  let total = 0;
  let done = 0;
  for (const ex of day.exercises) {
    const sets = setsFor(data, day.id, ex);
    total += sets.length;
    done += sets.filter((s) => s.c).length;
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function dayHasActivity(data, dayId) {
  const cur = data.current[dayId];
  if (!cur) return false;
  return Object.values(cur.sets).some((list) => list.some((s) => s.c || s.w !== '' || s.r !== ''));
}

/** Most recent finished-session entry for a lift, matched by name so it carries across days. */
export function lastEntry(data, exName) {
  const key = liftKey(exName);
  for (let i = data.sessions.length - 1; i >= 0; i--) {
    const hit = data.sessions[i].exercises.find((e) => liftKey(e.name) === key && e.sets.length);
    if (hit) return { date: data.sessions[i].date, sets: hit.sets };
  }
  return null;
}

/** Heaviest set (ties broken by reps). */
export function topSet(sets) {
  let best = null;
  for (const s of sets) {
    const w = s.w ?? 0;
    const r = s.r ?? 0;
    if (!best || w > (best.w ?? 0) || (w === (best.w ?? 0) && r > (best.r ?? 0))) best = s;
  }
  return best;
}

/** Day to open on launch: one in progress, otherwise the next non-optional day after the last finished one. */
export function suggestedDayId(data) {
  const active = data.program.find((d) => dayHasActivity(data, d.id));
  if (active) return active.id;
  const core = data.program.filter((d) => !d.optional);
  const pool = core.length ? core : data.program;
  const last = data.sessions[data.sessions.length - 1];
  if (!last) return pool[0].id;
  const order = data.program.map((d) => d.id);
  const lastIdx = order.indexOf(last.dayId);
  for (let step = 1; step <= order.length; step++) {
    const candidate = data.program[(lastIdx + step) % order.length];
    if (pool.includes(candidate)) return candidate.id;
  }
  return pool[0].id;
}

/** Turn the in-progress day into a session record. Returns the session, or null if nothing was checked. */
export function finishDay(data, dayId) {
  const day = findDay(data, dayId);
  const cur = data.current[dayId];
  if (!cur) return null;
  const exercises = [];
  for (const ex of day.exercises) {
    const sets = (cur.sets[ex.id] || [])
      .filter((s) => s.c)
      .map((s) => ({ w: num(s.w), r: num(s.r) }));
    if (sets.length) exercises.push({ exId: ex.id, name: ex.name, sets });
  }
  if (!exercises.length) return null;
  const session = {
    id: uid('s_'),
    dayId: day.id,
    dayName: day.name,
    date: today(),
    startedAt: cur.startedAt || null,
    finishedAt: new Date().toISOString(),
    exercises,
  };
  data.sessions.push(session);
  delete data.current[dayId];
  return session;
}

/** Per-lift history: one point per session, the top set. Most recently trained lifts first. */
export function liftHistory(data) {
  const map = new Map();
  for (const s of data.sessions) {
    for (const e of s.exercises) {
      const top = topSet(e.sets);
      if (!top || top.w === null) continue;
      const key = liftKey(e.name);
      if (!map.has(key)) map.set(key, { name: e.name, points: [] });
      map.get(key).points.push({ d: s.date, w: top.w, r: top.r, at: s.finishedAt });
    }
  }
  return [...map.values()].sort((a, b) =>
    String(b.points.at(-1).at).localeCompare(String(a.points.at(-1).at)));
}

export function weekStats(data) {
  const start = weekStart();
  const thisWeek = data.sessions.filter((s) => s.date >= start).length;
  const planned = data.program.filter((d) => !d.optional).length;
  return { thisWeek, planned, total: data.sessions.length };
}

/** Log a body metric for today, replacing any value already logged today. */
export function logMetric(list, value) {
  const d = today();
  const existing = list.find((e) => e.d === d);
  if (existing) existing.v = value;
  else list.push({ d, v: value });
  list.sort((a, b) => a.d.localeCompare(b.d));
}

/** Scale values to bar heights (min-max), returns percentages 15–100. */
export function barHeights(values) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((v) => (max === min ? 60 : 15 + ((v - min) / (max - min)) * 85));
}
