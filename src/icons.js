// Line icons: 1.7 stroke, round caps, currentColor.

const svg = (body, view = '0 0 32 32', extra = '') =>
  `<svg viewBox="${view}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const EQ_ICONS = {
  db: svg(
    '<rect x="4" y="11" width="4" height="10" rx="1.2"/><rect x="24" y="11" width="4" height="10" rx="1.2"/>' +
    '<rect x="8" y="13" width="3" height="6" rx="1"/><rect x="21" y="13" width="3" height="6" rx="1"/>' +
    '<path d="M11 16h10"/>'),
  bar: svg(
    '<path d="M2.5 16h27"/><rect x="6" y="9" width="3" height="14" rx="1"/><rect x="23" y="9" width="3" height="14" rx="1"/>' +
    '<rect x="9" y="11.5" width="2.5" height="9" rx="1"/><rect x="20.5" y="11.5" width="2.5" height="9" rx="1"/>'),
  cable: svg(
    '<path d="M6 4h20"/><path d="M9 4v24"/><circle cx="20" cy="8.5" r="2.5"/><path d="M20 11v9"/>' +
    '<path d="M16 20h8"/><path d="M17 20v3.5a3 3 0 0 0 6 0V20"/>'),
  machine: svg(
    '<rect x="5" y="4" width="22" height="24" rx="2.5"/><path d="M5 10h22"/><path d="M10 15h12"/>' +
    '<path d="M10 19h12"/><path d="M10 23h12"/><path d="M16 10v-3"/>'),
  body: svg(
    '<circle cx="16" cy="6" r="2.8"/><path d="M16 9.5v9"/><path d="M8 12.5l8 2 8-2"/>' +
    '<path d="M16 18.5l-4.5 9"/><path d="M16 18.5l4.5 9"/>'),
};

export const EQ_LABELS = { db: 'Dumbbell', bar: 'Barbell', cable: 'Cable', machine: 'Machine', body: 'Bodyweight' };

export const ICON = {
  gear: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    '0 0 24 24', 'stroke-width="2"'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '0 0 24 24', 'stroke-width="3"'),
  heart: svg('<path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"/>', '0 0 24 24', 'stroke-width="2"'),
  chevron: svg('<path d="M6 9l6 6 6-6"/>', '0 0 24 24', 'stroke-width="2"'),
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/></svg>',
};
