// Today: the one place that answers "what do I do right now?"

import { esc, today, weekStart } from '../util.js';
import { dayHasActivity, dayProgress, estimateMinutes, findDay, suggestedDayId } from '../domain.js';
import { restOf } from '../muscles.js';
import { nextSession, totalSec } from '../runplan.js';

const DAY_MS = 86400000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / DAY_MS);
}

function weekStrip(data) {
  const start = new Date(weekStart() + 'T00:00:00');
  const t = today();
  return WEEKDAYS.map((label, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = today(d);
    const lift = data.sessions.some((s) => s.date === iso);
    const run = data.run?.log?.some((r) => r.date === iso);
    return `<div class="wk-day ${iso === t ? 'now' : ''} ${iso > t ? 'future' : ''}">
      <span class="label">${label}</span>
      <i class="dot ${lift ? 'lift' : ''}"></i><i class="dot ${run ? 'run' : ''}"></i>
    </div>`;
  }).join('');
}

export function todayView(data, ui) {
  const t = today();
  const now = new Date();
  const dateLine = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const ws = weekStart();
  const liftsThisWeek = data.sessions.filter((s) => s.date >= ws).length;
  const planned = data.program.filter((d) => !d.optional).length;
  const runsThisWeek = (data.run?.log || []).filter((r) => r.date >= ws && (r.completed || r.activeSec > 60)).length;

  // ----- training card -----
  const active = data.program.find((d) => dayHasActivity(data, d.id));
  const doneToday = [...data.sessions].reverse().find((s) => s.date === t);
  let train;
  if (active) {
    const p = dayProgress(data, active);
    train = `
      <section class="card ink today-main">
        <div class="label run-kicker">In progress</div>
        <h1 class="run-title">Day ${active.num} · ${esc(active.name)}</h1>
        <div class="run-meta label">${p.done} / ${p.total} sets · ${p.pct}%</div>
        <div class="bar dark"><i style="width:${p.pct}%"></i></div>
        <button class="btn orange block run-go" data-act="go-train" data-day="${active.id}">Continue</button>
      </section>`;
  } else if (doneToday) {
    const next = findDay(data, suggestedDayId(data));
    const sets = doneToday.exercises.reduce((n, e) => n + e.sets.length, 0);
    train = `
      <section class="card today-done">
        <div class="label">Trained today ✓</div>
        <h2>${esc(doneToday.dayName)} · ${sets} sets</h2>
        <p class="fine">Next time: Day ${next.num} · ${esc(next.name)}. Recovery is part of the plan.</p>
      </section>`;
  } else {
    const day = findDay(data, suggestedDayId(data));
    const mins = estimateMinutes(day, restOf);
    const sets = day.exercises.reduce((n, e) => n + (Number(e.sets) || 0), 0);
    train = `
      <section class="card ink today-main">
        <div class="label run-kicker">Up next</div>
        <h1 class="run-title">Day ${day.num} · ${esc(day.name)}</h1>
        <div class="run-meta label">${esc(day.focus)} · ${day.exercises.length} exercises · ${sets} sets · ~${mins} min</div>
        <button class="btn orange block run-go" data-act="go-train" data-day="${day.id}">Start training</button>
      </section>`;
  }

  // ----- never miss twice -----
  const lastLift = data.sessions.at(-1);
  const gap = lastLift ? daysBetween(lastLift.date, t) : null;
  const comeback = !active && !doneToday && gap != null && gap >= 3 ? `
    <section class="card ease">
      <div class="label">It’s been ${gap} days</div>
      <p>Never miss twice. Short on time? Do just the first 3 exercises today. A short session still counts.</p>
    </section>` : '';

  // ----- run card -----
  const run = data.run;
  let runCard = '';
  if (!run?.started) {
    runCard = `
      <section class="card today-row">
        <div><div class="label">Run</div><b>Build up to 30 min non-stop</b></div>
        <button class="btn" data-act="tab" data-tab="run">Set up</button>
      </section>`;
  } else if (run.log.some((r) => r.date === t)) {
    runCard = `<section class="card today-row"><div><div class="label">Run</div><b>Done today ✓</b></div></section>`;
  } else {
    const s = nextSession(run);
    const legsToday = doneToday && /leg/i.test(doneToday.dayName);
    runCard = `
      <section class="card today-row">
        <div><div class="label">Run · ${s.easeOff ? 'Ease-off' : `Week ${s.week} · Run ${s.index + 1}`}</div>
          <b>${esc(s.title)} · ${Math.round(totalSec(s) / 60)} min</b>
          ${legsToday ? '<p class="fine">Legs today, so save the run for tomorrow.</p>' : ''}</div>
        <button class="btn" data-act="tab" data-tab="run">Go</button>
      </section>`;
  }

  // ----- quick weigh-in -----
  const w = data.body.weight;
  const loggedToday = w.at(-1)?.d === t;
  const weigh = loggedToday ? '' : `
    <form class="card today-row" data-form="log-metric" data-metric="weight">
      <div style="flex:1"><div class="label">Morning weigh-in · ${esc(data.settings.unit)}</div>
        <input class="field" name="v" inputmode="decimal" placeholder="${w.length ? w.at(-1).v : 'e.g. 182.4'}" aria-label="Bodyweight"></div>
      <button class="btn" type="submit">Log</button>
    </form>`;

  // ----- backup nudge -----
  const last = data.meta?.lastBackupAt;
  const age = last ? daysBetween(last.slice(0, 10), t) : null;
  const hasData = data.sessions.length || data.run?.log?.length;
  const backup = hasData && (age == null || age >= 14) ? `
    <section class="card ease">
      <div class="label">${age == null ? 'No backup yet' : `Last backup ${age} days ago`}</div>
      <p>Your history only lives on this phone. Save a copy so it can’t be lost.</p>
      <div class="recipe-actions">
        ${data.settings.drive?.clientId ? '<button class="btn" data-act="drive-sync">Sync to Drive</button>' : ''}
        <button class="btn ${data.settings.drive?.clientId ? 'ghost' : ''}" data-act="export">Export backup</button>
      </div>
    </section>` : '';

  return `
    <div class="stack">
      <div class="today-date label">${esc(dateLine)}</div>
      ${train}
      ${comeback}
      ${runCard}
      <section class="card">
        <div class="today-week-h"><span class="label">This week</span>
          <span class="label">Lifts <b>${liftsThisWeek}/${planned}</b> · Runs <b>${runsThisWeek}/3</b></span></div>
        <div class="wk-strip">${weekStrip(data)}</div>
      </section>
      ${weigh}
      ${backup}
    </div>`;
}
