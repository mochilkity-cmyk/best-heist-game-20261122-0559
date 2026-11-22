// Loot: the pieces on display. The Velvet Diamond is the prize the whole
// night is about; the side pieces are a gamble — extra score for a thief
// willing to linger inside the cones a little longer.

import { distance } from './geometry.js';

export const LOOT_GRAB_RADIUS = 34;

export class LootStash {
  constructor(lootSpots) {
    this.items = lootSpots.map((spot) => ({
      x: spot.x,
      y: spot.y,
      value: spot.value,
      name: spot.name,
      kind: spot.kind,
      main: spot.main,
      taken: false,
    }));
  }

  get diamond() {
    return this.items.find((item) => item.main);
  }

  get remainingValue() {
    return this.items.filter((item) => !item.taken).reduce((sum, item) => sum + item.value, 0);
  }

  // Grab anything the thief is standing close enough to pocket.
  // Returns the items just taken, so the caller can score and announce them.
  grabNear(thief) {
    const taken = [];
    for (const item of this.items) {
      if (!item.taken && distance(thief.x, thief.y, item.x, item.y) <= LOOT_GRAB_RADIUS) {
        item.taken = true;
        taken.push(item);
      }
    }
    return taken;
  }
}
