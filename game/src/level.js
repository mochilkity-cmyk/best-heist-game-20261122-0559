// The Velvet Vault's floor plan: one neon gallery hall the thief crosses.
// All coordinates are room coordinates. The canvas draws a HUD strip above
// the room, so room y = canvas y - HUD_HEIGHT.

import { makeSeededRandom } from './rng.js';

export const ROOM_WIDTH = 1280;
export const ROOM_HEIGHT = 656;
export const HUD_HEIGHT = 64;
export const WALL = 16;

function jitter(random, amount) {
  return (random() - 0.5) * 2 * amount;
}

export function buildLevel(seed) {
  const random = makeSeededRandom(seed);

  // Solid walls: the outer shell plus two interior stubs that split the hall
  // into a left wing, a centre gallery and a right wing, each with gaps so
  // every room has at least two routes through it.
  const walls = [
    { x: 0, y: 0, w: ROOM_WIDTH, h: WALL }, // north shell
    { x: 0, y: ROOM_HEIGHT - WALL, w: ROOM_WIDTH, h: WALL }, // south shell
    { x: 0, y: 0, w: WALL, h: ROOM_HEIGHT }, // west shell
    { x: ROOM_WIDTH - WALL, y: 0, w: WALL, h: ROOM_HEIGHT }, // east shell
    // Interior stub A: hangs from the north wall, leaves a gap at its foot.
    { x: 420, y: WALL, w: 18, h: 210 },
    // Interior stub B: rises from the south wall, leaves a gap at its head.
    { x: 860, y: ROOM_HEIGHT - WALL - 210, w: 18, h: 210 },
    // Interior stub C: short divider in the centre gallery.
    { x: 600, y: 330, w: 150, h: 16 },
  ];

  // Cover: display pedestals and crates the thief can hide behind. Vision
  // cones stop at these, so reading the room means reading the cover.
  const covers = [
    { x: 150, y: 120, w: 96, h: 56, kind: 'pedestal', label: 'MARBLE' },
    { x: 300, y: 210, w: 70, h: 70, kind: 'pedestal', label: 'STATUE' },
    { x: 500, y: 120, w: 80, h: 56, kind: 'crate', label: 'CRATE' },
    { x: 760, y: 120, w: 80, h: 56, kind: 'crate', label: 'CRATE' },
    { x: 980, y: 120, w: 96, h: 56, kind: 'pedestal', label: 'MARBLE' },
    { x: 180, y: 380, w: 96, h: 56, kind: 'pedestal', label: 'VASES' },
    { x: 470, y: 430, w: 70, h: 70, kind: 'pedestal', label: 'STATUE' },
    { x: 700, y: 470, w: 96, h: 56, kind: 'crate', label: 'CRATE' },
    { x: 980, y: 400, w: 96, h: 56, kind: 'pedestal', label: 'VASES' },
    { x: 240, y: 540, w: 80, h: 56, kind: 'crate', label: 'CRATE' },
    { x: 1080, y: 540, w: 80, h: 56, kind: 'crate', label: 'CRATE' },
  ];

  // Loot: the Velvet Diamond is the prize; the side pieces are optional
  // scores for a thief willing to linger in the cones.
  const lootSpots = [
    { x: 640, y: 92, value: 5000, name: 'VELVET DIAMOND', kind: 'diamond', main: true },
    { x: 96, y: 92, value: 800, name: 'GOLD BARS', kind: 'gold', main: false },
    { x: 1184, y: 92, value: 1200, name: 'STARRY PAINTING', kind: 'painting', main: false },
    { x: 96, y: 580, value: 600, name: 'JADE IDOL', kind: 'idol', main: false },
  ];

  // Guard patrols: three loops, each with a seeded wobble so the seed
  // stages a different night while the shape stays readable.
  const guardRoutes = [
    {
      name: 'BRUNO',
      waypoints: [
        { x: 470 + jitter(random, 12), y: 90 },
        { x: 810 + jitter(random, 12), y: 90 },
        { x: 810 + jitter(random, 12), y: 250 },
        { x: 470 + jitter(random, 12), y: 250 },
      ],
      speed: 58,
    },
    {
      name: 'MIRA',
      waypoints: [
        { x: 240 + jitter(random, 12), y: 340 },
        { x: 1040 + jitter(random, 12), y: 340 },
        { x: 1040 + jitter(random, 12), y: 500 },
        { x: 240 + jitter(random, 12), y: 500 },
      ],
      speed: 52,
    },
    {
      name: 'OTTO',
      waypoints: [
        { x: 480 + jitter(random, 12), y: 600 },
        { x: 1000 + jitter(random, 12), y: 600 },
      ],
      speed: 64,
    },
  ];

  // Security cameras bolted to the walls, each sweeping its own arc.
  const cameraMounts = [
    {
      name: 'CAM 1',
      x: 60, y: 48,
      baseAngle: Math.PI * 0.32,
      sweep: 0.62,
      sweepSpeed: 0.55 + random() * 0.15,
      phase: random() * Math.PI * 2,
    },
    {
      name: 'CAM 2',
      x: 1220, y: 48,
      baseAngle: Math.PI * 0.68,
      sweep: 0.62,
      sweepSpeed: 0.5 + random() * 0.15,
      phase: random() * Math.PI * 2,
    },
    {
      name: 'CAM 3',
      x: 1220, y: 380,
      baseAngle: Math.PI,
      sweep: 0.55,
      sweepSpeed: 0.6 + random() * 0.15,
      phase: random() * Math.PI * 2,
    },
  ];

  return {
    walls,
    covers,
    lootSpots,
    guardRoutes,
    cameraMounts,
    // The thief slips in through the service door, bottom centre-left.
    spawn: { x: 330, y: 606 },
    entry: { x: 280, y: ROOM_HEIGHT - WALL, w: 100, h: WALL, label: 'SERVICE DOOR' },
    // The getaway van waits outside the east door, bottom right.
    getaway: { x: 1150, y: ROOM_HEIGHT - WALL, w: 114, h: WALL, label: 'GETAWAY VAN' },
  };
}
