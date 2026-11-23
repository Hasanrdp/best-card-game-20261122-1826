// Court of Embers: local trials. Runs the real engine headlessly over many
// seeds and reports what matters before anything is submitted:
//   - the strong pilot (reads the telegraph, kindles chains) wins most seeds
//   - the weak pilot (plays at random, passes often) loses most seeds
//   - every game ends inside the round cap, and the same seed always deals
//     the same duel
//   - the table screenshot scene stops mid-play with a full hand and an
//     intent on show
// Run: node trial.mjs
import { PHASE_LOST, PHASE_PLAY, PHASE_WON, newGame } from './game/src/engine.js';
import { stageShot } from './game/src/shots.js';

const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

function fingerprint(game) {
  return JSON.stringify({
    phase: game.phase,
    round: game.round,
    playerLife: game.player.life,
    foeLife: game.opponent.life,
    cardsPlayed: game.stats.cardsPlayed,
    damageDealt: game.stats.damageDealt,
    log: game.log,
  });
}

let strongWins = 0;
let strongUnfinished = 0;
let weakLosses = 0;
let weakUnfinished = 0;
const winSeeds = [];
const lossSeeds = [];

for (const seed of SEEDS) {
  const won = newGame(seed);
  stageShot('win', won);
  if (won.phase === PHASE_WON) { strongWins += 1; winSeeds.push(seed); }
  else if (won.phase === PHASE_PLAY) strongUnfinished += 1;

  const lost = newGame(seed);
  stageShot('loss', lost);
  if (lost.phase === PHASE_LOST) { weakLosses += 1; lossSeeds.push(seed); }
  else if (lost.phase === PHASE_PLAY) weakUnfinished += 1;
}

// Determinism: the same seed staged twice must be byte-identical.
let deterministic = true;
for (const seed of SEEDS) {
  const first = newGame(seed);
  stageShot('win', first);
  const second = newGame(seed);
  stageShot('win', second);
  if (fingerprint(first) !== fingerprint(second)) deterministic = false;
}

// The table scene: mid-duel, both sides alive, a hand to play, an intent.
const table = newGame(7);
stageShot('table', table);
const tableOk = table.phase === PHASE_PLAY
  && table.round === 4
  && table.player.hand.length >= 5
  && table.intent !== null
  && table.player.life > 0
  && table.opponent.life > 0;

console.log('strong pilot: ' + strongWins + '/20 wins, ' + strongUnfinished + ' unfinished (win seeds: ' + winSeeds.join(',') + ')');
console.log('weak pilot:   ' + weakLosses + '/20 losses, ' + weakUnfinished + ' unfinished (loss seeds: ' + lossSeeds.join(',') + ')');
console.log('deterministic across seeds 1-20: ' + deterministic);
console.log('table scene seed 7: phase=' + table.phase + ' round=' + table.round
  + ' hand=' + table.player.hand.length + ' intent=' + (table.intent ? table.intent.name : 'none')
  + ' life=' + table.player.life + ' vs ' + table.opponent.life + ' -> ' + (tableOk ? 'OK' : 'FAIL'));

const shot7win = newGame(7);
stageShot('win', shot7win);
const shot7loss = newGame(7);
stageShot('loss', shot7loss);
console.log('seed 7 win shot ends: ' + shot7win.phase + ' in round ' + shot7win.round);
console.log('seed 7 loss shot ends: ' + shot7loss.phase + ' in round ' + shot7loss.round);

const pass = strongWins >= 12 && weakLosses >= 12 && deterministic && tableOk
  && shot7win.phase === PHASE_WON && shot7loss.phase === PHASE_LOST;
console.log(pass ? 'TRIALS PASS' : 'TRIALS FAIL');
process.exit(pass ? 0 : 1);
