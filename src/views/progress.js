import { esc, fmt, shortDate } from '../util.js';
import { barHeights, bodyPartStats, liftHistoryByDay, weekStats } from '../domain.js';
import { muscleLabel } from '../muscles.js';

const bars = (values) => `<div class="bars">${barHeights(values).map((h) => `<i style="height:${h}%"></i>`).join('')}</div>`;

/** One column of the Body card: latest value, change, a small sparkline. */
function trendCol(title, list, unit, metric) {
  if (!list.length) return `<div class="tcol"><span class="label">${title}</span><b class="tval">—</b><span class="tdelta">Log your first</span></div>`;
  const latest = list.at(-1);
  const first = list[0];
  const delta = latest.v - first.v;
  const recent = list.slice(-8);
  return `
    <div class="tcol">
      <span class="label">${title}</span>
      <b class="tval">${fmt(latest.v)}<small> ${unit}</small></b>
      <span class="tdelta">${list.length > 1 ? `${delta > 0 ? '+' : ''}${fmt(delta)} since ${shortDate(first.d)}` : shortDate(latest.d)}</span>
      ${recent.length > 1 ? `<div class="bars spark">${barHeights(recent.map((e) => e.v)).map((h) => `<i style="height:${h}%"></i>`).join('')}</div>` : ''}
      <button class="undo" data-act="undo-metric" data-metric="${metric}">Remove last</button>
    </div>`;
}

function liftCard(lift, unit, tag) {
  const pts = lift.points;
  const byReps = pts.every((p) => p.w === null);
  const val = (p) => (byReps ? p.r : p.w);
  const u = byReps ? 'reps' : unit;
  const first = pts[0];
  const last = pts.at(-1);
  const latest = byReps ? `${fmt(last.r)} reps` : `${fmt(last.w)} ${unit}${last.r === null ? '' : ` × ${fmt(last.r)}`}`;
  return `
    <section class="card trend">
      <div class="lift-tag label">${esc(tag)}</div>
      <div class="trend-top"><h3 style="font-size:16px">${esc(lift.name)}</h3>
        <span class="val" style="font-size:16px">${fmt(val(first))} → ${fmt(val(last))}<small>${u}</small></span></div>
      ${pts.length > 1 ? bars(pts.slice(-8).map(val)) : ''}
      <div class="entries" style="${pts.length > 1 ? '' : 'margin-top:8px'}">
        <span>Latest ${shortDate(last.d)} · <b>${esc(latest)}</b></span>
        <span>${pts.length} session${pts.length === 1 ? '' : 's'}</span>
      </div>
    </section>`;
}

function bodyPartCard(g, unit) {
  const thisWeek = g.weekly.at(-1);
  const lastWeek = g.weekly.at(-2);
  const max = Math.max(1, ...g.weekly);
  const bars = `<div class="bars wk-bars">${g.weekly.map((n, i) =>
    `<i class="${i === g.weekly.length - 1 ? 'now' : ''} ${n ? '' : 'zero'}" style="height:${n ? 15 + (n / max) * 85 : 6}%" title="${n} sets"></i>`).join('')}</div>`;
  const lifts = g.lifts.map((l) => {
    const pts = l.points;
    const byReps = pts.every((p) => p.w === null);
    const v = (p) => (byReps ? p.r : p.w);
    const u = byReps ? 'reps' : unit;
    return `<div class="bp-lift"><span>${esc(l.name)}</span><b>${fmt(v(pts[0]))} → ${fmt(v(pts.at(-1)))} ${u}</b></div>`;
  }).join('');
  return `
    <section class="card trend">
      <div class="trend-top"><h3>${esc(muscleLabel(g.id))}</h3><span class="val">${thisWeek}<small>sets this wk</small></span></div>
      ${bars}
      <div class="entries"><span>Last week · <b>${lastWeek}</b></span><span>8 weeks · <b>${g.weekly.reduce((a, b) => a + b, 0)}</b></span><span>All time · <b>${g.total}</b></span></div>
      ${lifts ? `<div class="bp-lifts">${lifts}</div>` : ''}
    </section>`;
}

export function progressView(data, ui = {}) {
  const { weight, waist } = data.body;
  const unit = data.settings.unit;
  const wUnit = data.settings.waistUnit;
  const groups = liftHistoryByDay(data);
  const parts = bodyPartStats(data);
  const byDay = ui.liftView === 'day';
  const wk = weekStats(data);

  return `
    <div class="stack">
      <section class="card quick-log">
        <form class="ql-row" data-form="log-metric" data-metric="weight">
          <span class="label">Bodyweight · ${unit}</span>
          <input class="field" name="v" inputmode="decimal" placeholder="${weight.length ? fmt(weight.at(-1).v) : '—'}" aria-label="Bodyweight">
          <button class="btn" type="submit">Log</button>
        </form>
        <form class="ql-row" data-form="log-metric" data-metric="waist">
          <span class="label">Waist · ${wUnit}</span>
          <input class="field" name="v" inputmode="decimal" placeholder="${waist.length ? fmt(waist.at(-1).v) : '—'}" aria-label="Waist">
          <button class="btn" type="submit">Log</button>
        </form>
      </section>


      <section class="card body-card">
        <div class="body-cols">${trendCol('Bodyweight', weight, unit, 'weight')}${trendCol('Waist', waist, wUnit, 'waist')}</div>
        <p class="fine body-hint">Recomp check: scale flat, waist down, lifts up.</p>
      </section>

      <section class="card week-row">
        <div><span class="label">This week</span><b>${wk.thisWeek}<small>/${wk.planned} lifts</small></b></div>
        <div><span class="label">Rituals kept</span><b>${wk.total}</b></div>
      </section>

      <div class="section-h"><h2>Lift history</h2></div>
      ${groups.length ? `
        <div class="seg lift-toggle" style="grid-template-columns:1fr 1fr">
          <button class="${byDay ? '' : 'on'}" data-act="lift-view" data-v="body">By body part</button>
          <button class="${byDay ? 'on' : ''}" data-act="lift-view" data-v="day">By day</button>
        </div>
        ${byDay ? groups.map((g) => `
          <h3 class="lift-group label">${esc(g.label)}</h3>
          ${g.lifts.map((l) => liftCard(l, unit, g.day ? `Day ${g.day.num}` : g.label)).join('')}`).join('')
        : parts.map((g) => bodyPartCard(g, unit)).join('')}
        ${byDay ? '' : '<p class="fine" style="padding:0 4px">Working sets logged per week, Monday to Sunday. Most muscles grow well on about 10–20 sets a week.</p>'}` :
        '<section class="card"><p class="empty" style="color:var(--ink)">Finish a day to log top sets. Each lift will chart here, week to week, by body part and by day.</p></section>'}
    </div>`;
}
