// Court of Embers: the rules. A duel is a state object and a handful of
// functions that move it: start a game, play a card, end the turn, let Sable
// answer, and settle a win or a loss. No DOM here, so the same engine drives
// the table, the screenshots and the local trials.
import {
  ADVANTAGE_BONUS,
  DRAW_PER_TURN,
  ENERGY_START,
  HAND_SIZE,
  KINDLE_BONUS,
  OPPONENT_ENERGY_BONUS,
  OPPONENT_LIFE,
  START_LIFE,
  SUITS,
  energyForRound,
} from './config.js';
import { chooseCard, telegraphIntent } from './ai.js';
import { discardCard, drawCards, newSide } from './deck.js';
import { makeRng } from './random.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_WON = 'won';
export const PHASE_LOST = 'lost';

// One side of the table: life, block, energy, cards, and the suit of the
// last card it played this turn (drives kindle chains and Sable's reading).
function freshSide(rng, life) {
  const side = newSide(rng);
  side.life = life;
  side.maxLife = life;
  side.block = 0;
  side.energy = ENERGY_START;
  side.maxEnergy = ENERGY_START;
  side.lastSuit = null;
  return side;
}

export function newGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    phase: PHASE_TITLE,
    round: 1,
    turn: 'player',
    player: freshSide(rng, START_LIFE),
    opponent: freshSide(rng, OPPONENT_LIFE),
    intent: null,
    log: [],
    played: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, heals: 0 },
    lastEvent: null,
  };
  game.player.energy = energyForRound(1);
  game.player.maxEnergy = game.player.energy;
  game.opponent.energy = energyForRound(1) + OPPONENT_ENERGY_BONUS;
  game.opponent.maxEnergy = game.opponent.energy;
  game.intent = telegraphIntent(game.opponent, game.player);
  return game;
}

export function startGame(game) {
  game.phase = PHASE_PLAY;
  game.log = ['The duel begins. Sable shuffles, and the court holds its breath.'];
  game.lastEvent = { type: 'start' };
}

// The bonus a card earns right now: +2 when its suit matches the suit just
// played this turn (kindle), and for strikes +2 more when its suit beats the
// suit Sable has telegraphed (advantage). Both are shown on the card.
export function cardBonuses(game, side, card) {
  let bonus = 0;
  const tags = [];
  if (side.lastSuit !== null && card.suit === side.lastSuit) {
    bonus += KINDLE_BONUS;
    tags.push('Kindled');
  }
  if (side === game.player && card.kind === 'strike' && game.intent !== null
    && SUITS[card.suit].beats === game.intent.suit) {
    bonus += ADVANTAGE_BONUS;
    tags.push('Advantage');
  }
  return { bonus, tags };
}

function soakDamage(target, amount) {
  const soaked = Math.min(target.block, amount);
  target.block -= soaked;
  const hurt = amount - soaked;
  target.life = Math.max(0, target.life - hurt);
  return { soaked, hurt };
}

// Resolve one card. Returns the event the table animates, or null when the
// card cannot be played (wrong phase, wrong turn, not in hand, too dear).
export function playCard(game, side, cardId) {
  if (game.phase !== PHASE_PLAY) return null;
  if (side === game.player && game.turn !== 'player') return null;
  const card = side.hand.find((held) => held.id === cardId);
  if (!card || card.cost > side.energy) return null;
  const { bonus, tags } = cardBonuses(game, side, card);
  const value = card.power + bonus;
  const foe = side === game.player ? game.opponent : game.player;
  side.energy -= card.cost;
  side.lastSuit = card.suit;
  discardCard(side, cardId);
  game.played.push({ card, value, tags, by: side === game.player ? 'player' : 'opponent' });

  let event;
  if (card.kind === 'strike') {
    const { soaked, hurt } = soakDamage(foe, value);
    if (side === game.player) game.stats.damageDealt += hurt;
    else game.stats.damageTaken += hurt;
    event = { type: 'strike', card, value, tags, soaked, hurt, by: side === game.player ? 'player' : 'opponent' };
  } else if (card.kind === 'ward') {
    side.block += value;
    event = { type: 'ward', card, value, tags, by: side === game.player ? 'player' : 'opponent' };
  } else {
    const healed = Math.min(value, side.maxLife - side.life);
    side.life += healed;
    if (side === game.player) game.stats.heals += healed;
    event = { type: 'mend', card, value, tags, healed, by: side === game.player ? 'player' : 'opponent' };
  }
  game.stats.cardsPlayed += 1;
  game.lastEvent = event;
  game.log.push(describeEvent(event, side));
  if (game.log.length > 5) game.log.shift();
  settle(game);
  return event;
}

