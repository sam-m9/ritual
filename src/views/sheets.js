// Full-screen sheets: session summary, exercise swap, cook mode.

import { esc, fmt } from '../util.js';
import { ALTERNATIVES, muscleLabel, muscleOf } from '../muscles.js';
import { effectiveEx, findDay } from '../domain.js';
import { EQ_ICONS } from '../icons.js';

const head = (title, back = '← BACK') => `
  <header class="topbar sheet-h">
    <button class="back-pill" data-act="close-view">${back}</button>
    <h1>${esc(title)}</h1>
  </header>`;

/** Shown right after Finish & log: the reward moment. */
export function summaryView(sum, unit) {
  if (!sum) return head('Session');
  // Only compare volume when this session was about as complete as the last one.
  const delta = sum.lastVolume && sum.sets >= (sum.lastSets || 0) * 0.8
    ? Math.round(((sum.volume - sum.lastVolume) / sum.lastVolume) * 100) : null;
  const parts = Object.entries(sum.byPart).sort((a, b) => b[1] - a[1]);
  return `
    ${head('Session done', 'DONE')}
    <div class="stack">
      <section class="card ink sum-hero">
        <div class="label run-kicker">${esc(sum.dayName)} · logged</div>
        <div class="sum-big">${sum.prs.length ? `${sum.prs.length} PR${sum.prs.length === 1 ? '' : 's'}` : 'Ritual kept'}</div>
        <div class="sum-grid">
          <div><span class="label">Time</span><b>${sum.minutes ? `${sum.minutes} min` : '—'}</b></div>
          <div><span class="label">Sets</span><b>${sum.sets}</b></div>
          <div><span class="label">Volume</span><b>${Math.round(sum.volume).toLocaleString()}<small> ${unit}</small></b></div>
        </div>
        ${delta != null ? `<p class="sum-delta">${delta >= 0 ? '+' : ''}${delta}% volume vs last ${esc(sum.dayName)}</p>`
          : sum.lastVolume ? '<p class="sum-delta">Shorter session than last time. It still counts.</p>'
          : '<p class="sum-delta">First time logging this day: it’s your baseline now.</p>'}
      </section>
      ${sum.prs.length ? `
      <section class="card">
        <div class="label q">Personal records</div>
        ${sum.prs.map((p) => `<div class="bp-lift"><span>${esc(p.name)}</span><b>${p.w != null ? `${fmt(p.w)} ${unit} × ${fmt(p.r)}` : `${fmt(p.r)} reps`}</b></div>`).join('')}
      </section>` : ''}
      <section class="card">
        <div class="label q">Sets by body part</div>
        ${parts.map(([id, n]) => `<div class="bp-lift"><span>${esc(muscleLabel(id))}</span><b>${n} set${n === 1 ? '' : 's'}</b></div>`).join('')}
      </section>
      <button class="btn block" data-act="close-view">Done</button>
    </div>`;
}

/** Pick a replacement when the machine is taken (for today, or for good). */
export function swapView(data, ui) {
  const day = findDay(data, ui.dayId);
  const slot = day.exercises.find((e) => e.id === ui.swapEx);
  if (!slot) return head('Swap');
  const now = effectiveEx(data, day.id, slot);
  const part = muscleOf(now);
  const inPlan = data.program.flatMap((d) => d.exercises).filter((e) => muscleOf(e) === part).map((e) => [e.name, e.eq]);
  const seen = new Set();
  const options = [...inPlan, ...(ALTERNATIVES[part] || [])].filter(([n]) => {
    const k = n.toLowerCase();
    if (seen.has(k) || k === now.name.toLowerCase()) return false;
    seen.add(k);
    return true;
  });
  return `
    ${head('Swap exercise')}
    <div class="stack">
      <section class="card">
        <div class="label" style="color:var(--muted)">Replacing · ${esc(muscleLabel(part))}</div>
        <h2 class="run-q">${esc(now.name)}</h2>
        <label class="swap-perm"><input type="checkbox" id="swap-perm" ${ui.swapPerm ? 'checked' : ''}> Also change my program (not just today)</label>
      </section>
      ${now.swapped ? `<button class="opt" data-act="do-swap" data-name="">Back to plan: ${esc(slot.name)}</button>` : ''}
      <section class="card stack" style="gap:8px">
        ${options.map(([n, eq]) => `
          <button class="opt swap-opt" data-act="do-swap" data-name="${esc(n)}" data-eq="${esc(eq)}">
            <span class="eq-mini">${EQ_ICONS[eq] || ''}</span><span>${esc(n)}</span>
          </button>`).join('')}
      </section>
      <form class="card add-row" data-form="custom-swap" style="margin:0">
        <input class="field" name="name" placeholder="Something else…" autocomplete="off">
        <button class="btn" type="submit">Use</button>
      </form>
      <p class="fine" style="padding:0 4px">Sets and weights you’ve entered stay. Last time and history follow the new exercise’s name.</p>
    </div>`;
}

/** Cook mode: one big step at a time, screen kept on, timers for any "N minutes" in a step. */
export function cookView(recipe, ui) {
  if (!recipe) return head('Cook');
  const step = Math.min(ui.cookStep || 0, Math.max(0, recipe.steps.length - 1));
  const text = recipe.steps[step] || 'No steps for this recipe.';
  const mins = [...text.matchAll(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+))?\s*(?:min|minute)/gi)].map((m) => Number(m[2] || m[1]));
  const got = ui.cookHave || {};
  return `
    ${head('Cook mode')}
    <div class="stack">
      <div class="label" style="padding:0 4px">${esc(recipe.title)}</div>
      <section class="card cook-step">
        <div class="label">Step ${step + 1} of ${recipe.steps.length || 1}</div>
        <p>${esc(text)}</p>
        ${mins.length ? `<div class="cook-timers">${[...new Set(mins)].map((m) => `<button class="btn ghost" data-act="cook-timer" data-min="${m}">Timer ${m} min</button>`).join('')}</div>` : ''}
        <div class="cook-clock" id="cook-clock" hidden></div>
      </section>
      <div class="rl-actions" style="grid-template-columns:1fr 1fr">
        <button class="rl-btn ghost" data-act="cook-step" data-d="-1" ${step === 0 ? 'disabled' : ''}>Back</button>
        <button class="rl-btn main" data-act="cook-step" data-d="1">${step >= recipe.steps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
      <section class="card">
        <div class="label q">Ingredients · tap what you have</div>
        ${recipe.ingredients.map((ing, i) => `
          <button class="cook-ing ${got[i] ? 'on' : ''}" data-act="cook-have" data-i="${i}">${esc(ing)}</button>`).join('')}
      </section>
    </div>`;
}
