// Court of Embers: Sable's brain. It is deliberately readable: the player can
// see the telegraphed card and work out what Sable will do, then counter it.
// The brain scores each affordable card and plays the best one, preferring
// a suit that beats the player's last suit and a second card of the same suit
// it just played (its own kindle chain), and it heals or wards when hurt.
import { ADVANTAGE_BONUS, KINDLE_BONUS, SUITS } from './config.js';

// Score one card for Sable right now. Strikes score their power, wards and
// mends score more the worse Sable's position is; the suit bonuses mirror
// the player's own kindle and advantage rules, so both sides play one game.
export function scoreCard(card, side, foe, lastSuit) {
  let score = card.power;
  if (card.kind === 'strike') {
    if (SUITS[card.suit].beats === foe.lastSuit) score += ADVANTAGE_BONUS;
    if (card.suit === lastSuit) score += KINDLE_BONUS;
    // A strike that ends the game is worth everything.
    if (card.power >= foe.life + foe.block) score += 100;
  }
  if (card.kind === 'ward') {
    const hurt = side.life < 12 ? 3 : 0;
    score = card.power * 0.8 + hurt;
    if (card.suit === lastSuit) score += KINDLE_BONUS * 0.8;
  }
  if (card.kind === 'mend') {
    const missing = side.maxLife - side.life;
    score = Math.min(card.power, missing) * 0.9;
    if (missing === 0) score = 0.5;
    if (card.suit === lastSuit) score += KINDLE_BONUS * 0.8;
  }
  // Cheap cards leave energy for a second play.
  score -= card.cost * 0.4;
  return score;
}

// The best affordable card in Sable's hand, or null when nothing is playable.
// `foe` is the player's side, so the brain can read the player's last suit.
export function chooseCard(side, foe, lastSuit) {
  let best = null;
  let bestScore = -Infinity;
  for (const card of side.hand) {
    if (card.cost > side.energy) continue;
    const score = scoreCard(card, side, foe, lastSuit);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}

// The card Sable will open with next turn, shown face-up in the intent slot
// so the player can answer it. It is the same choice the brain makes on its
// own turn, computed from the position as it stands.
export function telegraphIntent(side, foe) {
  return chooseCard(side, foe, null);
}
