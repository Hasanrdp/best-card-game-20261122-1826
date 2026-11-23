// Court of Embers: the deck. Builds a fresh 24-card deck from the recipe in
// config.js, deals hands, and reshuffles the discard pile when a deck runs
// dry, so a long duel never stalls.
import { DECK_RECIPE, HAND_SIZE } from './config.js';
import { shuffle } from './random.js';

let nextCardId = 1;

// One card object per recipe row, each with its own id so the table can track
// a card from the hand to the played pile.
export function buildDeck() {
  return DECK_RECIPE.map((row) => {
    const card = {
      id: nextCardId,
      name: row.name,
      suit: row.suit,
      kind: row.kind,
      cost: row.cost,
      power: row.power,
    };
    nextCardId += 1;
    return card;
  });
}

// A side's draw pile, discard pile and hand, freshly shuffled from one seed.
export function newSide(rng) {
  const deck = shuffle(buildDeck(), rng);
  const hand = [];
  for (let index = 0; index < HAND_SIZE; index += 1) hand.push(deck.pop());
  return { deck, discard: [], hand };
}

// Draw `count` cards, reshuffling the discard pile into the deck when needed.
// Returns how many were actually drawn.
export function drawCards(side, rng, count) {
  let drawn = 0;
  for (let index = 0; index < count; index += 1) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(side.discard, rng);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
    drawn += 1;
  }
  return drawn;
}

// Move a card from a hand to the discard pile by id.
export function discardCard(side, cardId) {
  const at = side.hand.findIndex((card) => card.id === cardId);
  if (at === -1) return null;
  const [card] = side.hand.splice(at, 1);
  side.discard.push(card);
  return card;
}
