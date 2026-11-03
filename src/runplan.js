// The running plan: time-based, built on run-walk intervals at conversational effort.
//
// Principles (see README "Running" for sources):
// - Minutes, not distance, until you can run 30 minutes non-stop.
// - Every run at talking pace; breathlessness means slow down or walk.
// - 3 runs a week on non-consecutive days; repeating a week is normal.
// - The long run never jumps more than ~10% past your longest run of the last month.
//
// Segment types: warm, run, walk, steady, stride, cool. Durations in seconds.

const M = 60;
const warm = () => ({ type: 'warm', sec: 5 * M });
const cool = () => ({ type: 'cool', sec: 5 * M });
const run = (min) => ({ type: 'run', sec: Math.round(min * M) });
const walk = (min) => ({ type: 'walk', sec: Math.round(min * M) });

/** n rounds of run/walk; the final walk is folded into the cool-down. */
function rounds(n, runMin, walkMin) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(run(runMin));
    if (i < n - 1) out.push(walk(walkMin));
  }
  return out;
}

/** Explicit sequence: alternating run/walk minutes, starting with a run. */
function ladder(...mins) {
  return mins.map((m, i) => (i % 2 === 0 ? run(m) : walk(m)));
}

const session = (title, main, extra = {}) => ({ title, segs: [warm(), ...main, cool()], ...extra });
const easy = (min, title = `Easy ${min} min`) => session(title, [run(min)], { kind: 'easy' });
const strides = (min) => session(`Easy ${min} min + 4 strides`, [
  run(min), walk(1),
  ...[0, 1, 2, 3].flatMap((i) => [{ type: 'stride', sec: 20 }, ...(i < 3 ? [walk(1)] : [])]),
], { kind: 'strides' });
const long = (min) => session(`Long run ${min} min`, [run(min)], { kind: 'long' });
const steady = (reps, min) => session(`Steady ${reps} × ${min} min`, [
  run(10),
  ...Array.from({ length: reps }, (_, i) => [{ type: 'steady', sec: min * M }, ...(i < reps - 1 ? [run(2)] : [])]).flat(),
  run(5),
], { kind: 'steady' });
const test = (min, label) => session(`${label} test · up to ${min} min`, [run(min)], { kind: 'test' });

export const PHASES = [
  { id: 'base', name: 'Foundation', goal: '30 min non-stop', from: 1, to: 9 },
  { id: '5k', name: '5K', goal: 'Run a 5K', from: 10, to: 14 },
  { id: '10k', name: '10K', goal: 'Run a 10K', from: 15, to: 24 },
];

