import { esc } from '../util.js';
import { EQ_ICONS, EQ_LABELS } from '../icons.js';
import { EFFORT_OPTIONS, RECIPE_CATEGORIES } from '../seed.js';
import { MUSCLES, muscleOf } from '../muscles.js';
import { findDay } from '../domain.js';
import { SCHEMA } from '../store.js';

function effortLabel(v) {
  if (v === '') return 'No RIR';
  if (v === 'FAIL') return 'To failure';
  return `${v} RIR`;
}

function exerciseEditor(day, ex) {
  const attrs = `data-day="${day.id}" data-ex="${ex.id}"`;
  return `
    <div class="edit-ex">
      <div class="edit-row">
        <button class="eq-tile" data-act="cycle-eq" ${attrs} aria-label="Equipment: ${EQ_LABELS[ex.eq]}. Tap to change.">${EQ_ICONS[ex.eq]}</button>
        <input class="field" value="${esc(ex.name)}" placeholder="Exercise name" data-in="ex" data-field="name" ${attrs}>
        <button class="icon-btn" data-act="remove-ex" ${attrs} aria-label="Remove ${esc(ex.name)}">✕</button>
      </div>
      <div class="edit-grid">
        <div><div class="mini-label">Sets</div><input class="field" inputmode="numeric" value="${esc(ex.sets)}" data-in="ex" data-field="sets" ${attrs}></div>
        <div><div class="mini-label">Reps</div><input class="field" value="${esc(ex.reps)}" data-in="ex" data-field="reps" ${attrs}></div>
        <div><div class="mini-label">Effort</div>
          <select class="field" data-in="ex" data-field="effort" ${attrs}>
            ${EFFORT_OPTIONS.map((o) => `<option value="${o}" ${o === ex.effort ? 'selected' : ''}>${effortLabel(o)}</option>`).join('')}
          </select></div>
      </div>
      <div><div class="mini-label">Body part</div>
        <select class="field" data-in="ex" data-field="muscle" ${attrs}>
          ${MUSCLES.map((m) => `<option value="${m.id}" ${m.id === muscleOf(ex) ? 'selected' : ''}>${m.label}</option>`).join('')}
        </select></div>
      <input class="field" type="url" inputmode="url" value="${esc(ex.url)}" placeholder="Form video link (YouTube, etc.)" data-in="ex" data-field="url" ${attrs}>
      <input class="field" value="${esc(ex.cue || '')}" placeholder="Cue (optional), e.g. superset with #5, pause at stretch" data-in="ex" data-field="cue" ${attrs}>
    </div>`;
}

