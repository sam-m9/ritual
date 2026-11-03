import { esc, shortDate, today, weekStart } from '../util.js';
import { ICON } from '../icons.js';
import {
  LEARN, PHASES, PLAN, LAST_WEEK, START_OPTIONS, nextSession, phaseOf, totalSec, weekOf, longestRunSec,
} from '../runplan.js';
import { runner, segLabel } from '../runner.js';

export const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const mins = (sec) => `${Math.round(sec / 60)} min`;

function strip(session) {
  const total = totalSec(session);
  return `<div class="seg-strip" aria-hidden="true">${session.segs.map((s) =>
    `<i class="seg-${s.type}" style="flex:${s.sec / total}"></i>`).join('')}</div>`;
}

function stats(run) {
  const start = weekStart();
  const done = run.log.filter((r) => r.completed || r.activeSec > 60);
  const thisWeek = done.filter((r) => r.date >= start).length;
  const longest = Math.max(0, ...run.log.filter((r) => r.completed).map((r) => r.longestSec || 0));
  const totalMin = Math.round(done.reduce((n, r) => n + (r.activeSec || 0), 0) / 60);
  return { thisWeek, longest, totalMin };
}

function onboarding(run) {
  return `
    <section class="card">
      <div class="label" style="color:var(--muted)">${run.started ? `Currently week ${run.week}` : 'Let’s find your starting week'}</div>
      <h2 class="run-q">How long can you run without stopping right now?</h2>
      <div class="stack" style="gap:8px;margin-top:14px">
        ${START_OPTIONS.map((o) => `
          <button class="opt ${run.started && run.week === o.week ? 'on' : ''}" data-act="run-start-week" data-week="${o.week}">
            <span>${esc(o.label)}</span><span class="label">Week ${o.week}</span>
          </button>`).join('')}
      </div>
      <p class="fine" style="margin-top:14px">Walk breaks are part of the plan, not a failure. You can change your week any time.</p>
    </section>
    <section class="card ink note">The goal of the first block: 30 minutes of running without stopping. Then 5K, then 10K.</section>`;
}

