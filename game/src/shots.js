// Court of Embers: the screenshot scenes behind ?shot=title|table|win|loss.
// Each one plays the real rules forward from a fresh game, steered by a
// simple autopilot, so the frame is what a short duel really looks like and
// the same seed always gives the same frame. The strong pilot reads the
// telegraph and kindles chains; the weak pilot plays at random and passes
// often, the way a hurried player loses.
import { PHASE_PLAY, cardBonuses, endTurn, playCard, startGame } from './engine.js';

const MAX_ROUNDS = 40;

// Score a card the way a careful player would: strikes first, kindled and
// advantaged strikes most of all, then wards when hurt, then mends.
function strongScore(game, card) {
  const { bonus } = cardBonuses(game, game.player, card);
  const value = card.power + bonus;
  if (card.kind === 'strike') return value * 2 - card.cost;
  if (card.kind === 'ward') return game.player.life < 10 ? value : value * 0.4 - card.cost;
  if (card.kind === 'mend') {
    const missing = game.player.maxLife - game.player.life;
    return missing > 0 ? Math.min(value, missing) * 1.2 - card.cost : -99;
  }
  return 0;
}

function playStrongTurn(game) {
  for (;;) {
    let best = null;
    let bestScore = -Infinity;
    for (const card of game.player.hand) {
      if (card.cost > game.player.energy) continue;
      const score = strongScore(game, card);
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (!best || bestScore < -50) break;
    if (!playCard(game, game.player, best.id)) break;
    if (game.phase !== PHASE_PLAY) return;
  }
}

// The weak pilot: it plays the first affordable card only when the seeded
// stream says so, and never thinks about kindle or advantage.
function playWeakTurn(game) {
  for (const card of game.player.hand.slice()) {
    if (game.phase !== PHASE_PLAY) return;
    if (card.cost <= game.player.energy && game.rng() < 0.35) {
      playCard(game, game.player, card.id);
    }
  }
}

// Run full rounds with a pilot until `stop` says enough, or the duel ends.
function runRounds(game, pilot, stop) {
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    if (game.phase !== PHASE_PLAY) return;
    if (stop && stop(game, round)) return;
    pilot(game);
    if (game.phase !== PHASE_PLAY) return;
    endTurn(game);
  }
}

// Set `game` to the named scene (title, table, win or loss; any other name
// is title). The title scene stays on the title screen over a dealt table.
export function stageShot(name, game) {
  if (name === 'table') {
    startGame(game);
    runRounds(game, playStrongTurn, (staged, round) => round >= 3);
    return;
  }
  if (name === 'win') {
    startGame(game);
    runRounds(game, playStrongTurn, null);
    return;
  }
  if (name === 'loss') {
    startGame(game);
    runRounds(game, playWeakTurn, null);
    return;
  }
  // Title: deal the table and leave the overlay up.
  game.phase = 'title';
}
