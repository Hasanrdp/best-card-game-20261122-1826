// Court of Embers: the only randomness in the game. A tiny seeded generator
// (mulberry32) so a seed always deals the same hands, and the screenshots and
// the local trials reproduce exactly. The game never calls Math.random.
export function makeRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates with the seeded generator: same seed, same order, every time.
export function shuffle(cards, rng) {
  const deck = cards.slice();
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    const held = deck[index];
    deck[index] = deck[other];
    deck[other] = held;
  }
  return deck;
}

// Pick one of `count` options, uniformly, from the seeded stream.
export function pickIndex(rng, count) {
  return Math.floor(rng() * count);
}
