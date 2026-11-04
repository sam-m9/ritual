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
  ['shoulders', /lateral raise|rear-?delt|face pull|overhead press|shoulder press|military|arnold|upright row|reverse fly/i],
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
