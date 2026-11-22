// Guards: they walk their patrol loops, sweep their vision cones, pause to
// stare at the thief while they can see them, and march off to investigate
// a thrown coin. A guard who touches the thief ends the night.

import { angleDifference, clamp, distance, pointInVisionCone, segmentHitsCircle, segmentHitsRect } from './geometry.js';

export const GUARD_CONE_RANGE = 225;
export const GUARD_CONE_HALF_ANGLE = 0.62;
export const GUARD_CATCH_RADIUS = 26;

export class Guard {
  constructor(route, sweepPhase = 0) {
    this.name = route.name;
    this.waypoints = route.waypoints;
    this.baseSpeed = route.speed;
    this.x = route.waypoints[0].x;
    this.y = route.waypoints[0].y;
    this.targetIndex = 1;
    this.facing = 0;
    // The cone's sweep phase comes from the level seed, never Math.random,
    // so the same seed always stages the same night.
    this.sweepPhase = sweepPhase;
    this.state = 'patrol'; // patrol | investigate | stare
    this.investigatePoint = null;
    this.investigateWait = 0;
    this.stareTime = 0;
    this.walkPhase = 0;
  }

  get speed() {
    return this.state === 'investigate' ? this.baseSpeed * 1.5 : this.baseSpeed;
  }

  // The cone sweeps gently side to side as the guard walks, so the player
  // must read the sweep, not just the guard's position.
  coneAngle(time) {
    return this.facing + Math.sin(time * 0.9 + this.sweepPhase) * 0.42;
  }

  update(dt, time, level, smokes) {
    if (this.state === 'investigate') {
      this.updateInvestigate(dt, level);
    } else {
      this.updatePatrol(dt);
    }
    this.walkPhase += dt * 6;
  }

  updatePatrol(dt) {
    const target = this.waypoints[this.targetIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      return;
    }
    const step = this.speed * dt;
    const move = Math.min(step, d);
    this.x += (dx / d) * move;
    this.y += (dy / d) * move;
    this.facing = Math.atan2(dy, dx);
  }

  updateInvestigate(dt, level) {
    if (!this.investigatePoint) {
      this.state = 'patrol';
      return;
    }
    const dx = this.investigatePoint.x - this.x;
    const dy = this.investigatePoint.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      const step = this.speed * dt;
      const move = Math.min(step, d);
      this.x += (dx / d) * move;
      this.y += (dy / d) * move;
      this.facing = Math.atan2(dy, dx);
      return;
    }
    // Arrived: look around, then give up and resume the patrol.
    this.investigateWait -= dt;
    this.facing += dt * 1.4;
    if (this.investigateWait <= 0) {
      this.state = 'patrol';
      this.investigatePoint = null;
    }
  }

  sendToInvestigate(point) {
    this.investigatePoint = { x: point.x, y: point.y };
    this.investigateWait = 3;
    this.state = 'investigate';
  }

  // Can this guard see the thief right now? Cones stop at walls, display
  // cases and smoke, and a sneaking thief is spotted at shorter range.
  // `time` is the game's own clock, so a staged shot stays deterministic.
  canSee(thief, time, level, smokes) {
    const range = thief.sneaking ? GUARD_CONE_RANGE * 0.72 : GUARD_CONE_RANGE;
    const facing = this.state === 'stare'
      ? Math.atan2(thief.y - this.y, thief.x - this.x)
      : this.coneAngle(time);
    if (!pointInVisionCone(thief.x, thief.y, this.x, this.y, facing, GUARD_CONE_HALF_ANGLE, range)) {
      return false;
    }
    return lineOfSightClear(this.x, this.y, thief.x, thief.y, level, smokes);
  }

  touches(thief) {
    return distance(this.x, this.y, thief.x, thief.y) <= GUARD_CATCH_RADIUS + thief.r - 6;
  }
}

export function lineOfSightClear(x1, y1, x2, y2, level, smokes) {
  for (const wall of level.walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  for (const cover of level.covers) {
    if (segmentHitsRect(x1, y1, x2, y2, cover)) return false;
  }
  for (const smoke of smokes) {
    if (segmentHitsCircle(x1, y1, x2, y2, smoke.x, smoke.y, smoke.radius)) return false;
  }
  return true;
}

export function nearestGuardTo(guards, x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const guard of guards) {
    const d = distance(guard.x, guard.y, x, y);
    if (d < bestDistance) {
      bestDistance = d;
      best = guard;
    }
  }
  return best;
}

// Keep the facing angle tidy for the renderer.
export function guardConeFacing(guard, time) {
  return guard.coneAngle(time);
}

export { angleDifference, clamp };