export function runView(data, ui) {
  const run = data.run;
  if (!run.started) return `<div class="stack">${onboarding(run)}</div>`;

  const s = nextSession(run);
  const wk = weekOf(run.week);
  const phase = phaseOf(run.week);
  const st = stats(run);
  const last = run.log.at(-1);
  const gapDays = last ? Math.round((new Date(today()) - new Date(last.date)) / 86400000) : 0;
  const ranToday = last?.date === today();
  const finishedPlan = run.week >= LAST_WEEK && run.index >= wk.runs.length;

  const banner = run.easeOff > 0 ? `
    <section class="card ease">
      <div class="label">Ease-off mode · ${run.easeOff} session${run.easeOff === 1 ? '' : 's'} left</div>
      <p>You reported pain, so the next sessions are short and gentle. The plan resumes where you left off. If it’s sharp, in one spot on a bone, or still there after 1 to 2 weeks, see a physio.</p>
      <button class="undo" data-act="run-ease-clear">I feel fine, resume the plan</button>
    </section>` : gapDays > 14 && run.week > 1 ? `
    <section class="card ease">
      <div class="label">It’s been ${gapDays} days</div>
      <p>After a break, stepping back a week keeps your legs happy.</p>
      <div class="recipe-actions"><button class="btn" data-act="run-week" data-delta="-1">Step back a week</button></div>
    </section>` : '';

  const weekRuns = wk.runs.map((r, i) => {
    const done = i < run.index;
    const now = i === run.index && !run.easeOff;
    return `<li class="${done ? 'done' : ''} ${now ? 'now' : ''}">
      <span class="wk-dot">${done ? ICON.check : i + 1}</span>
      <span class="wk-title">${esc(r.title)}</span><span class="label">${mins(totalSec(r))}</span></li>`;
  }).join('');

  const journey = PHASES.map((p) => {
    const span = p.to - p.from + 1;
    const pos = run.week < p.from ? 0 : run.week > p.to ? 1 : (run.week - p.from + run.index / 3) / span;
    return `<div class="jr ${run.week >= p.from && run.week <= p.to ? 'on' : ''}" style="flex:${span}">
      <div class="jr-bar"><i style="width:${pos * 100}%"></i></div>
      <div class="label">${esc(p.name)}</div></div>`;
  }).join('');

  const log = run.log.slice(-6).reverse().map((r) => `
    <div class="log-row">
      <div><b>${esc(r.title)}</b><span class="label">${shortDate(r.date)} · W${r.week}${r.easeOff ? ' · ease-off' : ''}</span></div>
      <div class="log-meta label">${mins(r.activeSec)}${r.km ? ` · ${r.km} ${esc(data.run.settings.distUnit || 'km')}` : ''}${r.pain > 3 ? ` · pain ${r.pain}` : ''}${r.completed ? '' : ' · stopped'}</div>
    </div>`).join('');

  const learn = LEARN.map((c) => {
    const open = !!ui.open[`learn:${c.id}`];
    return `<div class="recipe">
      <button class="recipe-h" data-act="toggle-open" data-key="learn:${c.id}" aria-expanded="${open}"><b>${esc(c.title)}</b><span>${open ? '–' : '+'}</span></button>
      ${open ? `<div class="recipe-body"><p>${esc(c.body)}</p></div>` : ''}
    </div>`;
  }).join('');

  const set = run.settings;
  const settingsOpen = !!ui.open['run:settings'];

  const verdict = run.verdict ? `
    <section class="card verdict">
      <div class="label">Coach</div>
      <h3>${esc(run.verdict.title)}</h3>
      <p>${esc(run.verdict.body)}</p>
    </section>` : '';

  return `
    <div class="stack">
      ${verdict}
      ${banner}
      <section class="card ink run-hero">
        <div class="label run-kicker">${finishedPlan ? 'Plan complete · keep going' : `Week ${s.week} · Run ${s.index + 1} of ${wk.runs.length}`} · ${esc(phase.name)}</div>
        <h1 class="run-title">${esc(s.title)}</h1>
        <div class="run-meta label">${mins(totalSec(s))} · longest run ${mmss(longestRunSec(s))} · talking pace</div>
        ${strip(s)}
        <div class="seg-key label"><span><i class="seg-run"></i>Run</span><span><i class="seg-walk"></i>Walk</span><span><i class="seg-warm"></i>Warm up / cool down</span></div>
        <button class="btn orange block run-go" data-act="run-go">${ranToday ? 'Start another run' : 'Start run'}</button>
        <p class="run-hint">Screen stays on during the run; there’s a black pocket screen. Voice cues talk over your music.</p>
      </section>

      <div class="run-links">
        <button data-act="run-plan">Full plan</button>
        <button data-act="run-level">Change level</button>
      </div>

      <div class="stats">
        <div class="card"><div class="label">This week</div><div class="big">${st.thisWeek}<small> / 3</small></div></div>
        <div class="card"><div class="label">Longest run</div><div class="big">${st.longest ? mmss(st.longest) : '—'}</div></div>
      </div>

      <button class="section-h section-link" data-act="run-plan"><h2>Week ${run.week}</h2><span class="count">${esc(wk.focus)} ›</span></button>
      <section class="card"><ul class="wk-list">${weekRuns}</ul>
        <p class="fine" style="margin-top:10px">Best after Day 1, 3 and 4. Not after Legs. Leave a day between runs when you can.</p>
      </section>

      <button class="section-h section-link" data-act="run-plan"><h2>Journey</h2><span class="count">${run.week} / ${LAST_WEEK} wk ›</span></button>
      <button class="card journey-card" data-act="run-plan" aria-label="See full plan"><div class="journey">${journey}</div></button>

      <div class="section-h"><h2>Coach notes</h2></div>
      <section class="card stack" style="gap:8px">${learn}</section>

      <div class="section-h"><h2>Run log</h2>${st.totalMin ? `<span class="count">${st.totalMin} min total</span>` : ''}</div>
      <section class="card">${log || '<p class="empty">Your runs will show up here after you log them.</p>'}</section>

      <section class="card collapse">
        <button class="collapse-h" data-act="toggle-open" data-key="run:settings" aria-expanded="${settingsOpen}">
          <h3>Run settings</h3><span class="pm">${settingsOpen ? '–' : '+'}</span>
        </button>
        ${settingsOpen ? `
        <div class="collapse-body">
          <div class="mini-label">Voice coaching</div>
          <div class="seg">
            ${[['full', 'Coach'], ['minimal', 'Cues only'], ['off', 'Beeps only']].map(([v, l]) => `<button class="${set.voice === v ? 'on' : ''}" data-act="run-set" data-k="voice" data-v="${v}">${l}</button>`).join('')}
          </div>
          <div class="mini-label" style="margin-top:8px">Countdown beeps</div>
          <div class="seg" style="grid-template-columns:1fr 1fr">
            <button class="${set.beeps ? 'on' : ''}" data-act="run-set" data-k="beeps" data-v="1">On</button>
            <button class="${set.beeps ? '' : 'on'}" data-act="run-set" data-k="beeps" data-v="0">Off</button>
          </div>
          <div class="mini-label" style="margin-top:8px">Plan week</div>
          <div class="seg">
            <button data-act="run-week" data-delta="-1">← Back</button>
            <button disabled style="opacity:1">Week ${run.week}</button>
            <button data-act="run-week" data-delta="1">Next →</button>
          </div>
          <button class="btn block ghost" style="margin-top:8px" data-act="run-test-voice">Test voice</button>
          <p class="fine">On iPhone: turn the ringer on and the volume up, and keep Ritual open. Locking the phone stops the cues; use the pocket screen instead.</p>
        </div>` : ''}
      </section>
    </div>`;
}

