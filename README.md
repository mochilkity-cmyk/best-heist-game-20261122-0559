# The Velvet Vault — a neon museum heist

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mochilkity-cmyk/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mochilkity-cmyk/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

One night. One diamond. Three guards, three cameras, one very loud alarm.

**The Velvet Vault** is a complete top-down stealth heist game that runs
offline in a desktop browser from static files. You are the thief in the
violet coat, slipping through a neon gallery at night. Pocket the **Velvet
Diamond** from its case at the far end of the hall — and the gold bars, the
starry painting and the jade idol, if you dare linger — then slip out
through the **GETAWAY VAN** door before dawn breaks in 4:00.

## How to play

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move the thief |
| Shift (hold) | Sneak — slower, but spotted at shorter range |
| Q | Smoke puff (3 charges, −$50) — a cloud that blocks every vision cone for 6 s |
| E | EMP pulse (2 charges, −$150) — knocks every camera offline for 8 s |
| Mouse click | Toss a coin (3 coins, −$25) — the nearest guard goes to investigate the clink |
| P | Pause · M — mute · R — restart after a win or a catch |

**The alarm meter** (top right) climbs while any guard or camera has eyes
on you — faster up close, fastest under a camera — and falls while you stay
hidden. At **100%** the museum locks down and you are caught. A guard who
touches you catches you on the spot. Grabbing the diamond puts the hall on
**HEAT**: the alarm never falls below 25% and the guards walk faster.

**Read the room before you move.** Red cones are a guard's or a camera's
gaze; teal blocks are cover that stops every cone; gold is loot. Every room
has more than one route, and every gadget costs score — spend them like a
professional.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network at runtime: every file the game loads lives
under `game/`. The screenshots in `screenshots/` are real renders of the
game's own code in a browser (see `shots.json` for the staged scenes).

## Files

- `game/index.html` — the page; `game/src/main.js` — loop and wiring
- `game/src/level.js` — the gallery floor plan (seeded, so every seed stages a different night)
- `game/src/thief.js`, `guards.js`, `cameras.js`, `alarm.js`, `gadgets.js`, `loot.js` — the heist itself
- `game/src/geometry.js`, `rng.js` — cones, sight lines, seeded randoms
- `game/src/input.js`, `audio.js`, `render.js`, `shots.js` — controls, synth sound, drawing, staged shots
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
