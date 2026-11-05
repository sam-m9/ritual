// Seed data for a fresh install. Everything here is editable in the app.
//
// Exercise fields:
//   name, sets (number), reps (string range), effort, eq, url, cue (short how-to shown under the name)
// Day fields: id, num, name, focus, note (coaching cue shown under the title), optional, noRir
//   effort: RIR string like "2" or "1-2"; "FAIL" = to failure on the last set only; "" = none
//   eq: "db" | "bar" | "cable" | "machine" | "body"

const ex = (id, name, sets, reps, effort, eq, cue = '') => ({ id, name, sets, reps, effort, eq, url: '', cue });

// Recomp / lean-bulk plan: 4 firm days + optional 5th. Upper-focused, legs once and hard.
// History is matched by exercise name, so names are kept stable when the movement is the same.
const PROGRESSION = 'Big lifts first, then arms, then delts and isolation. Compounds 1-3 RIR, isolation 0-1, last set to failure. Progression: hit the top of the rep range on every set, then add weight.';

export const SEED_PROGRAM = [
  {
    id: 'd1', num: 1, name: 'Upper A', focus: 'Push', optional: false, noRir: false, note: PROGRESSION,
    exercises: [
      ex('d1e1', 'Flat dumbbell press', 3, '6-10', '1-2', 'db'),
      ex('d1e9', 'Single-arm dumbbell row, to chest', 3, '8-12', '1-2', 'db', 'Elbow flared, pull toward the chest (upper back)'),
      ex('d1e3', 'Incline dumbbell press', 3, '8-12', '1-2', 'db'),
      ex('d1e4', 'Lat pulldown', 3, '10-12', '1-2', 'cable'),
      ex('d1e7', 'EZ-bar curl', 2, '8-12', 'FAIL', 'bar'),
      ex('d1e6', 'Cable triceps pushdown', 2, '10-15', 'FAIL', 'cable'),
      ex('d1e5', 'Dumbbell lateral raise', 3, '12-20', '0-1', 'db'),
      ex('d1e10', 'Reverse pec deck', 2, '15-20', '0-1', 'machine'),
    ],
  },
  {
    id: 'd2', num: 2, name: 'Legs', focus: 'One hard heavy day', optional: false, noRir: false,
    note: 'Squat and RDL get full rest and your best effort; the machine work buries the legs after.',
    exercises: [
      ex('d2e1', 'Back squat', 3, '5-8', '1-2', 'bar'),
      ex('d2e2', 'Romanian deadlift', 3, '6-10', '2', 'bar'),
      ex('d2e3', 'Leg press', 3, '10-15', '0-1', 'machine'),
      ex('d2e4', 'Seated leg curl', 4, '8-12', '0-1', 'machine', 'Lengthened partials on the last set · superset with leg extension'),
      ex('d2e7', 'Leg extension', 3, '10-15', '0-1', 'machine', 'Superset with seated leg curl'),
      ex('d2e5', 'Standing calf raise', 4, '8-15', '0-1', 'machine', 'Pause at the stretch'),
    ],
  },
  {
    id: 'd3', num: 3, name: 'Upper B', focus: 'Pull', optional: false, noRir: false, note: '',
    exercises: [
      ex('d3e1', 'Overhead press', 3, '6-10', '2', 'bar'),
      ex('d3e2', 'Weighted pull-up or lat pulldown', 3, '8-12', '1-2', 'body'),
      ex('d3e3', 'Seated cable row', 3, '10-12', '1-2', 'cable'),
      ex('d3e8', 'Single-arm dumbbell row', 3, '8-12', '1-2', 'db', 'To the hip, elbow tucked (lats)'),
      ex('d3e11', 'Preacher curl', 3, '10-15', 'FAIL', 'machine', 'Machine or EZ-bar'),
      ex('d3e12', 'EZ-bar skull crusher', 2, '10-15', 'FAIL', 'bar', 'Lower behind the head'),
      ex('d3e6', 'Face pull', 3, '15-20', '0-1', 'cable', 'Superset with hanging leg raise'),
      ex('d3e9', 'Hanging leg raise', 3, '10-15', '1', 'body', 'Superset with face pull'),
    ],
  },
  {
    id: 'd4', num: 4, name: 'Upper C', focus: 'Chest & arms', optional: false, noRir: false,
    note: "Flye cue: soft fixed elbow bend, hug and squeeze, don't let it become a press.",
    exercises: [
      ex('d4e1', 'Incline dumbbell press', 3, '8-12', '1-2', 'db'),
      ex('d4e8', 'EZ-bar skull crusher', 3, '10-15', 'FAIL', 'bar', 'Lower behind the head'),
      ex('d4e6', 'Cable curl', 3, '10-15', 'FAIL', 'cable'),
      ex('d4e3', 'Low-to-high cable fly', 3, '12-15', '0-1', 'cable', 'Upper chest'),
      ex('d4e7', 'Cable lateral raise', 3, '12-20', '0-1', 'cable'),
      ex('d4e4', 'Dumbbell lateral raise', 3, '12-20', '0-1', 'db'),
    ],
  },
  {
    id: 'd5', num: 5, name: 'Pump', focus: 'Weak points · optional', optional: true, noRir: true,
    note: 'True bonus, not required. Lateral raises first while fresh.',
    exercises: [
      ex('d5e1', 'Lateral raise', 3, '15-25', '', 'cable', 'Cable or dumbbell'),
      ex('d5e9', 'Reverse pec deck', 3, '15-20', '', 'machine'),
      ex('d5e3', 'Cable curl', 3, '12-15', '', 'cable'),
      ex('d5e4', 'Triceps pushdown', 3, '12-15', '', 'cable'),
      ex('d5e7', 'Leg extension', 2, '12-15', '', 'machine', 'Superset with seated leg curl'),
      ex('d5e8', 'Seated leg curl', 2, '12-15', '', 'machine', 'Superset with leg extension'),
      ex('d5e6', 'Cable crunch', 3, '12-15', '', 'cable'),
    ],
  },
];

export const SEED_MEALS = [
  { id: 'breakfast', name: 'Breakfast', portions: '2 palms protein · 1 fist veg or fruit · 1 cupped hand carbs · 1 thumb fat' },
  { id: 'lunch', name: 'Lunch', portions: '2 palms protein · 1-2 fists veg · 1-2 cupped hands carbs · 1 thumb fat' },
  { id: 'dinner', name: 'Dinner', portions: '2 palms protein · 1-2 fists veg · 1-2 cupped hands carbs · 1-2 thumbs fat' },
  { id: 'snack', name: 'Snack / Dessert', portions: '1-2 palms protein · 1 cupped hand carbs · 1 thumb fat' },
];

export const SEED_PORTIONS = [
  { label: 'Protein', value: '2 palms' },
  { label: 'Veg', value: '1-2 fists' },
  { label: 'Carbs', value: '1-2 cupped hands' },
  { label: 'Fat', value: '1-2 thumbs' },
];

export const RECIPE_CATEGORIES = [
  { id: 'meal', label: 'Meal ideas', single: 'Meal', add: 'Add meal idea' },
  { id: 'snack', label: 'Snack ideas', single: 'Snack', add: 'Add snack idea' },
  { id: 'dessert', label: 'Low-sugar desserts', single: 'Dessert', add: 'Add dessert' },
  { id: 'prep', label: 'Sauces & prep', single: 'Prep', add: 'Add sauce or prep' },
];

export const EFFORT_OPTIONS = ['', '0-1', '1', '1-2', '2', '3', 'FAIL'];
export const EQUIPMENT = ['db', 'bar', 'cable', 'machine', 'body'];
