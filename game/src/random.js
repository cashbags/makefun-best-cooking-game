// random.js — the game's only source of chance, a small seeded generator.
// Every roll in the game (which order spawns, which customer walks in, which
// ingredient a rush demands) comes through here, so a fixed seed replays the
// exact same service: same seed, same frame, same screenshot.

/** Mulberry32: a tiny deterministic generator with a good spread for 32-bit seeds. */
export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` with the seeded roll, uniformly. */
export function pickFromList(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** Roll an integer in [min, max], both ends inclusive. */
export function rollInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Shuffle a copy of `list` in place order using the seeded roll (Fisher-Yates). */
export function shuffleCopy(random, list) {
  const copy = list.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    const held = copy[index];
    copy[index] = copy[other];
    copy[other] = held;
  }
  return copy;
}
