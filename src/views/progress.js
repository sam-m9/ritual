import { esc, fmt, shortDate } from '../util.js';
import { barHeights, liftHistory, weekStats } from '../domain.js';

const bars = (values) => `<div class="bars">${barHeights(values).map((h) => `<i style="height:${h}%"></i>`).join('')}</div>`;

function trendCard(title, list, unit, metric) {
  if (!list.length) {
    return `<section class="card trend"><h3>${title}</h3><p class="empty" style="margin-top:6px">Nothing logged yet.</p></section>`;
  }
  const recent = list.slice(-8);
  const latest = list.at(-1);
  const first = list[0];
  const delta = latest.v - first.v;
  const deltaText = list.length > 1 ? `${delta > 0 ? '+' : ''}${fmt(delta)} since ${shortDate(first.d)}` : '';
  return `
    <section class="card trend">
      <div class="trend-top"><h3>${title}</h3><span class="val">${fmt(latest.v)}<small>${unit}</small></span></div>
      ${recent.length > 1 ? bars(recent.map((e) => e.v)) : ''}
      <div class="entries" style="${recent.length > 1 ? '' : 'margin-top:8px'}">${list.slice(-4).reverse().map((e) => `<span>${shortDate(e.d)} · <b>${fmt(e.v)}</b></span>`).join('')}</div>
      ${deltaText ? `<p class="fine" style="margin-top:8px">${esc(deltaText)}</p>` : ''}
      <button class="undo" data-act="undo-metric" data-metric="${metric}">Remove last entry</button>
    </section>`;
}

function liftCard(lift, unit) {
  const pts = lift.points;
  const first = pts[0];
  const last = pts.at(-1);
  return `
    <section class="card trend">
      <div class="trend-top"><h3 style="font-size:18px">${esc(lift.name)}</h3>
        <span class="val" style="font-size:16px">${fmt(first.w)} → ${fmt(last.w)}<small>${unit}</small></span></div>
      ${pts.length > 1 ? bars(pts.slice(-8).map((p) => p.w)) : ''}
      <div class="entries" style="${pts.length > 1 ? '' : 'margin-top:8px'}">
        <span>Latest ${shortDate(last.d)} · <b>${fmt(last.w)} ${unit} × ${fmt(last.r)}</b></span>
        <span>${pts.length} session${pts.length === 1 ? '' : 's'}</span>
      </div>
    </section>`;
}

export function progressView(data) {
  const { weight, waist } = data.body;
  const unit = data.settings.unit;
  const wUnit = data.settings.waistUnit;
  const lifts = liftHistory(data);
  const wk = weekStats(data);

  return `
    <div class="stack">
      <div class="quick">
        <form class="card" data-form="log-metric" data-metric="weight">
          <div class="label">Bodyweight · ${unit}</div>
          <input class="num" name="v" inputmode="decimal" placeholder="${weight.length ? fmt(weight.at(-1).v) : '—'}" aria-label="Bodyweight">
          <button class="btn" type="submit">LOG</button>
        </form>
        <form class="card" data-form="log-metric" data-metric="waist">
          <div class="label">Waist · ${wUnit}</div>
          <input class="num" name="v" inputmode="decimal" placeholder="${waist.length ? fmt(waist.at(-1).v) : '—'}" aria-label="Waist">
          <button class="btn" type="submit">LOG</button>
        </form>
      </div>

      <div class="card ink note">Scale weight should stay flat while waist drops and lifts rise.</div>

      <div class="stats">
        <div class="card"><div class="label">This week</div><div class="big">${wk.thisWeek}<small> / ${wk.planned}</small></div></div>
        <div class="card"><div class="label">Rituals kept</div><div class="big">${wk.total}</div></div>
      </div>

      ${trendCard('Bodyweight', weight, unit, 'weight')}
      ${trendCard('Waist', waist, wUnit, 'waist')}

      <div class="section-h"><h2>Lift history</h2></div>
      ${lifts.length ? lifts.map((l) => liftCard(l, unit)).join('') :
        '<section class="card"><p class="empty" style="color:var(--ink)">Finish a day to log top sets. Each lift will chart here, week to week.</p></section>'}
    </div>`;
}
