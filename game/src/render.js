// Court of Embers: the table. Builds the DOM once and re-renders it from the
// engine state after every move, so what a screenshot shows is always what
// the rules just did. Cards are plain DOM: big numerals, suit glyphs in suit
// colours, and CSS slides and flips for the feel.
import { GAME_NAME, OPPONENT_NAME, PLAYER_NAME, SUITS, KINDS } from './config.js';
import { PHASE_LOST, PHASE_PLAY, PHASE_TITLE, PHASE_WON, cardBonuses, duelSummary } from './engine.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

// One face-up card. Cost sits top-left as ember pips, the suit glyph fills
// the middle in its colour, the name and kind sit below, and the value is
// the biggest number on the card — readable at thumbnail size.
export function cardElement(card, options) {
  const opts = options || {};
  const suit = SUITS[card.suit];
  const node = element('div', 'card suit-' + card.suit);
  node.dataset.cardId = String(card.id);
  if (opts.playable === false) node.classList.add('unplayable');
  if (opts.dimmed) node.classList.add('dimmed');
  if (opts.small) node.classList.add('small');
  if (opts.flipped) node.classList.add('flipped');
  const cost = element('div', 'card-cost');
  for (let index = 0; index < card.cost; index += 1) cost.appendChild(element('span', 'ember', '●'));
  node.appendChild(cost);
  node.appendChild(element('div', 'card-glyph', suit.glyph));
  node.appendChild(element('div', 'card-suit', suit.label));
  node.appendChild(element('div', 'card-name', card.name));
  const value = element('div', 'card-value', String(card.power + (opts.bonus || 0)));
  node.appendChild(value);
  node.appendChild(element('div', 'card-kind', KINDS[card.kind].label));
  if (opts.tags && opts.tags.length > 0) {
    node.appendChild(element('div', 'card-tags', opts.tags.join(' · ')));
  }
  return node;
}

// A face-down card: the court's seal on a dark back, nothing else.
export function cardBackElement() {
  const node = element('div', 'card card-back');
  node.appendChild(element('div', 'card-back-seal', '✦'));
  return node;
}

// A life bar with the number written on it, and a ward badge when block stands.
function lifeBar(side) {
  const wrap = element('div', 'lifebar');
  const fill = element('div', 'lifebar-fill');
  fill.style.width = Math.max(0, Math.round((side.life / side.maxLife) * 100)) + '%';
  if (side.life <= 8) fill.classList.add('low');
  wrap.appendChild(fill);
  wrap.appendChild(element('div', 'lifebar-text', side.life + ' / ' + side.maxLife));
  return wrap;
}

function sidePanel(name, side, isOpponent) {
  const panel = element('div', 'side' + (isOpponent ? ' opponent-side' : ' player-side'));
  const head = element('div', 'side-head');
  head.appendChild(element('div', 'side-name', name));
  if (side.block > 0) head.appendChild(element('div', 'block-badge', '🛡 ' + side.block));
  panel.appendChild(head);
  panel.appendChild(lifeBar(side));
  return panel;
}

function energyPips(side) {
  const pips = element('div', 'energy');
  pips.appendChild(element('span', 'energy-label', 'Embers'));
  for (let index = 0; index < side.maxEnergy; index += 1) {
    const pip = element('span', 'ember-pip' + (index < side.energy ? ' lit' : ''), '●');
    pips.appendChild(pip);
  }
  return pips;
}

