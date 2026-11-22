// Security cameras: bolted to the walls, sweeping their cones back and
// forth on a fixed arc. They spot faster than a guard but cannot move, and
// an EMP pulse knocks them offline for a few seconds.

import { lineOfSightClear } from './guards.js';
import { pointInVisionCone } from './geometry.js';

export const CAMERA_CONE_RANGE = 265;
export const CAMERA_CONE_HALF_ANGLE = 0.46;

export class SecurityCamera {
  constructor(mount) {
    this.name = mount.name;
    this.x = mount.x;
    this.y = mount.y;
    this.baseAngle = mount.baseAngle;
    this.sweep = mount.sweep;
    this.sweepSpeed = mount.sweepSpeed;
    this.phase = mount.phase;
    this.offlineUntil = 0;
  }

  angleAt(time) {
    return this.baseAngle + Math.sin(time * this.sweepSpeed + this.phase) * this.sweep;
  }

  isOffline(time) {
    return time < this.offlineUntil;
  }

  knockOffline(time, seconds) {
    this.offlineUntil = time + seconds;
  }

  canSee(thief, time, level, smokes) {
    if (this.isOffline(time)) return false;
    if (!pointInVisionCone(thief.x, thief.y, this.x, this.y, this.angleAt(time), CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE)) {
      return false;
    }
    return lineOfSightClear(this.x, this.y, thief.x, thief.y, level, smokes);
  }
}
