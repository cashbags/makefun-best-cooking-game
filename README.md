# EMBER & THYME — Night-Market Wok Kitchen

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/c/best-cooking-game-20261125-0137)
[![status](https://img.shields.io/badge/status-READY--HELD-green)](https://make.fun/c/best-cooking-game-20261125-0137)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**EMBER & THYME** is an original night-market cooking game: run a wok stall through a 3-day festival — **12 recipes, 6 stations, 18 ingredients, 3 rushes a day, 5 customer types**, combo scoring and day progression. Built for the [make.fun best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137?ref=qrg7fvky).

## How it plays

Click a pantry ingredient, click the station that prepares it (chop, wok, grill, steam), plate the finished cooking, and serve it to the matching order before its patience runs out. Serve fast for tips; chain serves inside the combo window to multiply payouts. Three hearts — a walked-away order costs one. Three rush hours per day double the order rate.

- **Keys:** 1–6 walk to a station · Space uses it · B bins the plate · Enter starts
- **Deterministic:** a seeded RNG deals every order, so the same seed replays the same service. Screenshots are real renders of the game's own code, staged by `game/src/shots.js` (`?shot=cover|title|mid|serve`).
- **Offline:** no network, no libraries, no audio files — sounds are WebAudio oscillators, art is canvas shapes drawn in `render.js`.

## Layout

| File | Job |
|---|---|
| `game/src/config.js` | every tunable number: timings, stations, palette |
| `game/src/random.js` | the seeded generator behind every roll |
| `game/src/recipes.js` | 18 ingredients, 12 recipes, 5 customer types |
| `game/src/orders.js` | the order board: spawning, patience, rushes |
| `game/src/stations.js` | the six-station cooking state machine |
| `game/src/world.js` | game state: chef, hands, plate, score, combo, days |
| `game/src/input.js` | mouse + keyboard → world verbs |
| `game/src/render.js` | every pixel: kitchen, board, stations, pantry |
| `game/src/audio.js` | WebAudio oscillator sounds |
| `game/src/shots.js` | deterministic screenshot scenes via a real autopilot |
| `game/src/main.js` | boot + fixed-step game loop |
| `main.ts` | hand-in program: copies `game/` + `screenshots/`, writes `dossier.json` |

## Run it

```sh
# play it locally (any static server; the kit's serve.ts works too)
python3 -m http.server 8080 --directory game
# hand it in (writes out/game, out/screenshots, out/dossier.json)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

`cover` — full kitchen mid-rush, plate READY TO SERVE · `title` — the stall's front · `mid` — a dish mid-assembly, grill running · `serve` — first dish served, +43 coins.
