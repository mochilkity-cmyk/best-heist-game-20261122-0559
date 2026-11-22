// The Velvet Vault — game loop and wiring. One night, one diamond:
// the thief crosses a neon gallery, reads the guards' cones, spends
// gadgets at a cost, and slips out the getaway van before dawn.

import { Thief } from './thief.js';
import { Guard } from './guards.js';
import { SecurityCamera } from './cameras.js';
import { AlarmMeter } from './alarm.js';
import { GadgetBelt } from './gadgets.js';
import { LootStash } from './loot.js';
import { Input } from './input.js';
import { SoundBoard } from './audio.js';
import { buildLevel, HUD_HEIGHT, ROOM_HEIGHT } from './level.js';
import { drawScene } from './render.js';
import { makeSeededRandom, seedFromUrl } from './rng.js';
import { applyShot } from './shots.js';

const NIGHT_LENGTH = 240; // seconds until dawn breaks
const STEP = 1 / 60; // fixed simulation step, for stable play

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const seed = seedFromUrl(window.location.search);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const levelRandom = makeSeededRandom(seed + 7919);

function newGameState() {
  const level = buildLevel(seed);
  return {
    level,
    seed,
    thief: new Thief(level.spawn),
    guards: level.guardRoutes.map((route) => new Guard(route, levelRandom() * Math.PI * 2)),
    cameras: level.cameraMounts.map((mount) => new SecurityCamera(mount)),
    alarm: new AlarmMeter(),
    gadgets: new GadgetBelt(),
    loot: new LootStash(level.lootSpots),
    score: 0,
    spent: 0,
    timeBonus: 0,
    time: 0,
    timeLeft: NIGHT_LENGTH,
    state: 'title', // title | playing | won | caught
    paused: false,
    frozen: false, // staged ?shot= frames never advance
    message: '',
    messageUntil: 0,
    loseReason: '',
    muted: false,
  };
}

let game = newGameState();
const input = new Input(canvas);
const sounds = new SoundBoard();

function spendScore(amount) {
  game.spent += amount;
  game.score = Math.max(0, game.thief.lootValue - game.spent);
}

function announce(text, seconds = 2.5) {
  game.message = text;
  game.messageUntil = game.time + seconds;
}

function startHeist() {
  game = newGameState();
  game.state = 'playing';
  sounds.ensure();
  announce('The gallery sleeps. Move quiet, move quick.', 3);
}

function winHeist() {
  game.state = 'won';
  game.timeBonus = Math.round(game.timeLeft) * 10;
  game.score = game.thief.lootValue - game.spent + game.timeBonus;
  sounds.win();
}

function catchThief(reason) {
  game.state = 'caught';
  game.loseReason = reason;
  game.score = Math.max(0, game.thief.lootValue - game.spent);
  sounds.lose();
}

function spendGadgetKey(key) {
  if (key === 'q') {
    if (game.gadgets.useSmoke(game.thief.x, game.thief.y, game.time, spendScore)) {
      sounds.gadget();
      announce('Smoke puff — the cones see nothing for a moment.', 2);
    } else {
      announce('Out of smoke puffs!', 1.5);
    }
  } else if (key === 'e') {
    if (game.gadgets.useEmp(game.cameras, game.time, spendScore)) {
      sounds.gadget();
      announce('EMP pulse — every camera is dark for 8 seconds.', 2);
    } else {
      announce('Out of EMP pulses!', 1.5);
    }
  }
}

