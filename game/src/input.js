// input.js — mouse and keyboard, translated into world verbs.
// Clicks land on one of four things: an ingredient bin, a station, the plate
// bin, or the start/next-day button. Keys 1-6 walk the chef to a station,
// Space uses the station they stand at, B clears the plate, Enter starts.

import {
  BIN_GAP, BIN_HEIGHT, BIN_START_X, BIN_START_Y, BIN_WIDTH,
  CANVAS_HEIGHT, CANVAS_WIDTH, STATION_HEIGHT, STATION_WIDTH, STATIONS,
} from './config.js';
import { INGREDIENTS } from './recipes.js';

/** Which ingredient bin, if any, sits under canvas point (x, y). */
export function binAtPoint(x, y) {
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    const column = index % 9;
    const row = Math.floor(index / 9);
    const binX = BIN_START_X + column * (BIN_WIDTH + BIN_GAP);
    const binY = BIN_START_Y + row * (BIN_HEIGHT + BIN_GAP);
    if (x >= binX && x < binX + BIN_WIDTH && y >= binY && y < binY + BIN_HEIGHT) {
      return INGREDIENTS[index].id;
    }
  }
  return null;
}

/** Which station, if any, sits under canvas point (x, y). */
export function stationAtPoint(x, y) {
  for (const station of STATIONS) {
    if (x >= station.x && x < station.x + STATION_WIDTH &&
        y >= station.y && y < station.y + STATION_HEIGHT) {
      return station.id;
    }
  }
  return null;
}

/** The clear-plate bin sits just right of the PLATE station. */
export function binButtonAtPoint(x, y) {
  const binX = 1024;
  const binY = 470;
  return x >= binX && x < binX + 64 && y >= binY && y < binY + 30;
}

/** The big centre button on the title, day-end and game-over screens. */
export function centreButtonAtPoint(x, y) {
  const buttonX = CANVAS_WIDTH / 2 - 140;
  const buttonY = CANVAS_HEIGHT / 2 + 40;
  return x >= buttonX && x < buttonX + 280 && y >= buttonY && y < buttonY + 56;
}

/**
 * Handle one canvas click: pick an ingredient, walk to a station and use it,
 * clear the plate, or start the next day. Returns true when it did something.
 */
export function handleCanvasClick(world, x, y) {
  if (world.screen === 'title') {
    if (centreButtonAtPoint(x, y)) {
      world.startGame();
      return true;
    }
    return false;
  }
  if (world.screen === 'dayEnd') {
    if (centreButtonAtPoint(x, y)) {
      world.startNextDay();
      return true;
    }
    return false;
  }
  if (world.screen === 'over') {
    if (centreButtonAtPoint(x, y)) {
      world.startGame();
      return true;
    }
    return false;
  }

  const bin = binAtPoint(x, y);
  if (bin) return world.pickIngredient(bin);

  if (binButtonAtPoint(x, y)) return world.clearPlate();

  const stationId = stationAtPoint(x, y);
  if (stationId) return world.useStation(stationId);

  return false;
}

/**
 * Handle one key press. Number keys walk the chef, Space uses the station
 * they stand at, B bins the plate, Enter starts the game or the next day.
 */
export function handleKeyPress(world, key) {
  if (key === 'Enter') {
    if (world.screen === 'title') { world.startGame(); return true; }
    if (world.screen === 'dayEnd') { world.startNextDay(); return true; }
    if (world.screen === 'over') { world.startGame(); return true; }
    return false;
  }
  if (world.screen !== 'play') return false;
  if (key >= '1' && key <= '6') {
    return world.moveChefToStation(STATIONS[Number(key) - 1].id);
  }
  if (key === ' ') {
    if (world.chef.stationId) return world.useStation(world.chef.stationId);
    return false;
  }
  if (key === 'b' || key === 'B') return world.clearPlate();
  return false;
}
