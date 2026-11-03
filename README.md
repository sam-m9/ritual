# Ritual

A personal, phone-first training and nutrition log. You add it to your iPhone Home Screen, and it works offline with no account and no backend. All data is one JSON file you own.

## What it does

- **Train**: a 4-day program (Upper A, Legs, Upper B + leg top-up, Upper C, plus an optional Pump day). For every set you get weight and reps fields and a check box. "Last time" shows what you lifted before. Checking a blank set fills it from last time. A day is finished by "Finish & log" (or "Finish early"). The app then opens on the **next day in the rotation**, so a missed gym day never breaks the order. The optional Pump day is skipped in the rotation; tap its pill when you want it.
- **Run**: a guided plan from about 1–3 minutes of running to 30 minutes non-stop (Foundation, weeks 1–9), then a 5K block (weeks 10–14) and a 10K block (weeks 15–24). Every session is time-based run-walk at talking pace. A full-screen guided timer speaks cues over your music ("Run. A minute and a half. Easy pace…"), with countdown beeps and a black pocket screen. After each run you log breathing, effort and pain, and the plan adapts:
  - good run: next session
  - gasping, effort 8+ or stopped early: repeat the session
  - pain above 3/10: 3 gentle ease-off sessions, then back to where you were
- **Nutrition**: protein target, a 4-meal checklist that resets each day, hand-portion guide, a cookbook (meal ideas, snacks, low-sugar desserts with ingredients, steps, protein and time), and a grocery staples list. "+ Groceries" on a recipe adds its ingredients to that list.
- **Progress**: one-tap bodyweight and waist logging, trend bars, sessions this week and in total, and per-lift history built from every finished session.
- **Settings**: edit the program (exercises, sets, reps, effort, equipment, video links), set the protein target, export or import JSON, and reset.

## Install on your phone

1. Deploy (below), then open the site in **Safari** on your iPhone.
2. Tap **Share → Add to Home Screen**.
3. Open Ritual once while online so it caches itself, including the Archivo font. After that it works offline.

## Deploy (GitHub Pages)

The repo deploys itself using `.github/workflows/pages.yml`.

1. In the repo on GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main` (or run the workflow by hand from the **Actions** tab).
3. The site will be at `https://sam-m9.github.io/ritual/`.

**Updating:** after changing any app file, bump `VERSION` in `sw.js`. Phones pick up the new version the next time the app is opened (sometimes it takes a second open).

## Run locally

There is no build step and no dependencies.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Your data

Everything is one JSON document, saved in the browser's localStorage (key `ritual-v1`). **Settings → Export** downloads `ritual-YYYY-MM-DD.json`. **Import** replaces local data with a file, after checking it.

```text
app, schema, updatedAt
settings   unit, waistUnit, proteinMin, proteinMax
program    [{ id, num, name, focus, optional, noRir, exercises: [{ id, name, sets, reps, effort, eq, url }] }]
current    in-progress workout per day: { [dayId]: { startedAt, sets: { [exerciseId]: [{ w, r, c }] } } }
sessions   every finished workout, every checked set: [{ id, dayId, dayName, date, startedAt, finishedAt, exercises: [{ exId, name, sets: [{ w, r }] }] }]
body       weight: [{ d, v }], waist: [{ d, v }]
nutrition  meals, portions, today (daily checklist), recipes, groceries
```

- `effort` is either an RIR range like `"2"` or `"1-2"`, `"FAIL"` (to failure on the last set), or empty.
- `eq` is one of `db`, `bar`, `cable`, `machine` or `body`.
- History is matched by **exercise name**, so "Dumbbell lateral raise" on Upper A and on Upper B share one history.
- `schema` is versioned. Older files are upgraded by `migrate()` in `src/store.js`, so old exports keep working.

> iOS can clear website storage for apps that go unused for weeks. Export now and then until Drive sync is in.

## Code map

```text
index.html            app shell + PWA meta
manifest.webmanifest  install metadata
sw.js                 offline cache (bump VERSION on changes)
styles/app.css        visual system (tokens at the top)
src/main.js           rendering, routing, every user action
src/store.js          the data document: defaults, migrations, persistence, change subscription
src/sync.js           where data can live: file export/import now, Google Drive plan
src/domain.js         pure training logic: progress, rotation, finishing a day, history
src/seed.js           starting program and nutrition templates
src/runplan.js        24-week running plan, coaching notes, how a logged run moves the plan
src/runner.js         guided-run engine: wall-clock timing, voice + beep cues, wake lock
src/views/*.js        one file per screen, each returns HTML
```

## Roadmap

**Next**
- **Google Drive sync.** The plan is written up in `src/sync.js`: Google sign-in with the `drive.file` scope, a single `Ritual/ritual-data.json` in your Drive, a debounced push after edits, a pull on open, and a backup copy made before any overwrite. It needs a Google Cloud OAuth client ID for the Pages URL.
- **Rest timer.** Starts when you check a set and buzzes at a target time (e.g. 2:00 on compound lifts, 1:00 on isolation work).
- **Progression hints.** When every set hits the top of the rep range at the target RIR, it suggests adding weight next time.

**Later**
- PR badges and estimated 1RM per lift; weekly volume per muscle group.
- Session notes, and swapping in an alternative exercise for the day without editing the program.
- Adding, reordering and deleting days; multiple programs or training blocks (e.g. a deload week).
- Protein tally per meal using the cookbook's protein numbers; a "what can I make" filter based on grocery staples.
- Weekly review card: sessions kept, bodyweight and waist trend, lifts that went up.
- Progress photos (stored in Drive, not on the phone).

## Running: how it works and why

- **iPhone limit:** a home-screen web app stops running code while the phone is locked, so the screen stays on during a run (wake lock) and you can switch to a black pocket screen. Voice cues use the phone's built-in speech and play over music. Keep the ringer on and Ritual open.
- **Timing comes from the clock, not a counter.** If iOS pauses the app, it catches up and re-announces the current segment. Closing the app mid-run resumes the run on reopen.
- **Principles:** run-walk progression in minutes, talking-pace effort, 3 runs a week, repeat sessions freely, long runs grow no more than about 10% over your longest run of the past month, a pain rule (more than 3/10 means ease off), and strength work for injury resistance.
- **Sources:**
  - [NHS Couch to 5K](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/)
  - [Runna beginner plans (2026)](https://www.runna.com/press/runna-introduces-updated-beginner-running-plans-for-2026)
  - [Garmin-RUNSAFE study on single-run spikes](https://health.medarbejdere.au.dk/en/display/artikel/everything-we-thought-about-running-injury-development-was-wrong-study-shows)
  - [GRONORUN trial on the 10% rule](https://research.rug.nl/en/publications/no-effect-of-a-graded-training-program-on-the-number-of-running-r/)
  - [Heiderscheit 2011, step rate and joint loading](https://uwnmbl.engr.wisc.edu/pubs/acsm10.pdf)
  - [Lauersen 2014, strength vs stretching](https://bjsm.bmj.com/content/48/11/871)