export const PLAN = [
  { week: 1, focus: 'Learn the rhythm', runs: Array(3).fill(0).map(() => session('8 × run 1:00 / walk 1:30', rounds(8, 1, 1.5))) },
  { week: 2, focus: 'A little longer each run', runs: Array(3).fill(0).map(() => session('6 × run 1:30 / walk 2:00', rounds(6, 1.5, 2))) },
  { week: 3, focus: 'First 3-minute runs', runs: Array(3).fill(0).map(() => session('2 × (run 1:30 · walk 1:30 · run 3 · walk 3)', ladder(1.5, 1.5, 3, 3, 1.5, 1.5, 3))) },
  { week: 4, focus: 'Five minutes at a time', runs: Array(3).fill(0).map(() => session('Run 3 · 5 · 3 · 5 with walks', ladder(3, 1.5, 5, 2.5, 3, 1.5, 5))) },
  { week: 5, focus: 'Longer blocks', runs: [
    session('3 × run 5 / walk 3', rounds(3, 5, 3)),
    session('Run 8 · walk 5 · run 8', ladder(8, 5, 8)),
    session('Run 10 · walk 3 · run 10', ladder(10, 3, 10)),
  ] },
  { week: 6, focus: 'Fewer walk breaks', runs: [
    session('Run 5 · 8 · 5 with walks', ladder(5, 3, 8, 3, 5)),
    session('Run 10 · walk 3 · run 10', ladder(10, 3, 10)),
    session('Run 15 · walk 2 · run 10', ladder(15, 2, 10)),
  ] },
  { week: 7, focus: 'Continuous running', runs: [easy(20, 'Run 20 min non-stop'), easy(22, 'Run 22 min non-stop'), easy(25, 'Run 25 min non-stop')] },
  { week: 8, focus: 'Settle into it', runs: [easy(25, 'Run 25 min non-stop'), easy(28, 'Run 28 min non-stop'), easy(28, 'Run 28 min non-stop')] },
  { week: 9, focus: '30 minutes non-stop', runs: [easy(28, 'Run 28 min non-stop'), easy(30, 'Run 30 min non-stop'), easy(30, 'Run 30 min non-stop', ), ] },
  { week: 10, focus: 'Easy base + first long run', runs: [easy(25), easy(30), long(33)] },
  { week: 11, focus: 'Add strides', runs: [strides(30), easy(25), long(36)] },
  { week: 12, focus: 'Longest yet', runs: [easy(30), strides(30), long(40)] },
  { week: 13, focus: 'Lighter week, absorb it', runs: [easy(25), easy(25), long(35)] },
  { week: 14, focus: '5K week', runs: [easy(30), strides(25), test(40, '5K')] },
  { week: 15, focus: 'Build toward 10K', runs: [easy(30), strides(30), long(44)] },
  { week: 16, focus: 'Build', runs: [easy(35), easy(30), long(48)] },
  { week: 17, focus: 'First steady session', runs: [easy(30), steady(2, 6), long(52)] },
  { week: 18, focus: 'Lighter week', runs: [easy(30), strides(30), long(45)] },
  { week: 19, focus: 'Build', runs: [easy(35), steady(3, 6), long(56)] },
  { week: 20, focus: 'Build', runs: [easy(35), strides(35), long(60)] },
  { week: 21, focus: 'Build', runs: [easy(40), steady(3, 8), long(64)] },
  { week: 22, focus: 'Lighter week', runs: [easy(30), strides(30), long(55)] },
  { week: 23, focus: 'Longest run', runs: [easy(40), steady(3, 8), long(68)] },
  { week: 24, focus: '10K week', runs: [easy(30), strides(30), test(75, '10K')] },
];

export const LAST_WEEK = PLAN.length;

/** Used for a few sessions after a pain report: gentle and short. */
export const EASE_OFF = session('Ease-off · 6 × run 1:00 / walk 2:00', rounds(6, 1, 2), { kind: 'easeoff' });

/** Where someone starts, from how long they can run today. */
export const START_OPTIONS = [
  { week: 1, label: 'Under 1 minute' },
  { week: 2, label: '1 to 3 minutes' },
  { week: 4, label: '3 to 10 minutes' },
  { week: 7, label: '10 to 20 minutes' },
  { week: 10, label: '20+ minutes' },
];

export function weekOf(n) {
  return PLAN[Math.min(Math.max(n, 1), LAST_WEEK) - 1];
}

export function phaseOf(week) {
  return PHASES.find((p) => week >= p.from && week <= p.to) || PHASES.at(-1);
}

export function totalSec(s) {
  return s.segs.reduce((n, x) => n + x.sec, 0);
}

/** Longest single non-walking stretch in a session (consecutive run/steady/stride). */
export function longestRunSec(s) {
  let best = 0;
  let cur = 0;
  for (const x of s.segs) {
    if (x.type === 'run' || x.type === 'steady' || x.type === 'stride') cur += x.sec;
    else cur = 0;
    best = Math.max(best, cur);
  }
  return best;
}

/** The session due next given the run state. */
export function nextSession(run) {
  if (run.easeOff > 0) return { ...EASE_OFF, week: run.week, index: run.index, easeOff: true };
  const wk = weekOf(run.week);
  const index = Math.min(run.index, wk.runs.length - 1);
  return { ...wk.runs[index], week: wk.week, index, easeOff: false };
}

// ---------- coaching copy ----------

