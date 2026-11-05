// Run with the app served on :8765 (python3 -m http.server 8765) and Playwright installed.
// node tests/sweep.js fresh   -> new-install pass
// node tests/sweep.js full    -> pass with history, runs, metrics and a workout in progress
// Full button/form/input sweep. Usage: node sweep.js <fresh|full>
const { chromium } = require('playwright');
const MODE = process.argv[2] || 'fresh';
const URL = 'http://localhost:8765/';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, acceptDownloads: true });
  await ctx.route('https://accounts.google.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:(c)=>({requestAccessToken:()=>c.callback({error:"access_denied"})}),revoke(){}}}}' }));
  await ctx.route('https://www.googleapis.com/**', (r) => r.fulfill({ status: 404, body: '' }));
  await ctx.route('https://www.youtube.com/**', (r) => r.fulfill({ body: 'ok' }));
  ctx.on('page', (pg) => { if (pg.url() !== 'about:blank' && !pg.url().startsWith(URL)) pg.close().catch(() => {}); });
  const p = await ctx.newPage();
  const problems = [];
  let current = '';
  p.on('pageerror', (e) => problems.push(`[${current}] pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g|net::ERR/.test(m.text())) problems.push(`[${current}] console: ${m.text()}`); });
  p.on('dialog', (d) => d.accept());
  p.on('filechooser', () => {});

  // ----- fixtures -----
  await p.goto(URL);
  const snapshot = await p.evaluate((mode) => {
    localStorage.clear();
    const st = window.ritual.store;
    st.reset();
    const d = st.data;
    if (mode === 'full') {
      const day = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
      const S = (ago, dayId, dayName, exs) => ({ id: 's' + ago + dayId, dayId, dayName, date: day(ago), startedAt: day(ago) + 'T17:00:00Z', finishedAt: day(ago) + 'T18:05:00Z',
        exercises: exs.map(([name, w, r, n]) => ({ exId: 'x', name, sets: Array(n).fill(0).map(() => ({ w, r })) })) });
      d.sessions = [
        S(16, 'd1', 'Upper A', [['Flat dumbbell press', 35, 10, 3], ['Lat pulldown', 100, 12, 3], ['EZ-bar curl', 50, 10, 2]]),
        S(14, 'd2', 'Legs', [['Back squat', 135, 6, 3], ['Seated leg curl', 80, 10, 4], ['Standing calf raise', 120, 12, 4]]),
        S(9, 'd3', 'Upper B', [['Overhead press', 65, 8, 3], ['Hanging leg raise', null, 12, 3]]),
        S(2, 'd1', 'Upper A', [['Flat dumbbell press', 40, 9, 3], ['Lat pulldown', 110, 10, 3]]),
      ];
      d.current = { d2: { startedAt: new Date().toISOString(), sets: { d2e1: [{ w: '145', r: '6', c: true, t: true }] } } };
      d.body.weight = [{ d: day(10), v: 183 }, { d: day(3), v: 182 }];
      d.body.waist = [{ d: day(10), v: 34 }];
      Object.assign(d.run, { started: true, week: 2, index: 1, log: [{ id: 'r1', date: day(3), week: 2, index: 0, title: '6 × run 1:30 / walk 2:00', activeSec: 1740, plannedSec: 1740, longestSec: 90, completed: true, breath: 'easy', effort: 4, pain: 0 }] });
      d.nutrition.recipes[0].fav = true; d.nutrition.recipes[0].made = 2;
      d.nutrition.groceries[0].done = true;
      d.meta = { lastBackupAt: new Date(Date.now() - 20 * 864e5).toISOString() };
    }
    st.commit();
    return localStorage.getItem('ritual-v1');
  }, MODE);

  async function load(ui = {}) {
    await p.evaluate(([snap, u]) => {
      localStorage.clear();
      localStorage.setItem('ritual-v1', snap);
      localStorage.setItem('ritual-ui', JSON.stringify({ open: u }));
      localStorage.removeItem('ritual-run-live');
    }, [snapshot, ui]);
    await p.goto(URL);
    await p.waitForTimeout(150);
  }

  async function tap(sel) {
    const l = p.locator(sel).first();
    await l.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await l.click({ timeout: 5000 });
  }

  // ----- screens: name -> how to get there -----
  const openAll = { 'sec:meal': true, 'sec:snack': true, 'sec:dessert': true, 'sec:prep': true, 'run:settings': true, 'learn:talk': true };
  const screens = [
    ['today', async () => {}],
    ['train', async () => { await p.click('[data-tab="train"]'); }],
    ['train-d2', async () => { await p.click('[data-tab="train"]'); await p.click('[data-day="d2"]'); }],
    ['train-collapsed', async () => { await p.click('[data-tab="train"]'); await p.click('[data-act="fold-all"]'); }],
    ['run', async () => { await p.click('[data-tab="run"]'); }],
    ['run-plan', async () => { await p.click('[data-tab="run"]'); if (await p.locator('[data-act="run-plan"]').count()) await p.locator('[data-act="run-plan"]').first().click(); else { await p.locator('[data-act="run-start-week"]').first().click(); await p.locator('[data-act="run-plan"]').first().click(); } }],
    ['run-level', async () => { await p.click('[data-tab="run"]'); if (!(await p.locator('[data-act="run-level"]').count())) await p.locator('[data-act="run-start-week"]').first().click(); await p.click('[data-act="run-level"]'); }],
    ['run-live', async () => { await p.click('[data-tab="run"]'); if (!(await p.locator('[data-act="run-go"]').count())) await p.locator('[data-act="run-start-week"]').first().click(); await p.click('[data-act="run-go"]'); }],
    ['run-log', async () => { await p.click('[data-tab="run"]'); if (!(await p.locator('[data-act="run-go"]').count())) await p.locator('[data-act="run-start-week"]').first().click(); await p.click('[data-act="run-go"]'); await p.click('[data-act="run-end"]'); await p.click('[data-act="run-end"]'); await p.waitForTimeout(150); await p.click('[data-act="rl-pick"][data-k="pain"][data-v="2"]'); }],
    ['nutrition', async () => { await p.click('[data-tab="nutrition"]'); }],
    ['nutrition-search', async () => { await p.click('[data-tab="nutrition"]'); await p.fill('[data-in="recipe-search"]', 'chicken'); }],
    ['progress', async () => { await p.click('[data-tab="progress"]'); }],
    ['progress-day', async () => { await p.click('[data-tab="progress"]'); if (await p.locator('[data-act="lift-view"][data-v="day"]').count()) await p.click('[data-act="lift-view"][data-v="day"]'); }],
    ['settings', async () => { await p.click('[data-act="open-settings"]'); }],
    ['recipe-open', async () => { await p.click('[data-tab="nutrition"]'); await tap('.recipe-h'); }],
    ['train-timer', async () => { await p.click('[data-tab="train"]'); await p.click('[data-act="timer-toggle"]'); }],
    ['train-timer-stopped', async () => { await p.click('[data-tab="train"]'); await p.click('[data-act="timer-toggle"]'); await p.waitForTimeout(1100); await p.click('[data-act="timer-toggle"]'); }],
    ['cook-timer', async () => { await p.click('[data-tab="nutrition"]'); await p.fill('[data-in="recipe-search"]', 'minutes'); await tap('.recipe-h'); await tap('[data-act="open-cook"]'); }],
    ['recipe-new', async () => { await p.click('[data-tab="nutrition"]'); await tap('[data-act="new-recipe"]'); }],
    ['recipe-edit', async () => { await p.click('[data-tab="nutrition"]'); await tap('.recipe-h'); await tap('[data-act="edit-recipe"]'); }],
    ['cook', async () => { await p.click('[data-tab="nutrition"]'); await tap('.recipe-h'); await tap('[data-act="open-cook"]'); }],
    ['swap', async () => { await p.click('[data-tab="train"]'); await p.locator('[data-act="open-swap"]').first().click(); }],
    ['summary', async () => { await p.click('[data-tab="train"]'); await tap('[data-act="toggle-set"]:not(.on)'); await p.click('[data-act="finish"]'); await p.waitForTimeout(150); }],
  ];

  const BAD_TEXT = /\bundefined\b|\bNaN\b|\[object Object\]|Infinity/;
  let clicks = 0;
  const seen = {};

  for (const [name, go] of screens) {
    current = name;
    await load(openAll);
    try { await go(); } catch (e) { problems.push(`[${name}] could not reach screen: ${e.message.split('\n')[0]}`); continue; }
    await p.waitForTimeout(100);
    const txt0 = await p.evaluate(() => document.body.innerText);
    if (BAD_TEXT.test(txt0)) problems.push(`[${name}] bad text on screen: ${txt0.match(BAD_TEXT)[0]} … ${txt0.slice(Math.max(0, txt0.search(BAD_TEXT) - 60), txt0.search(BAD_TEXT) + 20).replace(/\n/g, ' ')}`);
    const targets = await p.$$eval('[data-act]', (els) => els.map((e, i) => ({ i, act: e.dataset.act, key: JSON.stringify(e.dataset), vis: !!(e.offsetWidth || e.offsetHeight) && !e.disabled && !e.closest('[hidden]') })));
    const perAct = {};
    for (const t of targets) {
      if (!t.vis) continue;
      perAct[t.act] = (perAct[t.act] || 0) + 1;
      if (perAct[t.act] > 2) continue; // two instances of repeated buttons are enough
      current = `${name} › ${t.act}`;
      await load(openAll);
      try { await go(); } catch { continue; }
      await p.waitForTimeout(80);
      const loc = p.locator('[data-act]').nth(t.i);
      const same = await loc.evaluate((e) => JSON.stringify(e.dataset)).catch(() => null);
      if (same !== t.key) { problems.push(`[${current}] element moved between loads`); continue; }
      try {
        await loc.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
        await loc.click({ timeout: 3000 });
        if (t.act === 'run-end' || t.act === 'rl-discard' || t.act === 'reset') await loc.click({ timeout: 1500 }).catch(() => {});
        await p.waitForTimeout(250);
        clicks++;
        seen[t.act] = (seen[t.act] || 0) + 1;
      } catch (e) {
        problems.push(`[${current}] click failed: ${e.message.split('\n')[0]}`);
        continue;
      }
      const ok = await p.evaluate(() => !!document.querySelector('#app main, #app .run-live') || !!document.querySelector('#pocket:not([hidden])'));
      if (!ok) problems.push(`[${current}] app went blank`);
      const txt = await p.evaluate(() => document.body.innerText);
      if (BAD_TEXT.test(txt)) problems.push(`[${current}] bad text after click: ${txt.slice(Math.max(0, txt.search(BAD_TEXT) - 60), txt.search(BAD_TEXT) + 20).replace(/\n/g, ' ')}`);
    }
  }

  // ----- forms and inputs -----
  current = 'forms';
  const formTests = [
    ['add-groc', async () => { await p.click('[data-tab="nutrition"]'); await p.locator('[data-form="add-groc"] input').evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.fill('[data-form="add-groc"] input', 'Sweep test item (H-E-B)'); await tap('[data-form="add-groc"] button'); }, () => window.ritual.store.data.nutrition.groceries.some((g) => g.name === 'Sweep test item (H-E-B)')],
    ['log-weight (Today)', async () => { const f = p.locator('[data-form="log-metric"]'); if (await f.count()) { await f.locator('input').fill('181.5'); await f.locator('button').click(); } }, () => window.ritual.store.data.body.weight.some((e) => e.v === 181.5) || window.ritual.store.data.body.weight.at(-1)?.d === new Date().toISOString().slice(0, 10)],
    ['log-waist (Progress)', async () => { await p.click('[data-tab="progress"]'); await p.fill('[data-metric="waist"] input', '33.5'); await p.click('[data-metric="waist"] button'); }, () => window.ritual.store.data.body.waist.some((e) => e.v === 33.5)],
    ['recipe save', async () => { await p.click('[data-tab="nutrition"]'); await tap('[data-key="sec:meal"]'); await tap('[data-act="new-recipe"]'); await p.fill('#r-title', 'Sweep Recipe'); await p.fill('#r-ing', 'a\nb'); await p.fill('#r-steps', 'mix 2 minutes'); await tap('[data-form="recipe"] button[type=submit]'); }, () => window.ritual.store.data.nutrition.recipes.some((r) => r.title === 'Sweep Recipe')],
    ['custom swap', async () => { await p.click('[data-tab="train"]'); await p.locator('[data-act="open-swap"]').first().click(); await p.fill('[data-form="custom-swap"] input', 'Cable fly'); await p.click('[data-form="custom-swap"] button'); }, () => Object.values(window.ritual.store.data.current).some((c) => Object.values(c.swaps || {}).some((s) => s.name === 'Cable fly'))],
    ['run log save', async () => { await p.click('[data-tab="run"]'); if (!(await p.locator('[data-act="run-go"]').count())) await p.locator('[data-act="run-start-week"]').first().click(); await p.click('[data-act="run-go"]'); await p.click('[data-act="run-end"]'); await p.click('[data-act="run-end"]'); await p.waitForTimeout(150); await p.click('[data-act="rl-pick"][data-k="breath"][data-v="easy"]'); await p.click('[data-act="rl-pick"][data-k="effort"][data-v="4"]'); await p.fill('[name="km"]', '2.1'); await p.click('[data-form="run-log"] button[type=submit]'); }, () => window.ritual.store.data.run.log.some((r) => r.km === 2.1)],
    ['set inputs', async () => { await p.click('[data-tab="train"]'); await p.fill('[data-field="w"][data-i="0"]', '42.5'); await p.fill('[data-field="r"][data-i="0"]', '9'); }, () => Object.values(window.ritual.store.data.current).some((c) => Object.values(c.sets).some((l) => l[0]?.w === '42.5' && l[0]?.r === '9'))],
    ['settings inputs', async () => { await p.click('[data-act="open-settings"]'); await p.locator('[data-in="ex"][data-field="name"]').first().fill('Flat dumbbell press X'); await p.locator('[data-in="ex"][data-field="rest"]').first().fill('100'); await p.locator('[data-in="ex"][data-field="cue"]').first().fill('cue!'); await p.locator('[data-in="day"][data-field="note"]').first().fill('note!'); await p.locator('[data-in="setting"][data-field="proteinMin"]').fill('160'); await p.locator('[data-in="sched-time"][data-field="gymTime"]').fill('07:30'); await p.locator('[data-in="drive-client"]').fill('abc.apps.googleusercontent.com'); await p.locator('[data-field="effort"]').first().selectOption('2'); await p.locator('[data-field="muscle"]').first().selectOption('back'); }, () => { const d = window.ritual.store.data; const day = d.program.find((x) => x.exercises[0]?.name === 'Flat dumbbell press X' || x.exercises[0]?.cue === 'cue!'); const e = day?.exercises[0] || {}; return !!day && e.rest === 100 && e.cue === 'cue!' && day.note === 'note!' && d.settings.proteinMin === 160 && d.settings.schedule?.gymTime === '07:30' && d.settings.drive?.clientId === 'abc.apps.googleusercontent.com' && e.effort === '2' && e.muscle === 'back'; }],
    ['recipe JSON import', async () => { await p.click('[data-act="open-settings"]'); await p.fill('#recipe-json', '{"recipes":[{"cat":"dessert","title":"Sweep Dessert","protein":22,"ingredients":["x"],"steps":["y"]}],"groceries":[{"name":"Sweep Staple (Trader Joe\'s)"}]}'); await p.click('[data-act="import-recipes"]'); }, () => window.ritual.store.data.nutrition.recipes.some((r) => r.title === 'Sweep Dessert')],
  ];
  for (const [name, run, check] of formTests) {
    current = `form › ${name}`;
    await load();
    try { await run(); await p.waitForTimeout(250); } catch (e) { problems.push(`[${current}] ${e.message.split('\n')[0]}`); continue; }
    const pass = await p.evaluate(check).catch((e) => `error ${e.message}`);
    if (pass !== true) problems.push(`[${current}] result check failed (${pass})`);
  }

  // ----- persistence: everything survives a reload -----
  current = 'reload';
  await load();
  await p.click('[data-tab="train"]');
  await tap('[data-act="toggle-set"]:not(.on)');
  const before = await p.evaluate(() => localStorage.getItem('ritual-v1'));
  await p.reload(); await p.waitForTimeout(200);
  const after = await p.evaluate(() => JSON.stringify(window.ritual.store.data.current));
  if (!after.includes('"c":true')) problems.push('[reload] checked set lost after reload');

  console.log(`MODE=${MODE} screens=${screens.length} clicks=${clicks} actions=${Object.keys(seen).length} forms=${formTests.length}`);
  console.log('actions exercised:', Object.keys(seen).sort().join(', '));
  console.log(problems.length ? `PROBLEMS (${problems.length}):\n- ` + [...new Set(problems)].join('\n- ') : 'NO PROBLEMS');
  await b.close();
})();
