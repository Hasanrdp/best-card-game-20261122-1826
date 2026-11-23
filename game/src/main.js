// Court of Embers: boot and input. Wires the engine to the table, plays the
// sounds, and takes mouse and keyboard alike: click a card or press 1-5 to
// play it, Space or Enter to end the turn, M to mute, R to start over.
// With ?shot=title|table|win|loss&seed=N the game stages that screenshot
// scene instead of waiting for a player.
import { GAME_NAME, SUITS } from './config.js';
import {
  PHASE_LOST,
  PHASE_PLAY,
  PHASE_TITLE,
  PHASE_WON,
  endTurn,
  newGame,
  playCard,
  startGame,
} from './engine.js';
import { buildTable, floatNumber, render } from './render.js';
import {
  isMuted,
  soundDraw,
  soundLoss,
  soundMend,
  soundPlay,
  soundStrike,
  soundWard,
  soundWin,
  toggleMute,
} from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const game = newGame(seed);
const root = document.getElementById('root');
document.title = GAME_NAME;

let nodes;
let opponentBusy = false;

function announce(event) {
  if (!event) return;
  if (event.type === 'strike') {
    soundStrike();
    floatNumber(nodes.floatLayer, '-' + event.hurt, event.by === 'player' ? 'damage-foe' : 'damage-you');
  }
  if (event.type === 'ward') soundWard();
  if (event.type === 'mend') {
    soundMend();
    floatNumber(nodes.floatLayer, '+' + event.healed, 'heal');
  }
}

let restartCount = 0;

const hooks = {
  muted: () => isMuted(),
  onMute: () => {
    toggleMute();
    render(game, nodes, hooks);
  },
  onRestart: () => {
    // A fresh shuffle each restart, still seeded, so replays stay honest.
    restartCount += 1;
    const fresh = newGame(seed + restartCount);
    Object.assign(game, fresh);
    render(game, nodes, hooks);
  },
  onStart: () => {
    startGame(game);
    soundDraw();
    render(game, nodes, hooks);
  },
  onAgain: () => {
    const fresh = newGame(game.seed + 1);
    Object.assign(game, fresh);
    startGame(game);
    render(game, nodes, hooks);
  },
  onPlayCard: (cardId) => {
    if (game.phase !== PHASE_PLAY || game.turn !== 'player' || opponentBusy) return;
    const event = playCard(game, game.player, cardId);
    if (!event) return;
    soundPlay();
    announce(event);
    render(game, nodes, hooks);
    if (game.phase === PHASE_WON) soundWin();
    if (game.phase === PHASE_LOST) soundLoss();
  },
  onEndTurn: () => {
    if (game.phase !== PHASE_PLAY || game.turn !== 'player' || opponentBusy) return;
    opponentBusy = true;
    render(game, nodes, hooks);
    // Sable's cards land one at a time, so the player can watch the answer.
    const events = endTurn(game);
    let index = 0;
    const step = () => {
      if (index < events.length) {
        announce(events[index]);
        index += 1;
        render(game, nodes, hooks);
        window.setTimeout(step, 450);
        return;
      }
      opponentBusy = false;
      soundDraw();
      render(game, nodes, hooks);
      if (game.phase === PHASE_WON) soundWin();
      if (game.phase === PHASE_LOST) soundLoss();
    };
    step();
  },
};

nodes = buildTable(root, hooks);

if (shotName) {
  stageShot(shotName, game);
  render(game, nodes, hooks);
  document.body.classList.add('shot');
} else {
  render(game, nodes, hooks);
}

// Keyboard: 1-5 plays the card in that seat, Space or Enter ends the turn,
// M mutes, R restarts, and Enter on the title screen takes your seat.
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === 'm') {
    hooks.onMute();
    return;
  }
  if (key === 'r') {
    hooks.onRestart();
    return;
  }
  if (game.phase === PHASE_TITLE) {
    if (key === 'enter' || key === ' ') hooks.onStart();
    return;
  }
  if (game.phase === PHASE_WON || game.phase === PHASE_LOST) {
    if (key === 'enter' || key === ' ') hooks.onAgain();
    return;
  }
  if (game.phase !== PHASE_PLAY || game.turn !== 'player' || opponentBusy) return;
  if (key >= '1' && key <= '5') {
    const card = game.player.hand[Number(key) - 1];
    if (card) hooks.onPlayCard(card.id);
    return;
  }
  if (key === ' ' || key === 'enter') {
    event.preventDefault();
    hooks.onEndTurn();
  }
});

// Keep the table honest about the suits it shows: a legend under the table.
const legend = document.createElement('div');
legend.className = 'suit-legend';
for (const suitName of Object.keys(SUITS)) {
  const suit = SUITS[suitName];
  const chip = document.createElement('span');
  chip.className = 'legend-chip';
  chip.style.setProperty('--suit-colour', suit.colour);
  chip.textContent = suit.glyph + ' ' + suit.label + ' beats ' + SUITS[suit.beats].label;
  legend.appendChild(chip);
}
root.appendChild(legend);