export const LEARN = [
  {
    id: 'talk', title: 'The talk test',
    body: 'Run at a pace where you could say a full sentence. Breathing heavier is fine; gasping is not. If you can’t talk, slow down or walk. Running out of breath almost always means you went too fast, not that you lack fitness.',
  },
  {
    id: 'slow', title: 'Why slow builds stamina',
    body: 'Easy running builds the engine: more capillaries, more mitochondria, a stronger heart. Your lungs and heart adapt in weeks, while bones and tendons take months. That gap is why going hard early ends in shin or calf pain. Keep about 80% of your running easy.',
  },
  {
    id: 'runwalk', title: 'Run-walk is the method',
    body: 'Walk breaks aren’t failure, they’re the training. Short runs with walks let you spend far more total time running than one exhausted run, which is what builds endurance. Repeating a week is normal and smart.',
  },
  {
    id: 'form', title: 'Steps and posture',
    body: 'Short, quick, light steps. Land with your foot under your hips, not out in front. Run tall with a slight lean from the ankles. Shoulders down, hands loose, arms swinging forward and back. Taking slightly quicker steps (5 to 10% more) measurably reduces load on your knees.',
  },
  {
    id: 'breath', title: 'Breathing',
    body: 'Breathe through your mouth and nose, deep into your belly. Many runners like a rhythm of in for 3 steps, out for 2. Use it if it feels natural, ignore it if it doesn’t. If you can’t control your breathing, the pace is the problem.',
  },
  {
    id: 'pain', title: 'The pain rule',
    body: '0 to 3 out of 10 and not getting worse: carry on. Above 3, getting worse as you run, or changing how you move: stop and walk. Still sore the next morning: ease off for a few days (the app does this for you). Sharp pain in one spot on a bone, or pain lasting more than 1 to 2 weeks: see a physio.',
  },
  {
    id: 'strength', title: 'Strength protects your legs',
    body: 'Strength training roughly halves overuse injuries; stretching doesn’t. Your Legs day already covers a lot. Add calf raises (straight and bent knee, 3 × 15) after two runs a week, plus single-leg work like split squats.',
  },
  {
    id: 'gym', title: 'Running after the gym',
    body: 'Run after your upper-body days (Day 1, 3 and 4), not after Legs. Lift first, then run. Keep the runs easy, since you’re already tired. Have water nearby and eat protein and carbs afterwards.',
  },
];

/**
 * Apply a logged run to the plan and return the coach's verdict.
 * - Pain above 3: ease-off sessions, plan position kept.
 * - Gasping, effort 8+, or stopped early: repeat the session (normal and smart).
 * - Otherwise: move to the next session.
 */
export function applyResult(run, entry) {
  if (entry.pain >= 4) {
    run.easeOff = 3;
    const serious = entry.pain >= 7;
    return {
      title: serious ? 'Rest first' : 'Easing off',
      body: serious
        ? `Pain at ${entry.pain}/10${entry.where ? ` (${entry.where.toLowerCase()})` : ''} is too much to run through. Rest until walking is pain-free. If it’s sharp, in one spot on a bone, or not easing within a week, see a physio. The next 3 sessions are gentle run-walk when you’re ready.`
        : `Pain at ${entry.pain}/10${entry.where ? ` (${entry.where.toLowerCase()})` : ''}. The next 3 sessions are short and gentle, then the plan picks up where you left off. If it’s still sore tomorrow morning, take an extra rest day.`,
    };
  }
  if (entry.easeOff) {
    run.easeOff = Math.max(0, run.easeOff - 1);
    return run.easeOff
      ? { title: 'Good', body: `${run.easeOff} gentle session${run.easeOff === 1 ? '' : 's'} left before the plan resumes.` }
      : { title: 'Back on plan', body: 'Pain-free ease-off done. Next run picks up where you were.' };
  }
  if (!entry.completed || entry.breath === 'hard' || entry.effort >= 8) {
    return {
      title: 'Same session next time',
      body: entry.breath === 'hard'
        ? 'Gasping means the pace was too quick. Next time slow right down, even to a shuffle. Repeating a session is exactly how stamina builds.'
        : 'That one was tough, so you’ll repeat it. Most people repeat a few sessions, and it’s how the plan sticks.',
    };
  }
  const wk = weekOf(run.week);
  run.index += 1;
  if (run.index >= wk.runs.length) {
    if (run.week < LAST_WEEK) { run.week += 1; run.index = 0; } else { run.index = wk.runs.length - 1; }
    return { title: `On to week ${run.week}`, body: `${weekOf(run.week).focus}. Keep every run at talking pace.` };
  }
  return { title: 'Next session unlocked', body: entry.breath === 'easy' ? 'You could talk the whole way, which is perfect. That’s the pace that builds you.' : 'Nicely done. Keep it at talking pace.' };
}
