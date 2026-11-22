// Gadgets: the thief's tools, each with a cost. Nothing here is free:
// every use spends a charge and a slice of the score, so the player weighs
// each trick against the loot it protects.
//
//   Q — Smoke puff: a cloud that blocks every cone for 6 seconds.
//   E — EMP pulse: knocks every camera offline for 8 seconds.
//   Click — Coin toss: a clink that pulls the nearest guard to investigate.

export const SMOKE_DURATION = 6;
export const SMOKE_RADIUS = 92;
export const EMP_DURATION = 8;
export const COIN_INVESTIGATE_RADIUS = 300;

export class GadgetBelt {
  constructor() {
    this.smokeCharges = 3;
    this.empCharges = 2;
    this.coins = 3;
    this.smokes = []; // { x, y, radius, until }
    this.lastCoin = null; // { x, y, at } for the renderer
  }

  get scoreCost() {
    return { smoke: 50, emp: 150, coin: 25 };
  }

  useSmoke(x, y, time, spendScore) {
    if (this.smokeCharges <= 0) return false;
    this.smokeCharges -= 1;
    this.smokes.push({ x, y, radius: SMOKE_RADIUS, until: time + SMOKE_DURATION });
    spendScore(this.scoreCost.smoke);
    return true;
  }

  useEmp(cameras, time, spendScore) {
    if (this.empCharges <= 0) return false;
    this.empCharges -= 1;
    for (const camera of cameras) camera.knockOffline(time, EMP_DURATION);
    spendScore(this.scoreCost.emp);
    return true;
  }

  throwCoin(x, y, time, guards, spendScore) {
    if (this.coins <= 0) return false;
    this.coins -= 1;
    this.lastCoin = { x, y, at: time };
    let nearest = null;
    let nearestDistance = Infinity;
    for (const guard of guards) {
      const d = Math.hypot(guard.x - x, guard.y - y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = guard;
      }
    }
    if (nearest && nearestDistance <= COIN_INVESTIGATE_RADIUS) {
      nearest.sendToInvestigate({ x, y });
    }
    spendScore(this.scoreCost.coin);
    return true;
  }

  update(time) {
    this.smokes = this.smokes.filter((smoke) => time < smoke.until);
  }

  get smokeCount() {
    return this.smokeCharges;
  }
}
