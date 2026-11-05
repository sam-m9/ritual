import { esc } from '../util.js';
import { EQ_ICONS, EQ_LABELS } from '../icons.js';
import { EFFORT_OPTIONS, RECIPE_CATEGORIES } from '../seed.js';
import { MUSCLES, muscleOf, inferRest } from '../muscles.js';
import { drive } from '../sync.js';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ago = (iso) => { if (!iso) return 'never'; const d = Math.round((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };
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
      <div><div class="mini-label">Rest · seconds</div><input class="field" inputmode="numeric" value="${esc(ex.rest || '')}" placeholder="${inferRest(ex)} (auto)" data-in="ex" data-field="rest" ${attrs}></div>
      <input class="field" value="${esc(ex.cue || '')}" placeholder="Cue (optional), e.g. superset with #5, pause at stretch" data-in="ex" data-field="cue" ${attrs}>
    </div>`;
}

export function settingsView(data, ui) {
  const sched = data.settings.schedule || { gymDays: [1, 2, 4, 5], gymTime: '18:00', runDays: [1, 4], runTime: '19:15', sundayPlan: true };
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
        <div class="label">Start rest automatically when you tick a set</div>
        <div class="seg" style="grid-template-columns:1fr 1fr;margin:8px 0 14px">
          <button class="${s.autoRest !== false ? 'on' : ''}" data-act="auto-rest" data-v="1">On</button>
          <button class="${s.autoRest === false ? 'on' : ''}" data-act="auto-rest" data-v="0">Off</button>
        </div>
        <p class="fine" style="margin-bottom:12px">Each exercise uses its own rest: about 2:30 for heavy squats and deadlifts, 2:00 for other compound lifts, 1:15 for isolation work. You can change any of them under the exercise above.</p>
        <div class="label">Manual timer default · seconds</div>
        <input class="field" style="margin-top:10px" inputmode="numeric" value="${esc(s.restSeconds || 60)}" aria-label="Rest target in seconds" data-in="setting" data-field="restSeconds">
        <div class="label" style="margin-top:14px">Sound when rest is up</div>
        <div class="seg" style="margin-top:8px">
          ${[['chime', 'Chime'], ['voice', 'Chime + voice'], ['off', 'Off']].map(([v, l]) => `<button class="${(s.restSound || 'chime') === v ? 'on' : ''}" data-act="rest-sound" data-v="${v}">${l}</button>`).join('')}
        </div>
        ${(s.restSound || 'chime') === 'voice' ? '<p class="fine" style="margin-top:8px">On iPhone the spoken cue pauses your music. Pick Chime to keep it playing.</p>' : ''}
        <div class="label" style="margin-top:14px">With music playing</div>
        <div class="seg" style="margin-top:8px">
          ${[['mix', 'Mix'], ['interrupt', 'Interrupt'], ['duck', 'Duck (beta)']].map(([v, l]) => `<button class="${(s.audioMode || 'mix') === v ? 'on' : ''}" data-act="audio-mode" data-v="${v}">${l}</button>`).join('')}
        </div>
        <p class="fine" style="margin-top:8px">${{
          mix: 'Mix: the cue plays on top of your music, which keeps going. Turn the ringer on, since the silent switch can mute it.',
          interrupt: 'Interrupt: loudest and most reliable, but it pauses your music. Press play in your music app afterwards.',
          duck: 'Duck: lowers your music like Google Maps. iOS 18 and later often plays this silently, so test it first.',
        }[s.audioMode || 'mix']}</p>
        <button class="btn block ghost" style="margin-top:8px" data-act="rest-test">Test sound (start your music first)</button>
        <p class="fine" style="margin-top:8px">Keep Ritual open; it can't ring while the phone is locked. These settings also apply to the Run tab's cues.</p>
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

      <div class="section-h"><h2>Reminders</h2></div>
      <div class="card">
        <p class="fine" style="margin-bottom:12px">Adds repeating events to your iPhone Calendar, which then reminds you 15 minutes before. Re-add after changing days (delete the old events first).</p>
        <div class="mini-label">Gym days</div>
        <div class="day-chips">${WD.map((l, i) => `<button class="${sched.gymDays.includes(i + 1) ? 'on' : ''}" data-act="sched-day" data-k="gymDays" data-d="${i + 1}">${l}</button>`).join('')}</div>
        <div class="grid2" style="margin:8px 0 12px"><div><div class="mini-label">Gym time</div><input class="field" type="time" value="${esc(sched.gymTime)}" data-in="sched-time" data-field="gymTime"></div>
          <div><div class="mini-label">Run time</div><input class="field" type="time" value="${esc(sched.runTime)}" data-in="sched-time" data-field="runTime"></div></div>
        <div class="mini-label">Run days</div>
        <div class="day-chips">${WD.map((l, i) => `<button class="${sched.runDays.includes(i + 1) ? 'on' : ''}" data-act="sched-day" data-k="runDays" data-d="${i + 1}">${l}</button>`).join('')}</div>
        <p class="fine" style="margin:8px 0">Plus a Sunday 5 pm “Plan the week” reminder.</p>
        <button class="btn block" data-act="add-calendar">Add to Calendar</button>
      </div>

      <div class="section-h"><h2>Data</h2></div>
      <div class="card stack">
        <p class="fine">Everything lives on this phone as one JSON file. Export it as a backup, or import it on another device.</p>
        <p class="fine">Last backup: <b>${esc(ago(data.meta?.lastBackupAt))}</b></p>
        <button class="btn block" data-act="export">Export to JSON</button>
        <button class="btn block ghost" data-act="import">Import from JSON</button>
      </div>

      <div class="section-h"><h2>Google Drive</h2></div>
      <div class="card stack">
        ${drive.state.fileId ? `<p class="fine">Connected · last synced <b>${esc(ago(drive.state.lastSyncAt))}</b>${drive.tokenValid() ? ' · auto-saving' : ' · tap Sync to reconnect'}</p>` : '<p class="fine">Keeps a copy of everything in <b>Ritual/ritual-data.json</b> in your Drive, saved automatically while connected. Ritual can only see that one file.</p>'}
        <div><div class="mini-label">Google OAuth client ID</div>
          <input class="field" value="${esc(data.settings.drive?.clientId || '')}" placeholder="xxxxxxxx.apps.googleusercontent.com" autocomplete="off" data-in="drive-client"></div>
        <button class="btn block" data-act="${drive.state.fileId ? 'drive-sync' : 'drive-connect'}">${drive.state.fileId ? 'Sync now' : 'Connect Google Drive'}</button>
        ${drive.state.fileId ? '<button class="btn block ghost" data-act="drive-disconnect">Disconnect</button>' : ''}
        <details class="fine"><summary>One-time setup (5 minutes)</summary>
          <ol>
            <li>Go to console.cloud.google.com and create a project (e.g. “Ritual”).</li>
            <li>APIs &amp; Services → Library → enable <b>Google Drive API</b>.</li>
            <li>OAuth consent screen → External → add your Gmail as a test user.</li>
            <li>Credentials → Create credentials → OAuth client ID → <b>Web application</b>.</li>
            <li>Authorised JavaScript origins: <b>https://sam-m9.github.io</b>.</li>
            <li>Copy the client ID, paste it above, then tap Connect.</li>
          </ol>
        </details>
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