/** Full-screen guided run. Numbers are painted by paintRun() without re-rendering. */
export function runLiveView() {
  return `
    <div class="run-live" id="run-live">
      <div class="rl-top">
        <span class="label" id="rl-title"></span>
        <button class="rl-pocket" data-act="run-pocket">Pocket screen</button>
      </div>
      <div class="rl-center">
        <div class="rl-seg" id="rl-seg">Run</div>
        <div class="rl-clock" id="rl-clock">0:00</div>
        <div class="rl-rep label" id="rl-rep"></div>
        <div class="rl-bar"><i id="rl-bar"></i></div>
        <div class="rl-next label" id="rl-next"></div>
      </div>
      <div class="rl-total">
        <div><span class="label">Elapsed</span><b id="rl-el">0:00</b></div>
        <div><span class="label">Remaining</span><b id="rl-rem">0:00</b></div>
      </div>
      <div class="rl-strip" id="rl-strip"></div>
      <div class="rl-actions">
        <button class="rl-btn ghost" data-act="run-end">End</button>
        <button class="rl-btn main" data-act="run-pause" id="rl-pause">Pause</button>
        <button class="rl-btn ghost" data-act="run-skip">Skip</button>
      </div>
    </div>
    <div class="pocket" id="pocket" hidden>
      <div class="pocket-seg" id="pk-seg"></div>
      <div class="pocket-clock" id="pk-clock"></div>
      <p class="label">Double-tap to wake</p>
    </div>`;
}

export function paintRun() {
  const live = runner.live;
  if (!live || !document.getElementById('run-live')) return;
  const segs = live.session.segs;
  const pos = runner.position();
  const seg = segs[pos.i];
  const el = runner.elapsedMs() / 1000;
  const total = runner.totalSec();
  const runs = segs.filter((s) => s.type === 'run' || s.type === 'steady' || s.type === 'stride');
  const runNo = segs.slice(0, pos.i + 1).filter((s) => s.type === seg.type).length;
  const next = segs[pos.i + 1];

  const $ = (id) => document.getElementById(id);
  $('rl-title').textContent = live.session.title;
  $('rl-seg').textContent = segLabel(seg.type);
  $('run-live').dataset.seg = seg.type;
  $('rl-clock').textContent = mmss(pos.left);
  $('rl-rep').textContent = (seg.type === 'run' || seg.type === 'walk') && runs.length > 1
    ? `${segLabel(seg.type)} ${runNo} of ${segs.filter((s) => s.type === seg.type).length}` : '';
  $('rl-bar').style.width = `${(pos.into / seg.sec) * 100}%`;
  $('rl-next').textContent = next ? `Next · ${segLabel(next.type)} ${mmss(next.sec)}` : 'Last segment';
  $('rl-el').textContent = mmss(el);
  $('rl-rem').textContent = mmss(total - el);
  $('rl-pause').textContent = runner.paused() ? 'Resume' : 'Pause';
  $('run-live').classList.toggle('paused', runner.paused());
  $('pk-seg').textContent = runner.paused() ? 'Paused' : segLabel(seg.type);
  $('pk-clock').textContent = mmss(pos.left);

  const strip = $('rl-strip');
  if (!strip.childElementCount) {
    strip.innerHTML = segs.map((s) => `<i class="seg-${s.type}" style="flex:${s.sec / total}"></i>`).join('') + '<b class="rl-cursor"></b>';
  }
  strip.querySelector('.rl-cursor').style.left = `${Math.min(100, (el / total) * 100)}%`;
}

