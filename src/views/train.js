import { esc, fmt, repLow } from '../util.js';
import { EQ_ICONS, EQ_LABELS, ICON } from '../icons.js';
import { dayProgress, findDay, lastEntry, setsFor, topSet, dayHasActivity } from '../domain.js';
import { nextSession, totalSec } from '../runplan.js';
import { today } from '../util.js';

export function effortTag(ex, day) {
  if (day.noRir) return '<span class="tag solid">NO RIR · CHASE THE BURN</span>';
  if (ex.effort === 'FAIL') return '<span class="tag solid">TO FAILURE · LAST SET</span>';
  if (ex.effort) return `<span class="tag">${esc(ex.effort)} RIR</span>`;
  return '';
}

/** Saved link, or a YouTube form search so the button is always useful mid-workout. */
function videoUrl(ex) {
  return ex.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} form`)}`;
}

function lastLine(data, ex) {
  const last = lastEntry(data, ex.name);
  if (!last) return 'no history yet';
  const top = topSet(last.sets);
  const unit = data.settings.unit;
  if (top.w === null) return `${fmt(top.r)} reps`;
  return `${fmt(top.w)} ${unit} × ${fmt(top.r)}`;
}

/** Open unless done; a tap on the header overrides either way ('open' | 'closed'). */
export function isExpanded(ui, ex, done) {
  const o = ui.open[`ex:${ex.id}`];
  return o === 'open' ? true : o === 'closed' ? false : !done;
}

function exerciseCard(data, ui, day, ex) {
  const sets = setsFor(data, day.id, ex);
  const done = sets.every((s) => s.c);
  const checked = sets.filter((s) => s.c).length;
  const expanded = isExpanded(ui, ex, done);
  const fail = ex.effort === 'FAIL' && !day.noRir;
  const unit = data.settings.unit;
  const summary = doneSummary(sets, unit);

  let sub;
  if (done) {
    sub = `<div class="ex-sum label">${sets.length}/${sets.length} sets done${summary ? ` · <b>${esc(summary)}</b>` : ''}</div>`;
  } else if (expanded) {
    sub = `<div class="ex-rx"><span class="rx">${esc(ex.sets)} × ${esc(ex.reps)}</span>${effortTag(ex, day)}</div>`;
  } else {
    sub = `<div class="ex-sum label"><b>${esc(ex.sets)} × ${esc(ex.reps)}</b>${checked ? ` · ${checked}/${sets.length} done` : ''}</div>`;
  }

  const head = `
    <div class="ex-head" data-act="toggle-ex" data-ex="${ex.id}" role="button" aria-expanded="${expanded}">
      <div class="eq-tile" title="${EQ_LABELS[ex.eq] || ''}">${EQ_ICONS[ex.eq] || ''}</div>
      <div class="ex-title"><h3 class="ex-name">${esc(ex.name)}</h3>${sub}</div>
      ${expanded && !done ? `<button class="play" data-act="video" data-url="${esc(videoUrl(ex))}" aria-label="${ex.url ? 'Watch form video' : 'Search form videos'}">${ICON.play}</button>` : ''}
      <span class="chev ${expanded ? 'up' : ''}" aria-hidden="true">${ICON.chevron}</span>
    </div>`;

  if (!expanded) {
    return `<article class="ex-card collapsed ${done ? 'done' : ''}">${head}</article>`;
  }

  const rows = sets.map((s, i) => `
    <div class="set-row">
      <div class="set-n">${i + 1}${fail && i === sets.length - 1 ? '<small>FAIL</small>' : ''}</div>
      <input class="num" inputmode="decimal" enterkeyhint="next" placeholder="${esc(unit)}"
        aria-label="Set ${i + 1} weight" value="${esc(s.w)}" data-in="set" data-field="w" data-ex="${ex.id}" data-i="${i}">
      <span class="x">×</span>
      <input class="num" inputmode="numeric" enterkeyhint="done" placeholder="${esc(String(ex.reps).replace(/\s.*$/, '') || repLow(ex.reps))}"
        aria-label="Set ${i + 1} reps" value="${esc(s.r)}" data-in="set" data-field="r" data-ex="${ex.id}" data-i="${i}">
      <button class="check ${s.c ? 'on' : ''}" data-act="toggle-set" data-ex="${ex.id}" data-i="${i}"
        aria-label="Set ${i + 1} done" aria-pressed="${s.c}">${ICON.check}</button>
    </div>`).join('');

  return `
  <article class="ex-card ${done ? 'done' : ''}">
    ${head}
    <div class="last label">Last time · <b>${esc(lastLine(data, ex))}</b></div>
    ${rows}
  </article>`;
}

