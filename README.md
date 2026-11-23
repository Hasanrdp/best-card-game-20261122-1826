[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Hasanrdp/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Hasanrdp/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Court of Embers

A duel of suits, built for [make.fun's best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).

Four suits hold the court — Ember, Thorn, Stone and Tide — and Sable, the Warden, has dealt you in. You start at 24 life, Sable at 30. Play cards from your hand, kindle chains of one suit, and answer the card Sable telegraphs before it lands. Bring Sable to 0 life before yours runs out.

## How it plays

- **Your hand** is five cards, drawn from a 24-card deck (six per suit). Each card costs embers; you gain 3 a turn, growing to 6 as the rounds pass, and draw two cards a turn.
- **Strike** cards hit Sable, **Ward** cards bank block that soaks the next hits, **Mend** cards heal you.
- **Kindle:** play two cards of the same suit in one turn and the later card gains +2.
- **Advantage:** Ember beats Thorn, Thorn beats Stone, Stone beats Tide, Tide beats Ember. A strike whose suit beats the suit of the card Sable has telegraphed gains +2.
- **The telegraph:** Sable's next card sits face-up in the intent slot, so every turn is a read — play the suit that beats it, or ward up when it is a big strike.
- Sable plays by the same rules and the same bonuses, and telegraphs honestly.

## Controls

- **Click a card** (or press **1–5**) to play it. **Space** or **Enter** ends your turn. **M** mutes, **R** restarts.
- Cards slide, flip and snap into place; damage floats up over the table; win and loss land with their own stingers.

## Play it

No build step, no network request. Serve `game/` with any static server and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are staged by the game itself (`game/src/shots.js`): `?shot=title|table|win|loss&seed=7` plays the real rules forward from a fresh game with a seeded autopilot, so every shot is a real frame of a real duel.

## Layout

- `game/index.html`, `game/style.css` — the table
- `game/src/config.js` — suits, deck recipe, tuning numbers
- `game/src/random.js` — the seeded generator (the game never calls `Math.random`)
- `game/src/deck.js` — building, dealing and reshuffling the deck
- `game/src/ai.js` — Sable's brain: it scores cards, kindles and reads your last suit
- `game/src/engine.js` — the rules: turns, kindle, advantage, win and loss
- `game/src/render.js` — the table, the cards, the title, win and loss screens
- `game/src/audio.js` — WebAudio bleeps, no audio files
- `game/src/shots.js` — the deterministic screenshot scenes
- `game/src/main.js` — boot and input
- `main.ts` — hands `game/` and `screenshots/` in with a dossier
