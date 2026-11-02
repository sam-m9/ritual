import { esc, fmt, repLow } from '../util.js';
import { EQ_ICONS, EQ_LABELS, ICON } from '../icons.js';
import { dayProgress, findDay, lastEntry, setsFor, topSet } from '../domain.js';

export function effortTag(ex, day) {
  if (day.noRir) return '<span class="tag solid">NO RIR · CHASE THE BURN</span>';
  if (ex.effort === 'FAIL') return '<span class="tag solid">TO FAILURE · LAST SET</span>';
  if (ex.effort) return `<span class="tag">${esc(ex.effort)} RIR</span>`;
  return '';
}

function lastLine(data, ex) {
  const last = lastEntry(data, ex.name);
  if (!last) return 'no history yet';
  const top = topSet(last.sets);
  const unit = data.settings.unit;
  if (top.w === null) return `${fmt(top.r)} reps`;
  return `${fmt(top.w)} ${unit} × ${fmt(top.r)}`;
}

function exerciseCard(data, day, ex) {
  const sets = setsFor(data, day.id, ex);
  const done = sets.every((s) => s.c);
  const fail = ex.effort === 'FAIL' && !day.noRir;
  const rows = sets.map((s, i) => `
    <div class="set-row">
      <div class="set-n">${i + 1}${fail && i === sets.length - 1 ? '<small>FAIL</small>' : ''}</div>
      <input class="num" inputmode="decimal" enterkeyhint="next" placeholder="${esc(data.settings.unit)}"
        aria-label="Set ${i + 1} weight" value="${esc(s.w)}" data-in="set" data-field="w" data-ex="${ex.id}" data-i="${i}">
      <span class="x">×</span>
      <input class="num" inputmode="numeric" enterkeyhint="done" placeholder="${esc(ex.reps.replace(/\s.*$/, '') || repLow(ex.reps))}"
        aria-label="Set ${i + 1} reps" value="${esc(s.r)}" data-in="set" data-field="r" data-ex="${ex.id}" data-i="${i}">
      <button class="check ${s.c ? 'on' : ''}" data-act="toggle-set" data-ex="${ex.id}" data-i="${i}"
        aria-label="Set ${i + 1} done" aria-pressed="${s.c}">${ICON.check}</button>
    </div>`).join('');

  return `
  <article class="ex-card ${done ? 'done' : ''}">
    <div class="ex-head">
      <div class="eq-tile" title="${EQ_LABELS[ex.eq] || ''}">${EQ_ICONS[ex.eq] || ''}</div>
      <div class="ex-title">
        <h3 class="ex-name">${esc(ex.name)}</h3>
        <div class="ex-rx"><span class="rx">${esc(ex.sets)} × ${esc(ex.reps)}</span>${effortTag(ex, day)}</div>
      </div>
      <button class="play ${ex.url ? '' : 'off'}" data-act="video" data-url="${esc(ex.url)}" aria-label="Watch form video">${ICON.play}</button>
    </div>
    <div class="last label">Last time · <b>${esc(lastLine(data, ex))}</b></div>
    ${rows}
    ${done ? '<div class="done-l label">Done ✓</div>' : ''}
  </article>`;
}

export function trainView(data, ui) {
  const day = findDay(data, ui.dayId);
  const prog = dayProgress(data, day);
  const setCount = day.exercises.reduce((n, e) => n + (Number(e.sets) || 0), 0);

  const pills = data.program.map((d) => `
    <button class="pill ${d.id === day.id ? 'on' : ''}" data-act="pick-day" data-day="${d.id}">${d.num} · ${esc(d.name)}</button>`).join('');

  const allDone = prog.total > 0 && prog.done === prog.total;
  const banner = allDone ? `
    <section class="card ink day-done">
      <div><h3>Day done</h3><p>All ${prog.total} sets logged</p></div>
      <button class="btn orange" data-act="finish">Finish &amp; log</button>
    </section>` : '';

  const early = !allDone && prog.done > 0 ? `
    <div class="finish-early"><button data-act="finish">Finish early &amp; log ${prog.done} set${prog.done === 1 ? '' : 's'}</button></div>` : '';

  return `
    <nav class="pill-row" aria-label="Training days">${pills}</nav>
    <header class="day-head">
      <span class="day-badge">Day ${day.num}</span>
      <h1 class="day-title">${esc(day.name)}</h1>
    </header>
    <p class="focus label">${esc(day.focus)}</p>
    <div class="chips"><span class="chip">${day.exercises.length} exercises</span><span class="chip">${setCount} sets</span></div>
    <div class="stack">
      <section class="card white progress" id="progress">
        <div class="progress-top"><span>${prog.done} / ${prog.total} sets</span><span>${prog.pct}%</span></div>
        <div class="bar"><i style="width:${prog.pct}%"></i></div>
      </section>
      ${banner}
      ${day.exercises.map((ex) => exerciseCard(data, day, ex)).join('')}
      ${day.exercises.length ? '' : '<div class="card empty">No exercises on this day yet. Add some in Settings.</div>'}
      ${early}
    </div>`;
}