// The whole table, built once. `hooks` carries the callbacks the table needs:
// onPlayCard(id), onEndTurn(), onStart(), onAgain().
export function buildTable(root, hooks) {
  const table = element('div', 'table');
  const topbar = element('div', 'topbar');
  topbar.appendChild(element('div', 'game-title', GAME_NAME));
  const topButtons = element('div', 'top-buttons');
  const muteButton = element('button', 'icon-button', '♪ Mute');
  muteButton.addEventListener('click', () => hooks.onMute());
  const restartButton = element('button', 'icon-button', '↺ Restart');
  restartButton.addEventListener('click', () => hooks.onRestart());
  topButtons.appendChild(muteButton);
  topButtons.appendChild(restartButton);
  topbar.appendChild(topButtons);
  table.appendChild(topbar);

  const opponentRow = element('div', 'opponent-row');
  const opponentSide = element('div', 'opponent-side-box');
  opponentRow.appendChild(opponentSide);
  const intentBox = element('div', 'intent-box');
  intentBox.appendChild(element('div', 'intent-label', 'Sable will play'));
  const intentCard = element('div', 'intent-card');
  intentBox.appendChild(intentCard);
  opponentRow.appendChild(intentBox);
  const opponentHand = element('div', 'opponent-hand');
  opponentRow.appendChild(opponentHand);
  table.appendChild(opponentRow);

  const middle = element('div', 'middle');
  const played = element('div', 'played');
  middle.appendChild(played);
  const log = element('div', 'log');
  middle.appendChild(log);
  const endTurn = element('button', 'end-turn', 'End turn ⏎');
  endTurn.addEventListener('click', () => hooks.onEndTurn());
  middle.appendChild(endTurn);
  table.appendChild(middle);

  const playerRow = element('div', 'player-row');
  const playerSide = element('div', 'player-side-box');
  playerRow.appendChild(playerSide);
  const playerHand = element('div', 'player-hand');
  playerHand.addEventListener('click', (event) => {
    const cardNode = event.target.closest('.card');
    if (cardNode && cardNode.dataset.cardId) hooks.onPlayCard(Number(cardNode.dataset.cardId));
  });
  playerRow.appendChild(playerHand);
  const energyBox = element('div', 'energy-box');
  playerRow.appendChild(energyBox);
  table.appendChild(playerRow);

  const overlay = element('div', 'overlay hidden');
  table.appendChild(overlay);
  const floatLayer = element('div', 'float-layer');
  table.appendChild(floatLayer);
  const status = element('p', 'status-line');
  status.id = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  table.appendChild(status);

  root.appendChild(table);
  return {
    table, muteButton, opponentSide, intentCard, opponentHand,
    played, log, endTurn, playerSide, playerHand, energyBox, overlay, floatLayer, status,
  };
}

// A damage or heal number that floats up over a side and fades away.
export function floatNumber(layer, text, kind) {
  const node = element('div', 'float-number ' + kind, text);
  layer.appendChild(node);
  window.setTimeout(() => node.remove(), 1400);
}

// Redraw the table from the engine state.
export function render(game, nodes, hooks) {
  const player = game.player;
  const foe = game.opponent;

  nodes.opponentSide.replaceChildren(sidePanel(OPPONENT_NAME, foe, true));
  nodes.playerSide.replaceChildren(sidePanel(PLAYER_NAME, player, false));

  nodes.opponentHand.replaceChildren();
  for (let index = 0; index < foe.hand.length; index += 1) {
    nodes.opponentHand.appendChild(cardBackElement());
  }
  const handCount = element('div', 'hand-count', foe.hand.length + ' in hand');
  nodes.opponentHand.appendChild(handCount);

  nodes.intentCard.replaceChildren();
  if (game.intent) {
    nodes.intentCard.appendChild(cardElement(game.intent, { small: true, playable: false }));
  } else {
    nodes.intentCard.appendChild(element('div', 'intent-empty', '—'));
  }

  nodes.played.replaceChildren();
  const recent = game.played.slice(-3);
  for (const entry of recent) {
    nodes.played.appendChild(cardElement(entry.card, {
      small: true, playable: false, bonus: entry.value - entry.card.power, tags: entry.tags,
    }));
  }
  if (recent.length === 0) {
    nodes.played.appendChild(element('div', 'played-empty', 'No cards played yet — play one from your hand.'));
  }

  nodes.log.replaceChildren();
  for (const line of game.log.slice(-4)) nodes.log.appendChild(element('div', 'log-line', line));

  nodes.playerHand.replaceChildren();
  player.hand.forEach((card, index) => {
    const { bonus, tags } = cardBonuses(game, player, card);
    const playable = game.phase === PHASE_PLAY && game.turn === 'player' && card.cost <= player.energy;
    const node = cardElement(card, { playable, bonus, tags });
    node.dataset.key = String(index + 1);
    node.title = 'Press ' + (index + 1) + ' to play';
    nodes.playerHand.appendChild(node);
  });

  nodes.energyBox.replaceChildren(energyPips(player));
  nodes.energyBox.appendChild(element('div', 'round-label', 'Round ' + game.round));
  nodes.energyBox.appendChild(element('div', 'deck-count', 'Deck ' + player.deck.length + ' · Discard ' + player.discard.length));

  nodes.endTurn.disabled = !(game.phase === PHASE_PLAY && game.turn === 'player');
  nodes.endTurn.textContent = game.turn === 'opponent' ? 'Sable is playing…' : 'End turn ⏎';
  nodes.muteButton.textContent = hooks.muted() ? '♪ Muted' : '♪ Mute';

  renderOverlay(game, nodes, hooks);
  nodes.status.textContent = statusText(game);
}

