// Guided run engine: wall-clock timing, voice coaching, beeps, screen wake lock.
//
// Timing is computed from timestamps, never from counting ticks, so if iOS pauses the page
// the run picks up at the right point and re-announces the current segment.
//
// iPhone limits (home-screen web apps): code stops while the phone is locked, so the screen
// must stay on during a run. We hold a wake lock and offer a black "pocket screen".

const LIVE_KEY = 'ritual-run-live';

// ---------- speech ----------

function duration(sec) {
  if (sec < 60) return `${sec} seconds`;
  const min = sec / 60;
  const whole = Math.floor(min);
  const half = min - whole >= 0.5;
  if (whole === 0) return '30 seconds';
  if (whole === 1 && !half) return '1 minute';
  if (half && whole === 1) return 'a minute and a half';
  return `${whole}${half ? ' and a half' : ''} minutes`;
}

const RUN_CUES = [
  'Easy pace. You should be able to talk in full sentences.',
  'Short, quick, light steps. Land under your hips.',
  'Drop your shoulders. Loose hands.',
  'Breathe deep. Try in for three steps, out for two, if it feels natural.',
  'Run tall, with a slight lean from your ankles.',
  'Slower than you think. Easy is the point.',
];
const WALK_CUES = [
  'Brisk walk. Let your breathing settle.',
  'Shake out your arms and shoulders.',
  'Deep breaths. Recover, then go again.',
];
const CHECK_INS = [
  'Check in. Can you talk? If not, slow down. Slower is fine.',
  'Drop your shoulders. Unclench your hands.',
  'Quick, light steps.',
  'If anything hurts more than three out of ten, walk.',
  'Breathe low into your belly.',
  'Relax your face and jaw.',
];

const LABEL = { warm: 'Warm up', run: 'Run', walk: 'Walk', steady: 'Steady', stride: 'Stride', cool: 'Cool down' };
export const segLabel = (t) => LABEL[t] || t;

/**
 * Build the timeline of cues for a session.
 * detail: 'full' (coaching), 'minimal' (just changes), 'off' (beeps only)
 */
export function buildCues(session, detail = 'full') {
  const cues = [];
  const segs = session.segs;
  const runIdx = segs.map((s, i) => (s.type === 'run' || s.type === 'steady' ? i : -1)).filter((i) => i >= 0);
  const lastRun = runIdx.at(-1);
  let t = 0;
  let rc = 0;
  let wc = 0;
  let ci = 0;
  const full = detail === 'full';

  segs.forEach((s, i) => {
    let text = '';
    if (s.type === 'warm') {
      text = full
        ? `${session.title}. ${duration(session.segs.reduce((n, x) => n + x.sec, 0))} in total. Every run today at talking pace. Warm up first: five minutes of brisk walking. Swing your arms and loosen up.`
        : 'Warm up. Five minutes brisk walking.';
    } else if (s.type === 'run') {
      const prevStride = segs.slice(0, i).some((x) => x.type === 'stride');
      text = `Run. ${duration(s.sec)}.`;
      if (full && !prevStride) text += ` ${i === lastRun && runIdx.length > 2 ? 'Last one. You’ve got this. ' : ''}${RUN_CUES[rc++ % RUN_CUES.length]}`;
    } else if (s.type === 'walk') {
      text = `Walk. ${duration(s.sec)}.`;
      if (full) text += ` ${WALK_CUES[wc++ % WALK_CUES.length]}`;
    } else if (s.type === 'steady') {
      text = `Steady effort. ${duration(s.sec)}.${full ? ' Comfortably hard. You can say short phrases, not full sentences.' : ''}`;
    } else if (s.type === 'stride') {
      text = `Stride. ${duration(s.sec)}.${full ? ' Quick and relaxed, not a sprint.' : ''}`;
    } else if (s.type === 'cool') {
      text = full
        ? 'Cool down. Five minutes of easy walking. Great work today. Keep walking longer if you have time.'
        : 'Cool down. Five minutes walking.';
    }
    if (detail !== 'off') cues.push({ t, key: `seg${i}`, seg: i, speak: text, beep: 2 });
    else cues.push({ t, key: `seg${i}`, seg: i, beep: 2 });

    // Within-segment cues
    if (detail !== 'off' && (s.type === 'run' || s.type === 'steady' || s.type === 'walk') && s.sec >= 240) {
      cues.push({ t: t + Math.floor(s.sec / 2), key: `half${i}`, speak: 'Halfway.' });
    }
    if (detail !== 'off' && s.sec >= 300 && s.type !== 'warm' && s.type !== 'cool') {
      cues.push({ t: t + s.sec - 60, key: `min${i}`, speak: 'One minute left.' });
    }
    if (full && s.type === 'run' && s.sec >= 480) {
      for (let k = 240; k < s.sec - 90; k += 240) {
        if (Math.abs(k - s.sec / 2) < 45) continue;
        cues.push({ t: t + k, key: `chk${i}-${k}`, speak: CHECK_INS[ci++ % CHECK_INS.length] });
      }
    }
    // Countdown pips before a change between run and walk
    if (i < segs.length - 1 && s.type !== 'warm' && s.sec >= 20) {
      for (const k of [3, 2, 1]) cues.push({ t: t + s.sec - k, key: `pip${i}-${k}`, beep: 1 });
    }
    t += s.sec;
  });
  cues.push({ t, key: 'done', speak: detail === 'off' ? '' : 'Session complete. Nice work. Log how it felt.', beep: 3, done: true });
  return cues.sort((a, b) => a.t - b.t);
}

