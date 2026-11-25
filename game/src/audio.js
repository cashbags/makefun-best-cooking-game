// audio.js — every sound is a WebAudio oscillator, made on the spot.
// No audio files ship with the game, so there is nothing to download and
// nothing to break offline. Sounds start only after a user gesture, as the
// browser requires; the screenshot scenes run silent.

let audioContext = null;

/** Create (or reuse) the shared AudioContext after a user gesture. */
export function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

/**
 * Play one short oscillator blip: a sine/triangle/square tone that slides
 * from `fromHz` to `toHz` over `seconds`, at `volume` (0 to 1).
 */
export function playTone(fromHz, toHz, seconds, type = 'sine', volume = 0.12) {
  const context = ensureAudio();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(fromHz, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), context.currentTime + seconds);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + seconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + seconds);
}

/** A knife chop: two quick low thocks. */
export function playChopSound() {
  playTone(180, 90, 0.08, 'square', 0.10);
  setTimeout(() => playTone(170, 80, 0.08, 'square', 0.10), 90);
}

/** A wok sizzle: a high shimmer that falls away. */
export function playSizzleSound() {
  playTone(1400, 500, 0.35, 'sawtooth', 0.05);
}

/** A grill sear: a warm mid-range crackle. */
export function playGrillSound() {
  playTone(320, 140, 0.3, 'triangle', 0.10);
}

/** A steam puff: a soft rising sigh. */
export function playSteamSound() {
  playTone(500, 900, 0.4, 'sine', 0.08);
}

/** A finished dish dings: a bright two-note chime. */
export function playDingSound() {
  playTone(880, 880, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(1318, 1318, 0.2, 'sine', 0.12), 120);
}

/** A served order rings the till: coin chime, then a happy lift. */
export function playServeSound() {
  playTone(988, 988, 0.1, 'triangle', 0.12);
  setTimeout(() => playTone(1318, 1760, 0.25, 'triangle', 0.12), 100);
}

/** A lost order: a low, short sigh. */
export function playLostSound() {
  playTone(220, 110, 0.4, 'sawtooth', 0.08);
}

/** The rush-hour bell: three rising notes over the market noise. */
export function playRushSound() {
  playTone(523, 523, 0.12, 'triangle', 0.12);
  setTimeout(() => playTone(659, 659, 0.12, 'triangle', 0.12), 130);
  setTimeout(() => playTone(784, 784, 0.22, 'triangle', 0.12), 260);
}
