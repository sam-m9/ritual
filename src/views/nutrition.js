import { esc } from '../util.js';
import { ICON } from '../icons.js';
import { RECIPE_CATEGORIES } from '../seed.js';

/** "Paneer (H-E-B / Whole Foods)" -> name with the stores on a small line underneath. */
function grocLabel(name) {
  const m = String(name).match(/^(.*\S)\s*\(([^()]*)\)\s*$/);
  if (!m || !/h-?e-?b|whole foods|trader joe|pantry|365/i.test(m[2])) return esc(name);
  return `${esc(m[1])}<span class="groc-store label">${esc(m[2])}</span>`;
}

const RATING = { A: 'Anchor', B: 'Variety', C: 'Backup' };

function recipeMeta(r) {
  const bits = [];
  const rating = String(r.notes || '').match(/^([ABC]) ·/);
  if (rating) bits.push(RATING[rating[1]]);
  if (r.protein) bits.push(`${r.protein}g P`);
  if (r.minutes) bits.push(`${r.minutes} min`);
  return bits.join(' · ');
}

function recipeItem(r, open) {
  const body = open ? `
    <div class="recipe-body">
      ${r.ingredients.length ? `<div class="label">Ingredients</div><ul>${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${r.steps.length ? `<div class="label">Steps</div><ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${r.notes ? `<div class="label">Notes</div><p>${esc(r.notes)}</p>` : ''}
      <div class="recipe-actions">
        <button class="btn" data-act="edit-recipe" data-id="${r.id}">Edit</button>
        ${r.ingredients.length ? `<button class="btn ghost" data-act="recipe-to-groc" data-id="${r.id}">+ Groceries</button>` : ''}
        ${r.url ? `<a class="btn ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="${esc(r.url)}" target="_blank" rel="noopener">Link ↗</a>` : ''}
      </div>
    </div>` : '';
  return `
    <div class="recipe">
      <button class="recipe-h" data-act="toggle-open" data-key="r:${r.id}" aria-expanded="${open}">
        <b>${esc(r.title || 'Untitled')}</b><span>${esc(recipeMeta(r))}</span>
      </button>
      ${body}
    </div>`;
}

function recipeSection(data, ui, cat) {
  const key = `sec:${cat.id}`;
  const open = !!ui.open[key];
  const items = data.nutrition.recipes.filter((r) => r.cat === cat.id);
  const body = open ? `
    <div class="collapse-body">
      ${items.length ? items.map((r) => recipeItem(r, !!ui.open[`r:${r.id}`])).join('') :
        '<p class="empty">Nothing here yet. Add the easy ones you actually make.</p>'}
      <button class="dashed on-card" data-act="new-recipe" data-cat="${cat.id}">+ ${esc(cat.add)}</button>
    </div>` : '';
  return `
    <section class="card collapse">
      <button class="collapse-h" data-act="toggle-open" data-key="${key}" aria-expanded="${open}">
        <h3>${esc(cat.label)}<span class="n">${items.length}</span></h3><span class="pm">${open ? '–' : '+'}</span>
      </button>
      ${body}
    </section>`;
}

export function nutritionView(data, ui) {
  const n = data.nutrition;
  const s = data.settings;
  const doneCount = n.meals.filter((m) => n.today.done[m.id]).length;

  const meals = n.meals.map((m) => {
    const on = !!n.today.done[m.id];
    return `
      <button class="card meal" data-act="toggle-meal" data-id="${m.id}" aria-pressed="${on}">
        <span class="check ${on ? 'on' : ''}">${ICON.check}</span>
        <span><h3>${esc(m.name)}</h3><p>${esc(m.portions)}</p></span>
      </button>`;
  }).join('');

  const portions = n.portions.map((p) => `
    <div class="card"><div class="label">${esc(p.label)}</div><div class="v">${esc(p.value)}</div></div>`).join('');

  // Shop by store: names carry the store in brackets, e.g. "Paneer (H-E-B / Whole Foods)".
  const STORES = [
    { id: 'heb', label: 'H-E-B', re: /h-?e-?b/i },
    { id: 'wf', label: 'Whole Foods', re: /whole foods|\b365\b/i },
    { id: 'tj', label: 'Trader Joe’s', re: /trader joe/i },
    { id: 'pantry', label: 'Pantry', re: /pantry/i },
  ];
  const storeOf = (g) => STORES.filter((st) => st.re.test(g.name)).map((st) => st.id);
  const active = STORES.some((st) => st.id === ui.grocStore) ? ui.grocStore : 'all';
  const shown = n.groceries.filter((g) => active === 'all' || storeOf(g).includes(active));
  const filters = n.groceries.length ? `
    <div class="chips-row groc-filter">
      <button class="${active === 'all' ? 'on' : ''}" data-act="groc-store" data-store="all">All ${n.groceries.length}</button>
      ${STORES.map((st) => {
        const c = n.groceries.filter((g) => storeOf(g).includes(st.id)).length;
        return c ? `<button class="${active === st.id ? 'on' : ''}" data-act="groc-store" data-store="${st.id}">${st.label} ${c}</button>` : '';
      }).join('')}
    </div>` : '';

  const groc = shown.map((g) => `
    <div class="groc ${g.done ? 'on' : ''}">
      <button class="check ${g.done ? 'on' : ''}" data-act="toggle-groc" data-id="${g.id}" aria-label="Toggle ${esc(g.name)}">${ICON.check}</button>
      <button class="groc-name" data-act="toggle-groc" data-id="${g.id}">${grocLabel(g.name)}</button>
      <button class="rm" data-act="remove-groc" data-id="${g.id}" aria-label="Remove ${esc(g.name)}">✕</button>
    </div>`).join('');

  const target = s.proteinMin && s.proteinMax && s.proteinMin !== s.proteinMax
    ? `${s.proteinMin}–${s.proteinMax}` : `${s.proteinMax || s.proteinMin || '—'}`;

  return `
    <div class="stack">
      <section class="card ink target">
        <div class="label">Daily protein target</div>
        <div class="big">${esc(target)}<small>g</small></div>
      </section>

      <div class="section-h"><h2>Meals today</h2><span class="count">${doneCount} / ${n.meals.length}</span></div>
      ${meals}

      <div class="section-h"><h2>Hand portions</h2></div>
      <div class="portions">${portions}</div>

      <div class="section-h"><h2>Cookbook</h2></div>
      ${RECIPE_CATEGORIES.map((c) => recipeSection(data, ui, c)).join('')}

      <div class="section-h"><h2>Grocery staples</h2>${n.groceries.length ? `<span class="count">${n.groceries.filter((g) => g.done).length} / ${n.groceries.length}</span>` : ''}</div>
      ${filters}
      <section class="card">
        ${groc || '<p class="empty">Your go-to list. Check things off as you shop; checks stay until you clear them.</p>'}
        <form class="add-row" data-form="add-groc">
          <input class="field" name="item" placeholder="Add a staple" autocomplete="off" enterkeyhint="done">
          <button class="btn" type="submit">Add</button>
        </form>
        ${n.groceries.some((g) => g.done) ? '<button class="undo" data-act="clear-groc">Uncheck all</button>' : ''}
      </section>
    </div>`;
}