function update(dt) {
  if (game.state !== 'playing' || game.paused || game.frozen) return;

  game.time += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    catchThief('Dawn broke over the gallery — the crew left empty-handed.');
    return;
  }
  if (game.time > game.messageUntil) game.message = '';

  // Movement.
  game.thief.sneaking = input.sneaking;
  game.thief.move(input.moveX, input.moveY, dt, game.level);

  // Gadget keys and coin tosses.
  for (const key of input.consumePressed()) {
    if (key === 'q' || key === 'e') spendGadgetKey(key);
    else if (key === 'p') game.paused = !game.paused;
    else if (key === 'm') game.muted = sounds.toggleMute();
  }
  for (const click of input.consumeClicks()) {
    const roomX = click.x;
    const roomY = click.y - HUD_HEIGHT;
    if (roomY < 0 || roomY > ROOM_HEIGHT) continue;
    if (game.gadgets.throwCoin(roomX, roomY, game.time, game.guards, spendScore)) {
      sounds.coin();
      announce('Clink! A guard goes to look.', 1.5);
    } else {
      announce('Out of coins!', 1.5);
    }
  }

  game.gadgets.update(game.time);

  // Who can see the thief? Cameras spot fastest; a staring guard holds
  // their gaze while the thief stays in the cone.
  const smokes = game.gadgets.smokes;
  let seenBy = null;
  for (const camera of game.cameras) {
    if (camera.canSee(game.thief, game.time, game.level, smokes)) {
      seenBy = 'camera';
      break;
    }
  }
  for (const guard of game.guards) {
    const sees = guard.canSee(game.thief, game.time, game.level, smokes);
    if (sees && guard.state !== 'investigate') {
      guard.state = 'stare';
      if (!seenBy) seenBy = 'guard';
    } else if (!sees && guard.state === 'stare') {
      guard.state = 'patrol';
    }
  }
  if (seenBy) sounds.spottedTick(game.time);
  game.alarm.update(dt, seenBy, game.thief);
  if (game.alarm.tripped) {
    catchThief('The alarm hit 100% — the museum locked down and the guards closed in.');
    return;
  }

  // Guards walk, investigate, and catch a thief they can touch.
  for (const guard of game.guards) {
    guard.update(dt, game.time, game.level, smokes);
    if (guard.touches(game.thief)) {
      catchThief(`Guard ${guard.name} laid a hand on your shoulder. Caught red-handed.`);
      return;
    }
  }

  // Loot: pocket anything close enough, and mind the heat.
  for (const item of game.loot.grabNear(game.thief)) {
    game.thief.collectLoot(item);
    game.score = game.thief.lootValue - game.spent;
    if (item.main) {
      game.alarm.triggerHeat();
      for (const guard of game.guards) guard.speedBoost = true;
      sounds.diamond();
      announce('★ THE VELVET DIAMOND IS YOURS — RUN FOR THE VAN! ★', 3.5);
    } else {
      sounds.pickup();
      announce(`${item.name} pocketed — +$${item.value.toLocaleString('en-US')}`, 2);
    }
  }

  // The getaway: diamond in hand, thief on the van door.
  const gate = game.level.getaway;
  if (game.thief.hasDiamond &&
    game.thief.x >= gate.x - 10 && game.thief.x <= gate.x + gate.w + 10 &&
    game.thief.y >= ROOM_HEIGHT - 60) {
    winHeist();
  }
}

let lastTimestamp = 0;
let accumulator = 0;

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!lastTimestamp) lastTimestamp = timestamp;
  let elapsed = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (elapsed > 0.25) elapsed = 0.25; // tab was hidden; do not fast-forward
  accumulator += elapsed;
  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }
  drawScene(ctx, game);
}

function handleGlobalKeys(event) {
  const key = event.key.toLowerCase();
  if (game.state === 'title' && (key === 'enter' || key === ' ')) {
    startHeist();
  } else if ((game.state === 'won' || game.state === 'caught') && key === 'r') {
    startHeist();
  }
}

window.addEventListener('keydown', handleGlobalKeys);
canvas.addEventListener('mousedown', () => {
  if (game.state === 'title') startHeist();
});

// A staged ?shot= frame renders the museum at a frozen moment.
if (shotName && applyShot(game, shotName)) {
  game.frozen = true;
} else if (shotName) {
  game.state = 'title';
}

// Debug and play-test hook: the browser automation reads the live state.
window.__heist = {
  state: () => ({
    state: game.state,
    alarm: Math.round(game.alarm.value),
    alarmLevel: game.alarm.level,
    score: game.score,
    timeLeft: Math.round(game.timeLeft),
    thief: { x: Math.round(game.thief.x), y: Math.round(game.thief.y), hasDiamond: game.thief.hasDiamond },
    lootValue: game.thief.lootValue,
    guards: game.guards.map((guard) => ({ name: guard.name, x: Math.round(guard.x), y: Math.round(guard.y), state: guard.state })),
    camerasOffline: game.cameras.filter((camera) => camera.isOffline(game.time)).length,
    smokes: game.gadgets.smokes.length,
    paused: game.paused,
  }),
  start: () => startHeist(),
  teleport: (x, y) => {
    game.thief.x = x;
    game.thief.y = y;
  },
};

requestAnimationFrame(frame);