function statusText(game) {
  if (game.phase === PHASE_TITLE) return GAME_NAME + '. Press Enter to start the duel.';
  if (game.phase === PHASE_WON) return 'Victory. ' + OPPONENT_NAME + ' is beaten.';
  if (game.phase === PHASE_LOST) return 'Defeat. ' + OPPONENT_NAME + ' holds the court.';
  return 'Round ' + game.round + '. Your life ' + game.player.life + ', Sable ' + game.opponent.life + '.';
}

// The title, win and loss screens. Each one is a full overlay with the big
// text the screenshots need, the duel's story, and one button to go on.
function renderOverlay(game, nodes, hooks) {
  const overlay = nodes.overlay;
  if (game.phase === PHASE_PLAY) {
    overlay.classList.add('hidden');
    overlay.replaceChildren();
    return;
  }
  overlay.classList.remove('hidden');
  overlay.replaceChildren();
  const panel = element('div', 'overlay-panel');
  if (game.phase === PHASE_TITLE) {
    panel.appendChild(element('div', 'overlay-kicker', 'A DUEL OF SUITS'));
    panel.appendChild(element('h1', 'overlay-title', GAME_NAME));
    panel.appendChild(element('p', 'overlay-story',
      'Four suits hold the court — Ember, Thorn, Stone and Tide. Sable, the Warden, ' +
      'has dealt you in. Play your cards, kindle chains of one suit, and answer the card ' +
      'Sable telegraphs before it lands. Bring Sable to 0 life before yours runs out.'));
    const rules = element('div', 'overlay-rules');
    rules.appendChild(element('div', 'rule', '▲ Ember beats ◆ Thorn · ◆ beats ■ Stone · ■ beats ● Tide · ● beats ▲ Ember'));
    rules.appendChild(element('div', 'rule', 'Same suit twice in a turn kindles: +2 to the later card'));
    rules.appendChild(element('div', 'rule', 'Strike a telegraphed suit you beat: +2 power'));
    rules.appendChild(element('div', 'rule', 'Click a card or press 1–5 to play it · Space ends your turn'));
    panel.appendChild(rules);
    const start = element('button', 'big-button', '▶  Take your seat');
    start.addEventListener('click', () => hooks.onStart());
    panel.appendChild(start);
    panel.appendChild(element('div', 'overlay-foot', 'You 24 life · Sable 30 · first to 0 loses · no luck, only reads'));
  } else {
    const won = game.phase === PHASE_WON;
    const summary = duelSummary(game);
    panel.appendChild(element('div', 'overlay-kicker', won ? 'THE COURT IS YOURS' : 'THE COURT HOLDS'));
    panel.appendChild(element('h1', 'overlay-title ' + (won ? 'win' : 'loss'), won ? 'VICTORY' : 'DEFEAT'));
    panel.appendChild(element('p', 'overlay-story', won
      ? 'Sable bows low, and the four suits gutter out one by one. The embers are yours — the court remembers a duellist who read every telegraph.'
      : 'Sable takes the court as the embers dim. The suits are still there, waiting for a rematch — read the telegraph, kindle the chain, and come back.'));
    const stats = element('div', 'overlay-stats');
    stats.appendChild(element('div', 'stat', 'Rounds\n' + summary.rounds));
    stats.appendChild(element('div', 'stat', 'Damage dealt\n' + summary.damageDealt));
    stats.appendChild(element('div', 'stat', 'Cards played\n' + summary.cardsPlayed));
    stats.appendChild(element('div', 'stat', 'Life mended\n' + summary.heals));
    panel.appendChild(stats);
    const again = element('button', 'big-button', '↺  Duel again');
    again.addEventListener('click', () => hooks.onAgain());
    panel.appendChild(again);
    panel.appendChild(element('div', 'overlay-foot', 'Seed ' + game.seed + ' · Round ' + summary.rounds));
  }
  overlay.appendChild(panel);
}
