// Body-part grouping for exercises. Each exercise belongs to one primary group.
// Logged sessions only store exercise names, so grouping is derived at display time:
// an explicit `muscle` on the program exercise wins, otherwise the name is matched below.

export const MUSCLES = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
  { id: 'other', label: 'Other' },
];

export const muscleLabel = (id) => MUSCLES.find((m) => m.id === id)?.label || 'Other';

// Order matters: more specific patterns first.
const RULES = [
  ['core', /leg raise|crunch|plank|pallof|woodchop|ab wheel|sit-?up|dead bug/i],
  ['shoulders', /lateral raise|rear-?delt|face pull|overhead press|shoulder press|military|arnold|upright row|reverse fly|reverse pec|rear delt/i],
  ['legs', /squat|deadlift|rdl|leg press|leg curl|leg extension|lunge|calf|hip thrust|glute|hack|step-?up|adductor|abductor/i],
  ['chest', /bench|chest press|dumbbell press|incline.*press|fly|flye|push-?up|pec/i],
  ['arms', /curl|triceps|tricep|\btri\b|pushdown|skull|dip|hammer/i],
  ['back', /row|pulldown|pull-?up|chin-?up|\blat\b|pullover|shrug/i],
];

export function inferMuscle(name) {
  const n = String(name || '');
  for (const [id, re] of RULES) if (re.test(n)) return id;
  return 'other';
}

/** Body part for a program exercise: explicit choice, else inferred from its name. */
export const muscleOf = (ex) => ex?.muscle || inferMuscle(ex?.name);

/** Swap options per body part: [name, equipment]. Names match program names where possible so history connects. */
export const ALTERNATIVES = {
  chest: [['Flat dumbbell press', 'db'], ['Incline dumbbell press', 'db'], ['Barbell bench press', 'bar'], ['Machine chest press', 'machine'], ['Low-to-high cable fly', 'cable'], ['High-to-low cable fly', 'cable'], ['Pec deck', 'machine'], ['Push-up', 'body']],
  back: [['Lat pulldown', 'cable'], ['Weighted pull-up or lat pulldown', 'body'], ['Seated cable row', 'cable'], ['Chest-supported row', 'machine'], ['Single-arm dumbbell row', 'db'], ['Machine row', 'machine'], ['T-bar row', 'bar'], ['Straight-arm pulldown', 'cable']],
  shoulders: [['Overhead press', 'bar'], ['Seated dumbbell shoulder press', 'db'], ['Machine shoulder press', 'machine'], ['Dumbbell lateral raise', 'db'], ['Cable lateral raise', 'cable'], ['Machine lateral raise', 'machine'], ['Rear-delt fly', 'db'], ['Reverse pec deck', 'machine'], ['Face pull', 'cable']],
  arms: [['EZ-bar curl', 'bar'], ['Cable curl', 'cable'], ['Incline dumbbell curl', 'db'], ['Hammer curl', 'db'], ['Preacher curl', 'machine'], ['Cable triceps pushdown', 'cable'], ['Overhead cable triceps extension', 'cable'], ['Skull crusher', 'bar'], ['Dumbbell overhead triceps extension', 'db']],
  legs: [['Back squat', 'bar'], ['Hack squat', 'machine'], ['Leg press', 'machine'], ['Goblet squat', 'db'], ['Bulgarian split squat', 'db'], ['Romanian deadlift', 'bar'], ['Dumbbell Romanian deadlift', 'db'], ['Seated leg curl', 'machine'], ['Lying leg curl', 'machine'], ['Leg extension', 'machine'], ['Standing calf raise', 'machine'], ['Seated calf raise', 'machine']],
  core: [['Hanging leg raise', 'body'], ['Cable crunch', 'cable'], ['Ab wheel rollout', 'body'], ['Captain’s chair knee raise', 'body'], ['Plank', 'body']],
  other: [],
};

const COMPOUND = /press|row|squat|deadlift|rdl|pulldown|pull-?up|chin-?up|lunge|split squat|leg press|hack|dip|thrust/i;

/** Default rest in seconds: heavy compounds 2:30, other compounds 2:00, isolation 1:15. */
export function inferRest(ex) {
  const name = String(ex?.name || '');
  if (/squat|deadlift|rdl/i.test(name) && ex?.eq === 'bar') return 150;
  if (COMPOUND.test(name) && !/lateral|fly|raise|curl|extension|pushdown/i.test(name)) return 120;
  return 75;
}
export const restOf = (ex) => Number(ex?.rest) || inferRest(ex);
