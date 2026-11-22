// The alarm meter: the night's tension, 0 to 100. It climbs while any guard
// or camera has eyes on the thief, faster up close and faster still under a
// camera, and it drains while the thief stays hidden. At 100 the museum
// locks down and the thief is caught. After the diamond is taken the hall
// stays on edge: the meter never falls below a floor of 25.

export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 26;
export const ALARM_CAMERA_RATE = 38;
export const ALARM_FALL_RATE = 13;
export const ALARM_HEAT_FLOOR = 25;

export class AlarmMeter {
  constructor() {
    this.value = 0;
    this.heat = false; // true once the Velvet Diamond leaves its case
    this.rising = false;
    this.spottedBy = null; // 'guard' | 'camera' | null
  }

  get floor() {
    return this.heat ? ALARM_HEAT_FLOOR : 0;
  }

  get level() {
    if (this.value >= 80) return 'critical';
    if (this.value >= 55) return 'alert';
    if (this.value >= 25) return 'wary';
    return 'calm';
  }

  update(dt, seenBy, thief) {
    this.spottedBy = seenBy;
    this.rising = seenBy !== null;
    if (seenBy === 'camera') {
      this.value += ALARM_CAMERA_RATE * dt * (thief.sneaking ? 0.6 : 1);
    } else if (seenBy === 'guard') {
      this.value += ALARM_GUARD_RATE * dt * (thief.sneaking ? 0.6 : 1);
    } else {
      this.value -= ALARM_FALL_RATE * dt;
    }
    if (this.value < this.floor) this.value = this.floor;
    if (this.value > ALARM_MAX) this.value = ALARM_MAX;
  }

  get tripped() {
    return this.value >= ALARM_MAX;
  }

  triggerHeat() {
    this.heat = true;
    if (this.value < ALARM_HEAT_FLOOR) this.value = ALARM_HEAT_FLOOR;
  }
}