// ---------- audio ----------

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx?.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(count = 1) {
  const ac = audio();
  if (!ac) return;
  for (let i = 0; i < count; i++) {
    const t0 = ac.currentTime + i * 0.18;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = count === 1 ? 880 : 1320;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + 0.16);
  }
}

function say(text, interrupt = false) {
  if (!text || !('speechSynthesis' in window)) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}

/**
 * Rest-timer alert: a bright two-tone chime repeated twice, then an optional spoken cue.
 * Plays over music (audio session set to 'transient' when the timer starts).
 */
export function restChime(withVoice = true) {
  const ac = audio();
  if (ac) {
    [0, 0.45].forEach((offset) => {
      [[1046.5, 0], [1568, 0.16]].forEach(([freq, dt]) => {
        const t0 = ac.currentTime + offset + dt;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g).connect(ac.destination);
        o.start(t0);
        o.stop(t0 + 0.55);
      });
    });
  }
  if (withVoice) setTimeout(() => say('Rest’s up. Next set.', true), 900);
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported on iPhone */ }
}

/** Must be called from a tap so iOS allows sound and speech for the rest of the run. */
export function unlockAudio() {
  try {
    // Ask iOS to treat our cues as short interruptions that duck other audio.
    if (navigator.audioSession) navigator.audioSession.type = 'transient';
  } catch { /* unsupported */ }
  audio();
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

// ---------- wake lock ----------

let wakeLock = null;
async function holdScreen() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch { wakeLock = null; }
}
function releaseScreen() {
  wakeLock?.release?.().catch(() => {});
  wakeLock = null;
}

// ---------- engine ----------

