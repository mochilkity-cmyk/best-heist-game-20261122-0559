// Seeded random numbers so every run with the same seed stages the same
// museum: the same patrols, the same camera sweeps, the same sparkle.
// mulberry32 is small, fast and deterministic across browsers.

export function makeSeededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Read a ?seed= number from the page URL; fall back to the house seed 1.
export function seedFromUrl(search) {
  const params = new URLSearchParams(search);
  const raw = Number(params.get('seed'));
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 1;
}