function describeEvent(event) {
  const name = event.card.name;
  const suit = SUITS[event.card.suit].label;
  if (event.type === 'strike') {
    const target = event.by === 'player' ? 'Sable' : 'you';
    const soak = event.soaked > 0 ? ` (${event.soaked} soaked by ward)` : '';
    return `${name} · ${suit} ${event.value} hits ${target} for ${event.hurt}${soak}.`;
  }
  if (event.type === 'ward') return `${name} · ${suit} raises a ward of ${event.value}.`;
  return `${name} · ${suit} mends ${event.healed} life.`;
}

// End the player's turn: Sable plays while it has energy and a card worth
// playing, then the round turns over, both sides draw, energy refills, and a
// new intent is telegraphed. Returns the list of Sable's events for the table.
export function endTurn(game) {
  if (game.phase !== PHASE_PLAY || game.turn !== 'player') return [];
  game.turn = 'opponent';
  const events = [];
  let guard = 0;
  for (;;) {
    guard += 1;
    if (guard > 12) break;
    const card = chooseCard(game.opponent, game.player, game.opponent.lastSuit);
    if (!card) break;
    const event = playCard(game, game.opponent, card.id);
    if (!event) break;
    events.push(event);
    if (game.phase !== PHASE_PLAY) break;
  }
  if (game.phase === PHASE_PLAY) nextRound(game);
  return events;
}

function nextRound(game) {
  game.round += 1;
  game.turn = 'player';
  for (const side of [game.player, game.opponent]) {
    const bonus = side === game.opponent ? OPPONENT_ENERGY_BONUS : 0;
    side.energy = energyForRound(game.round) + bonus;
    side.maxEnergy = side.energy;
    side.block = 0;
    side.lastSuit = null;
  }
  drawCards(game.player, game.rng, DRAW_PER_TURN);
  drawCards(game.opponent, game.rng, DRAW_PER_TURN);
  while (game.player.hand.length > HAND_SIZE + 2) {
    game.player.discard.push(game.player.hand.pop());
  }
  game.played = [];
  game.intent = telegraphIntent(game.opponent, game.player);
  game.log.push(`Round ${game.round} — fresh embers, two cards drawn.`);
  if (game.log.length > 5) game.log.shift();
}

function settle(game) {
  if (game.opponent.life <= 0 && game.player.life <= 0) {
    game.phase = game.stats.damageDealt >= game.stats.damageTaken ? PHASE_WON : PHASE_LOST;
  } else if (game.opponent.life <= 0) {
    game.phase = PHASE_WON;
  } else if (game.player.life <= 0) {
    game.phase = PHASE_LOST;
  }
  if (game.phase === PHASE_WON) game.log.push('Sable bows. The Court of Embers is yours.');
  if (game.phase === PHASE_LOST) game.log.push('Sable takes the court. The embers dim — for now.');
}

// A one-line summary of the duel so far, for the win and loss screens.
export function duelSummary(game) {
  return {
    rounds: game.round,
    damageDealt: game.stats.damageDealt,
    damageTaken: game.stats.damageTaken,
    cardsPlayed: game.stats.cardsPlayed,
    heals: game.stats.heals,
  };
}
