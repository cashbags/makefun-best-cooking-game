// main.js — boot and the game loop for EMBER & THYME.
// Two modes: a screenshot scene (?shot=cover|title|mid|serve) renders one
// fixed frame of the real game and stops, while normal play runs a fixed-step
// loop at 60 Hz, reads clicks and keys, and plays a sound per game event.

import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_SEED, STEP } from './config.js';
import { World, EVENT_COOKED, EVENT_ORDER, EVENT_ORDER_LOST } from './world.js';
import { render } from './render.js';
import { handleCanvasClick, handleKeyPress } from './input.js';
import {
  ensureAudio, playChopSound, playDingSound, playGrillSound,
  playLostSound, playRushSound, playServeSound, playSizzleSound,
  playSteamSound,
} from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const world = new World(DEFAULT_SEED);

/** Map a step event bitmask onto sounds, and ring the rush bell on entry. */
function playStepEvents(events, rushActive) {
  if (events & EVENT_ORDER) playDingSound();
  if (events & EVENT_COOKED) playSizzleSound();
  if (events & EVENT_ORDER_LOST) playLostSound();
  if (rushActive && !playStepEvents.lastRush) playRushSound();
  playStepEvents.lastRush = rushActive;
}
playStepEvents.lastRush = false;

/** Play the chop/grill/steam sound for the station just used, where it fits. */
function playStationSound(stationId) {
  if (stationId === 'chop') playChopSound();
  else if (stationId === 'wok') playSizzleSound();
  else if (stationId === 'grill') playGrillSound();
  else if (stationId === 'steam') playSteamSound();
  else if (stationId === 'serve') playServeSound();
}

if (shotName) {
  // Screenshot mode: stage the scene, draw it once, and stop. No loop, no
  // audio, no wall-clock input — the frame is a pure function of the seed.
  const shot = stageShot(shotName, world);
  render(ctx, world, shot.screen);
} else {
  // Normal play: a fixed-step loop, with clicks and keys wired to the world.
  canvas.addEventListener('click', (event) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    const stationBefore = world.chef.stationId;
    if (handleCanvasClick(world, x, y)) {
      if (world.chef.stationId && world.chef.stationId !== stationBefore) {
        playStationSound(world.chef.stationId);
      }
    }
  });
  window.addEventListener('keydown', (event) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    ensureAudio();
    handleKeyPress(world, event.key);
  });

  let lastTime = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = world.step(STEP);
      playStepEvents(events, Boolean(world.activeRush()));
    }
    render(ctx, world);
    requestAnimationFrame(frame);
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}
