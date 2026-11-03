// Seed data for a fresh install. Everything here is editable in the app.
//
// Exercise fields:
//   name, sets (number), reps (string range), effort, eq, url
// Day fields: id, num, name, focus, note (coaching cue shown under the title), optional, noRir
//   effort: RIR string like "2" or "1-2"; "FAIL" = to failure on the last set only; "" = none
//   eq: "db" | "bar" | "cable" | "machine" | "body"

const ex = (id, name, sets, reps, effort, eq) => ({ id, name, sets, reps, effort, eq, url: '' });

export const SEED_PROGRAM = [
  {
    id: 'd1', num: 1, name: 'Upper A', focus: 'Push-leaning', optional: false, noRir: false, note: '',
    exercises: [
      ex('d1e1', 'Flat dumbbell press', 3, '6-10', '2', 'db'),
      ex('d1e2', 'Chest-supported row', 3, '8-12', '1-2', 'machine'),
      ex('d1e3', 'Incline dumbbell press', 3, '8-12', '1-2', 'db'),
      ex('d1e4', 'Lat pulldown', 3, '10-12', '1-2', 'cable'),
      ex('d1e5', 'Dumbbell lateral raise', 3, '12-20', '0-1', 'db'),
      ex('d1e6', 'Cable triceps pushdown', 2, '10-15', 'FAIL', 'cable'),
      ex('d1e7', 'EZ-bar curl', 2, '8-12', 'FAIL', 'bar'),
    ],
  },
  {
    id: 'd2', num: 2, name: 'Legs', focus: 'Your one full lower day', optional: false, noRir: false,
    note: "Give this day everything, don't rush it. It's your main lower-body stimulus for the week.",
    exercises: [
      ex('d2e1', 'Back squat', 3, '5-8', '2', 'bar'),
      ex('d2e2', 'Romanian deadlift', 3, '8-10', '2', 'bar'),
      ex('d2e3', 'Leg press', 3, '10-15', '1', 'machine'),
      ex('d2e4', 'Seated leg curl', 3, '10-15', '0-1', 'machine'),
      ex('d2e5', 'Standing calf raise', 4, '10-15', '0-1', 'machine'),
      ex('d2e6', 'Hanging leg raise', 3, '10-15', '1', 'body'),
    ],
  },
  {
    id: 'd3', num: 3, name: 'Upper B', focus: 'Pull-leaning + leg top-up', optional: false, noRir: false,
    note: 'Leg press and leg curl are the leg top-up, your light second hit. Honest effort, no need to grind.',
    exercises: [
      ex('d3e1', 'Overhead press', 3, '6-10', '2', 'bar'),
      ex('d3e2', 'Weighted pull-up or lat pulldown', 3, '8-12', '1-2', 'body'),
      ex('d3e3', 'Seated cable row', 3, '10-12', '1-2', 'cable'),
      ex('d3e4', 'Leg press', 3, '10-15', '1-2', 'machine'),
      ex('d3e5', 'Seated leg curl', 2, '12-15', 'FAIL', 'machine'),
      ex('d3e6', 'Face pull', 3, '15-20', '0-1', 'cable'),
      ex('d3e7', 'Incline dumbbell curl', 2, '10-15', 'FAIL', 'db'),
    ],
  },
  {
    id: 'd4', num: 4, name: 'Upper C', focus: 'Chest & arms detail', optional: false, noRir: false,
    note: "The look day. Soft fixed elbow bend on the flyes, squeeze and hug, don't let it become a press. High-to-low finishes with hands crossing low at your waist; low-to-high finishes with hands meeting at upper-chest height.",
    exercises: [
      ex('d4e1', 'Incline dumbbell press', 3, '8-12', '1-2', 'db'),
      ex('d4e2', 'High-to-low cable fly', 3, '12-15', '0-1', 'cable'),
      ex('d4e3', 'Low-to-high cable fly', 3, '12-15', '0-1', 'cable'),
      ex('d4e4', 'Dumbbell lateral raise', 3, '12-20', '0-1', 'db'),
      ex('d4e5', 'Overhead cable triceps extension', 3, '10-15', 'FAIL', 'cable'),
      ex('d4e6', 'Cable curl', 3, '10-15', 'FAIL', 'cable'),
    ],
  },
  {
    id: 'd5', num: 5, name: 'Pump', focus: 'Weak points · optional', optional: true, noRir: true,
    note: 'On a week legs feel like they deserve more, swap this for a second short leg session instead.',
    exercises: [
      ex('d5e1', 'Lateral raise', 3, '15-25', '', 'db'),
      ex('d5e2', 'Face pull', 3, '15-20', '', 'cable'),
      ex('d5e3', 'Cable curl', 3, '12-15', '', 'cable'),
      ex('d5e4', 'Triceps pushdown', 3, '12-15', '', 'cable'),
      ex('d5e5', 'Rear-delt fly', 3, '15-20', '', 'db'),
      ex('d5e6', 'Cable crunch or hanging leg raise', 3, '12-15', '', 'cable'),
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