export function settingsView(data, ui) {
  const day = findDay(data, ui.editDayId);
  const pills = data.program.map((d) => `
    <button class="pill ${d.id === day.id ? 'on' : ''}" data-act="edit-day" data-day="${d.id}">Day ${d.num} · ${esc(d.name)}</button>`).join('');
  const s = data.settings;

  return `
    <header class="topbar sheet-h">
      <button class="back-pill" data-act="close-view">← BACK</button>
      <h1>Settings</h1>
    </header>
    <div class="stack">
      <div class="section-h" style="margin-top:4px"><h2>Program</h2></div>
      <nav class="pill-row">${pills}</nav>
      <div class="grid2">
        <div><div class="mini-label">Day name</div><input class="field" value="${esc(day.name)}" data-in="day" data-field="name" data-day="${day.id}"></div>
        <div><div class="mini-label">Focus</div><input class="field" value="${esc(day.focus)}" data-in="day" data-field="focus" data-day="${day.id}"></div>
      </div>
      <div><div class="mini-label">Coaching note</div><textarea class="field" rows="2" style="min-height:72px" placeholder="Optional cue shown under the day title" data-in="day" data-field="note" data-day="${day.id}">${esc(day.note || '')}</textarea></div>
      ${day.exercises.map((ex) => exerciseEditor(day, ex)).join('')}
      <button class="dashed" data-act="add-ex" data-day="${day.id}">+ Add exercise</button>
      <p class="fine">Tap the icon to change equipment. Renaming a lift keeps its history only if the new name matches an existing lift.</p>

      <div class="section-h"><h2>Training</h2></div>
      <div class="card">
        <div class="label">Rest timer target · seconds</div>
        <input class="field" style="margin-top:10px" inputmode="numeric" value="${esc(s.restSeconds || 60)}" aria-label="Rest target in seconds" data-in="setting" data-field="restSeconds">
        <div class="label" style="margin-top:14px">Sound when rest is up</div>
        <div class="seg" style="margin-top:8px">
          ${[['voice', 'Chime + voice'], ['chime', 'Chime'], ['off', 'Off']].map(([v, l]) => `<button class="${(s.restSound || 'voice') === v ? 'on' : ''}" data-act="rest-sound" data-v="${v}">${l}</button>`).join('')}
        </div>
        <button class="btn block ghost" style="margin-top:8px" data-act="rest-test">Test sound</button>
        <p class="fine" style="margin-top:8px">Plays over your music. Keep Ritual open and the ringer on; it can't ring while the phone is locked.</p>
      </div>

      <div class="section-h"><h2>Nutrition</h2></div>
      <div class="card">
        <div class="label">Daily protein target · g</div>
        <div class="grid2" style="margin-top:10px">
          <input class="field" inputmode="numeric" value="${esc(s.proteinMin)}" aria-label="Minimum" data-in="setting" data-field="proteinMin">
          <input class="field" inputmode="numeric" value="${esc(s.proteinMax)}" aria-label="Maximum" data-in="setting" data-field="proteinMax">
        </div>
      </div>

      <div class="card">
        <div class="label">Add recipes from JSON</div>
        <p class="fine" style="margin:8px 0 10px">Paste output from your meal-planning prompt ({ "recipes": [...], "groceries": [...] }). New recipes and staples are added; anything with the same name is skipped.</p>
        <textarea class="field" id="recipe-json" rows="4" style="min-height:96px" placeholder='{ "recipes": [ ... ], "groceries": [ ... ] }'></textarea>
        <button class="btn block" style="margin-top:10px" data-act="import-recipes">Add recipes</button>
      </div>

      <div class="section-h"><h2>Data</h2></div>
      <div class="card stack">
        <p class="fine">Everything lives on this phone as one JSON file. Export it as a backup, or import it on another device.</p>
        <button class="btn block" data-act="export">Export to JSON</button>
        <button class="btn block ghost" data-act="import">Import from JSON</button>
        <button class="btn block ghost" disabled>Save to Google Drive · SOON</button>
        <button class="btn block ghost danger ${ui.resetArmed ? 'armed' : ''}" data-act="reset">${ui.resetArmed ? 'TAP AGAIN TO ERASE EVERYTHING' : 'Reset all data'}</button>
      </div>
      <p class="fine">Ritual · data schema v${SCHEMA} · ${data.sessions.length} sessions · ${data.nutrition.recipes.length} recipes</p>
    </div>`;
}

export function recipeEditorView(draft) {
  return `
    <header class="topbar sheet-h">
      <button class="back-pill" data-act="close-view">← BACK</button>
      <h1>${draft.isNew ? 'New recipe' : 'Edit recipe'}</h1>
    </header>
    <form class="card" data-form="recipe">
      <div class="seg" style="grid-template-columns:repeat(${RECIPE_CATEGORIES.length},1fr)">
        ${RECIPE_CATEGORIES.map((c) => `<button type="button" class="${draft.cat === c.id ? 'on' : ''}" data-act="recipe-cat" data-cat="${c.id}">${c.single}</button>`).join('')}
      </div>
      <label class="field-label label" for="r-title">Name</label>
      <input class="field" id="r-title" name="title" value="${esc(draft.title)}" placeholder="Greek yogurt bowl" required>
      <div class="grid2">
        <div><label class="field-label label" for="r-protein">Protein · g</label>
          <input class="field" id="r-protein" name="protein" inputmode="numeric" value="${esc(draft.protein)}" placeholder="40"></div>
        <div><label class="field-label label" for="r-min">Minutes</label>
          <input class="field" id="r-min" name="minutes" inputmode="numeric" value="${esc(draft.minutes)}" placeholder="10"></div>
      </div>
      <label class="field-label label" for="r-ing">Ingredients · one per line</label>
      <textarea class="field" id="r-ing" name="ingredients" placeholder="250g Greek yogurt&#10;1 scoop whey&#10;Handful berries">${esc(draft.ingredients.join('\n'))}</textarea>
      <label class="field-label label" for="r-steps">Steps · one per line</label>
      <textarea class="field" id="r-steps" name="steps" placeholder="Stir whey into yogurt&#10;Top with berries">${esc(draft.steps.join('\n'))}</textarea>
      <label class="field-label label" for="r-url">Link</label>
      <input class="field" id="r-url" name="url" type="url" inputmode="url" value="${esc(draft.url)}" placeholder="Optional">
      <label class="field-label label" for="r-notes">Notes</label>
      <input class="field" id="r-notes" name="notes" value="${esc(draft.notes)}" placeholder="Optional">
      <div class="stack" style="margin-top:16px">
        <button class="btn block" type="submit">Save</button>
        ${draft.isNew ? '' : `<button class="btn block ghost danger ${draft.deleteArmed ? 'armed' : ''}" type="button" data-act="delete-recipe">${draft.deleteArmed ? 'TAP AGAIN TO DELETE' : 'Delete recipe'}</button>`}
      </div>
    </form>`;
}