export const runner = {
  live: null,   // { session, startedAt, pausedAt, pausedMs, fired: [], detail, beeps }
  timer: null,
  onTick: null,
  onDone: null,

  start(session, { detail = 'full', beeps = true } = {}) {
    unlockAudio();
    this.live = { session, startedAt: Date.now(), pausedAt: null, pausedMs: 0, fired: [], detail, beeps };
    this.cues = buildCues(session, detail);
    this.save();
    holdScreen();
    this.loop();
  },

  /** Resume a run that was in progress when the app was closed or reloaded. */
  restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(LIVE_KEY) || 'null');
      if (!raw?.session) return false;
      this.live = raw;
      this.cues = buildCues(raw.session, raw.detail);
      this.loop();
      holdScreen();
      return true;
    } catch {
      return false;
    }
  },

  save() {
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(this.live)); } catch { /* full */ }
  },

  clear() {
    clearInterval(this.timer);
    this.timer = null;
    this.live = null;
    releaseScreen();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    try { localStorage.removeItem(LIVE_KEY); } catch { /* ignore */ }
    try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch { /* ignore */ }
  },

  elapsedMs() {
    const l = this.live;
    if (!l) return 0;
    const end = l.pausedAt || Date.now();
    return Math.max(0, end - l.startedAt - l.pausedMs);
  },

  totalSec() {
    return this.live ? this.live.session.segs.reduce((n, s) => n + s.sec, 0) : 0;
  },

  /** Current segment index, seconds into it, and seconds left in it. */
  position() {
    const segs = this.live.session.segs;
    let t = this.elapsedMs() / 1000;
    for (let i = 0; i < segs.length; i++) {
      if (t < segs[i].sec) return { i, into: t, left: segs[i].sec - t };
      t -= segs[i].sec;
    }
    return { i: segs.length - 1, into: segs.at(-1).sec, left: 0, finished: true };
  },

  paused() {
    return !!this.live?.pausedAt;
  },

  togglePause() {
    const l = this.live;
    if (!l) return;
    if (l.pausedAt) {
      l.pausedMs += Date.now() - l.pausedAt;
      l.pausedAt = null;
      say('Go.', true);
    } else {
      l.pausedAt = Date.now();
      say('Paused.', true);
    }
    this.save();
    this.tick();
  },

  /** Jump to the start of the next segment. */
  skip() {
    const l = this.live;
    if (!l) return;
    const { i } = this.position();
    const segs = l.session.segs;
    if (i >= segs.length - 1) return this.finish();
    const target = segs.slice(0, i + 1).reduce((n, s) => n + s.sec, 0) * 1000;
    const now = l.pausedAt || Date.now();
    l.startedAt = now - l.pausedMs - target;
    // Drop cues for the skipped part, then let the new segment announce itself.
    l.fired = this.cues.filter((c) => c.t * 1000 < target).map((c) => c.key);
    this.save();
    this.tick();
  },

  finish() {
    const l = this.live;
    if (!l) return;
    const result = {
      session: l.session,
      startedAt: l.startedAt,
      activeSec: Math.round(this.elapsedMs() / 1000),
      completed: this.elapsedMs() / 1000 >= this.totalSec() - 5,
    };
    this.clear();
    this.onDone?.(result);
  },

  loop() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 250);
    this.tick();
  },

  tick() {
    const l = this.live;
    if (!l) return;
    const nowSec = this.elapsedMs() / 1000;
    if (!l.pausedAt) {
      const due = this.cues.filter((c) => c.t <= nowSec && !l.fired.includes(c.key));
      if (due.length) {
        // After a long gap (page was suspended), skip stale cues and re-announce the current segment.
        const fresh = due.filter((c) => nowSec - c.t < 4);
        const stale = due.length - fresh.length;
        due.forEach((c) => l.fired.push(c.key));
        let toPlay = fresh;
        if (stale && !fresh.some((c) => c.seg !== undefined)) {
          const segCue = [...due].reverse().find((c) => c.seg !== undefined);
          if (segCue) toPlay = [segCue, ...fresh];
        }
        for (const c of toPlay) {
          if (c.beep && l.beeps) beep(c.beep);
          if (c.speak) say(c.speak, c.seg !== undefined || c.done);
        }
        this.save();
        if (toPlay.some((c) => c.done) || due.some((c) => c.done)) {
          setTimeout(() => this.finish(), 2500);
          clearInterval(this.timer);
        }
      }
    }
    this.onTick?.();
  },
};

// Re-take the wake lock and catch up when the app comes back to the foreground.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && runner.live) {
    holdScreen();
    runner.tick();
  }
});