/** After a run: how did it feel? */
export function runLogView(draft, distUnit) {
  const chip = (k, v, label) => `<button type="button" class="${draft[k] === v ? 'on' : ''}" data-act="rl-pick" data-k="${k}" data-v="${v}">${label}</button>`;
  const scale = (k) => Array.from({ length: 11 }, (_, n) => chip(k, n, n)).join('');
  return `
    <header class="topbar sheet-h"><span class="brand">Run done</span></header>
    <form class="stack" data-form="run-log">
      <section class="card ink">
        <div class="label run-kicker">${esc(draft.title)}</div>
        <div class="run-title" style="margin-top:6px">${mmss(draft.activeSec)}</div>
        <div class="label" style="opacity:.75;margin-top:6px">${draft.completed ? 'Full session' : 'Stopped early'}</div>
      </section>

      <section class="card">
        <div class="label q">How was your breathing?</div>
        <div class="seg">${chip('breath', 'easy', 'Could talk')}${chip('breath', 'ok', 'Short phrases')}${chip('breath', 'hard', 'Gasping')}</div>
        <div class="label q">Overall effort · 0 easy, 10 max</div>
        <div class="scale">${scale('effort')}</div>
        <div class="label q">Any pain? · 0 none, 10 worst</div>
        <div class="scale">${scale('pain')}</div>
        ${draft.pain > 0 ? `
        <div class="label q">Where?</div>
        <div class="chips-row">${['Shin', 'Calf', 'Knee', 'Foot / ankle', 'Hip', 'Other'].map((w) => chip('where', w, w)).join('')}</div>` : ''}
        <div class="grid2" style="margin-top:14px">
          <div><div class="mini-label">Distance · ${esc(distUnit)} (optional)</div><input class="field" name="km" inputmode="decimal" placeholder="—" value="${esc(draft.km || '')}"></div>
          <div><div class="mini-label">Note (optional)</div><input class="field" name="note" placeholder="Treadmill, hot…" value="${esc(draft.note || '')}"></div>
        </div>
      </section>
      <button class="btn block" type="submit">Save run</button>
      <button class="btn block ghost" type="button" data-act="rl-discard">Discard</button>
    </form>`;
}

const sheetHead = (title) => `
  <header class="topbar sheet-h">
    <button class="back-pill" data-act="close-view">← BACK</button>
    <h1>${esc(title)}</h1>
  </header>`;

/** Every week of the plan; start from any of them. */
export function runPlanView(data) {
  const run = data.run;
  const phases = PHASES.map((p) => {
    const weeks = PLAN.filter((w) => w.week >= p.from && w.week <= p.to).map((w) => {
      const current = run.started && w.week === run.week;
      const past = run.started && w.week < run.week;
      return `
        <section class="card plan-week ${current ? 'current' : ''} ${past ? 'past' : ''}">
          <div class="plan-week-h">
            <div><div class="label">Week ${w.week}${current ? ' · you are here' : past ? ' · done' : ''}</div><h3>${esc(w.focus)}</h3></div>
            ${current ? '' : `<button class="btn ${past ? 'ghost' : ''}" data-act="run-start-week" data-week="${w.week}">${past ? 'Redo' : 'Start here'}</button>`}
          </div>
          <ol class="plan-runs">${w.runs.map((r, i) => `
            <li class="${current && i < run.index ? 'done' : ''}"><span>${esc(r.title)}</span><span class="label">${Math.round(totalSec(r) / 60)} min</span></li>`).join('')}
          </ol>
        </section>`;
    }).join('');
    return `
      <div class="section-h"><h2>${esc(p.name)}</h2><span class="count">Weeks ${p.from}–${p.to} · ${esc(p.goal)}</span></div>
      ${weeks}`;
  }).join('');
  return `${sheetHead('Run plan')}
    <div class="stack">
      <p class="fine" style="padding:0 4px">3 runs a week, each with a 5-minute walk to warm up and cool down. Repeating a week is normal. Jumping ahead is fine if it feels easy.</p>
      ${phases}
    </div>`;
}

/** Re-pick your level at any time. */
export function runLevelView(data) {
  return `${sheetHead('Change level')}<div class="stack">${onboarding(data.run)}</div>`;
}
