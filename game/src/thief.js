// The thief: a nimble silhouette in a violet coat. Moves with WASD or the
// arrow keys, sneaks with Shift (slower, harder to spot), and bumps softly
// against walls and display cases instead of clipping through them.

import { clamp, pushCircleOutOfRect } from './geometry.js';
import { ROOM_HEIGHT, ROOM_WIDTH, WALL } from './level.js';

export const THIEF_RADIUS = 14;
export const WALK_SPEED = 185;
export const SNEAK_SPEED = 105;

export class Thief {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.r = THIEF_RADIUS;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.hasDiamond = false;
    this.lootValue = 0;
    this.lootCount = 0;
    this.stepPhase = 0;
  }

  move(dx, dy, dt, level) {
    if (dx === 0 && dy === 0) {
      this.moving = false;
      return;
    }
    const len = Math.hypot(dx, dy);
    const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const vx = (dx / len) * speed * dt;
    const vy = (dy / len) * speed * dt;
    this.x += vx;
    this.y += vy;
    this.facing = Math.atan2(dy, dx);
    this.moving = true;
    this.stepPhase += dt * (this.sneaking ? 7 : 11);
    this.collide(level);
  }

  collide(level) {
    this.x = clamp(this.x, WALL + this.r, ROOM_WIDTH - WALL - this.r);
    this.y = clamp(this.y, WALL + this.r, ROOM_HEIGHT - WALL - this.r);
    for (const wall of level.walls) pushCircleOutOfRect(this, wall);
    for (const cover of level.covers) pushCircleOutOfRect(this, cover);
  }

  collectLoot(item) {
    this.lootValue += item.value;
    this.lootCount += 1;
    if (item.main) this.hasDiamond = true;
  }
}