/** "55 lb × 9" for a finished exercise: its heaviest set. */
function doneSummary(sets, unit) {
  const top = topSet(sets.map((s) => ({ w: s.w === '' ? null : Number(s.w), r: s.r === '' ? null : Number(s.r) })));
  if (!top) return '';
  if (top.w === null) return top.r === null ? '' : `${fmt(top.r)} reps`;
  return `${fmt(top.w)} ${unit}${top.r === null ? '' : ` × ${fmt(top.r)}`}`;
}

/** Compact rest stopwatch. Ticks are painted by main.js without re-rendering the page. */
export function restTimer(ui, target) {
  const running = !!ui.timer?.start;
  const hasTime = running || (ui.timer?.acc || 0) > 0;
  return `
    <section class="rest ${running ? 'running' : ''}" id="rest" data-target="${target}">
      <div class="rest-main">
        <span class="rest-label label">Rest</span>
        <span class="rest-clock" id="rest-clock">0:00</span>
        <span class="rest-goal label">/ ${fmtClock(target * 1000)}</span>
      </div>
      <div class="rest-actions">
        ${hasTime ? `<button class="rest-btn ghost" data-act="timer-reset">${running ? 'Restart' : 'Reset'}</button>` : ''}
        <button class="rest-btn" data-act="timer-toggle">${running ? 'Stop' : 'Start'}</button>
      </div>
      <div class="rest-line"><i id="rest-line"></i></div>
    </section>`;
}

export function fmtClock(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** After an upper-body day is logged, nudge toward today's run. */
function runNextCard(data) {
  const run = data.run;
  const last = data.sessions.at(-1);
  if (!run?.started || !last || last.date !== today()) return '';
  if (/leg/i.test(last.dayName)) return '';
  if (run.log.some((r) => r.date === today())) return '';
  if (data.program.some((d) => dayHasActivity(data, d.id))) return '';
  const s = nextSession(run);
  return `
    <section class="card ink run-next">
      <div><div class="label">Run next · ${s.easeOff ? 'Ease-off' : `Week ${s.week} · Run ${s.index + 1}`}</div><p>${esc(s.title)} · ${Math.round(totalSec(s) / 60)} min</p></div>
      <button class="btn orange" data-act="tab" data-tab="run">Go</button>
    </section>`;
}

export function trainView(data, ui) {
  const day = findDay(data, ui.dayId);
  const prog = dayProgress(data, day);
  const setCount = day.exercises.reduce((n, e) => n + (Number(e.sets) || 0), 0);

  const pills = data.program.map((d) => `
    <button class="pill ${d.id === day.id ? 'on' : ''}" data-act="pick-day" data-day="${d.id}">Day ${d.num} · ${esc(d.name)}</button>`).join('');

  const allDone = prog.total > 0 && prog.done === prog.total;
  const banner = allDone ? `
    <section class="card ink day-done">
      <div><h3>Day done</h3><p>All ${prog.total} sets logged</p></div>
      <button class="btn orange" data-act="finish">Finish &amp; log</button>
    </section>` : '';

  const early = !allDone && prog.done > 0 ? `
    <div class="finish-early"><button data-act="finish">Finish early &amp; log ${prog.done} set${prog.done === 1 ? '' : 's'}</button></div>` : '';

  return `
    ${restTimer(ui, data.settings.restSeconds || 60)}
    <nav class="pill-row" aria-label="Training days">${pills}</nav>
    <header class="day-head">
      <span class="day-badge">Day ${day.num}</span>
      <h1 class="day-title">${esc(day.name)}</h1>
    </header>
    <p class="meta label">${esc(day.focus)} · ${day.exercises.length} exercises · ${setCount} sets</p>
    ${day.note ? `<p class="day-note">${esc(day.note)}</p>` : ''}
    <div class="stack train-stack">
      <section class="card white progress" id="progress">
        <div class="progress-top"><span>${prog.done} / ${prog.total} sets</span><span>${prog.pct}%</span></div>
        <div class="bar"><i style="width:${prog.pct}%"></i></div>
      </section>
      ${banner}
      ${runNextCard(data)}
      ${day.exercises.length ? `<div class="list-tools"><button data-act="fold-all" data-mode="${day.exercises.some((ex) => isExpanded(ui, ex, setsFor(data, day.id, ex).every((x) => x.c))) ? 'closed' : 'open'}">${day.exercises.some((ex) => isExpanded(ui, ex, setsFor(data, day.id, ex).every((x) => x.c))) ? 'Collapse all' : 'Expand all'}</button></div>` : ''}
      ${day.exercises.map((ex) => exerciseCard(data, ui, day, ex)).join('')}
      ${day.exercises.length ? '' : '<div class="card empty">No exercises on this day yet. Add some in Settings.</div>'}
      ${early}
    </div>`;
}
