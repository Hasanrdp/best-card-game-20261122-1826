// Court of Embers: every number that tunes the duel lives here, so a balance
// change is one edit and the rules stay readable in one place.
export const GAME_NAME = 'Court of Embers';
export const OPPONENT_NAME = 'Sable, Warden of Embers';
export const PLAYER_NAME = 'You';

export const START_LIFE = 24;
export const OPPONENT_LIFE = 30; // Sable is the Warden: tougher, and a longer duel
export const OPPONENT_ENERGY_BONUS = 1; // Sable draws one ember more a turn
export const HAND_SIZE = 5;
export const DRAW_PER_TURN = 2;
export const ENERGY_START = 3;
export const ENERGY_MAX = 6;

// One energy more every second round, up to the cap: short games stay brisk,
// long games let both sides play their big cards.
export function energyForRound(round) {
  return Math.min(ENERGY_START + Math.floor((round - 1) / 2), ENERGY_MAX);
}

// The four suits. Each one is told by colour AND shape, never by text alone,
// so the table reads at thumbnail size. The cycle reads Ember > Thorn > Stone
// > Tide > Ember: a strike whose suit beats the suit of the card Sable is
// about to play gains +2 power.
export const SUITS = {
  ember: { label: 'Ember', glyph: '▲', colour: '#e5484d', dark: '#8f1d22', beats: 'thorn' },
  thorn: { label: 'Thorn', glyph: '◆', colour: '#46a758', dark: '#1d5c2e', beats: 'stone' },
  stone: { label: 'Stone', glyph: '■', colour: '#e5a13a', dark: '#7a4d0d', beats: 'tide' },
  tide: { label: 'Tide', glyph: '●', colour: '#3e9bdc', dark: '#124a75', beats: 'ember' },
};
export const SUIT_ORDER = ['ember', 'thorn', 'stone', 'tide'];

export const KINDLE_BONUS = 2; // same suit twice in one turn: +2 to the later card
export const ADVANTAGE_BONUS = 2; // strike beats the telegraphed suit: +2 power

// Card kinds. A strike hurts, a ward banks block that soaks the next hits,
// a mend heals. Every card shows its cost (embers, top left), its kind and
// its value in one big numeral, so a screenshot tells the whole story.
export const KINDS = {
  strike: { label: 'Strike', verb: 'hits' },
  ward: { label: 'Ward', verb: 'wards' },
  mend: { label: 'Mend', verb: 'mends' },
};

// The deck: six cards per suit, twenty-four in all. Names are the court's own.
export const DECK_RECIPE = [
  { suit: 'ember', kind: 'strike', cost: 1, power: 3, name: 'Cinder Flick' },
  { suit: 'ember', kind: 'strike', cost: 2, power: 5, name: 'Hearth Roar' },
  { suit: 'ember', kind: 'strike', cost: 3, power: 8, name: 'Crownfire' },
  { suit: 'ember', kind: 'ward', cost: 1, power: 4, name: 'Ashen Veil' },
  { suit: 'ember', kind: 'ward', cost: 2, power: 7, name: 'Emberwall' },
  { suit: 'ember', kind: 'mend', cost: 2, power: 5, name: 'Warm Hearth' },
  { suit: 'thorn', kind: 'strike', cost: 1, power: 3, name: 'Briar Jab' },
  { suit: 'thorn', kind: 'strike', cost: 2, power: 5, name: 'Thicket Lash' },
  { suit: 'thorn', kind: 'strike', cost: 3, power: 8, name: 'Rose Tyrant' },
  { suit: 'thorn', kind: 'ward', cost: 1, power: 4, name: 'Bramble Net' },
  { suit: 'thorn', kind: 'ward', cost: 2, power: 7, name: 'Hedge Maze' },
  { suit: 'thorn', kind: 'mend', cost: 2, power: 5, name: 'Sap Spring' },
  { suit: 'stone', kind: 'strike', cost: 1, power: 3, name: 'Pebble Shot' },
  { suit: 'stone', kind: 'strike', cost: 2, power: 5, name: 'Quarry Slam' },
  { suit: 'stone', kind: 'strike', cost: 3, power: 8, name: 'Mountain Fall' },
  { suit: 'stone', kind: 'ward', cost: 1, power: 4, name: 'Palisade' },
  { suit: 'stone', kind: 'ward', cost: 2, power: 7, name: 'Bastion' },
  { suit: 'stone', kind: 'mend', cost: 2, power: 5, name: 'Deep Spring' },
  { suit: 'tide', kind: 'strike', cost: 1, power: 3, name: 'Spray Cut' },
  { suit: 'tide', kind: 'strike', cost: 2, power: 5, name: 'Undertow' },
  { suit: 'tide', kind: 'strike', cost: 3, power: 8, name: 'Tidal Court' },
  { suit: 'tide', kind: 'ward', cost: 1, power: 4, name: 'Mist Curtain' },
  { suit: 'tide', kind: 'ward', cost: 2, power: 7, name: 'Breakwater' },
  { suit: 'tide', kind: 'mend', cost: 2, power: 5, name: 'Still Pool' },
];

export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 800;
