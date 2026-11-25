// stations.js — the six stations as a small state machine.
// A station is idle, busy (an item cooking with a progress clock), or done
// (a finished item waiting to be collected). One item per station at a time:
// the queue is the chef's route, not a pile on the counter.

import { STATION_TIMES, STATIONS } from './config.js';

/** Build the six stations fresh, all idle, at the positions config.js lays out. */
export function createStations() {
  return STATIONS.map((station) => ({
    id: station.id,
    label: station.label,
    verb: station.verb,
    color: station.color,
    x: station.x,
    y: station.y,
    state: 'idle',
    item: null,
    progress: 0,
    duration: 0,
  }));
}

/** Look a station up by id; returns undefined for an unknown id. */
export function findStation(stations, stationId) {
  return stations.find((station) => station.id === stationId);
}

/**
 * Start `ingredientId` cooking on the station: sets the timer from
 * STATION_TIMES. Returns false when the station is busy or the station id
 * has no cook time (plate and serve are not cooking stations).
 */
export function startProcessing(station, ingredientId) {
  if (!station || station.state !== 'idle') return false;
  const duration = STATION_TIMES[station.id];
  if (!duration) return false;
  station.state = 'busy';
  station.item = ingredientId;
  station.progress = 0;
  station.duration = duration;
  return true;
}

/**
 * Advance every busy station by `dt`; returns the items that just finished,
 * as { stationId, ingredientId } pairs the world collects onto the plate.
 */
export function tickStations(stations, dt) {
  const finished = [];
  for (const station of stations) {
    if (station.state !== 'busy') continue;
    station.progress += dt;
    if (station.progress >= station.duration) {
      station.state = 'done';
      station.progress = station.duration;
      finished.push({ stationId: station.id, ingredientId: station.item });
    }
  }
  return finished;
}

/** Collect a finished item off a station, leaving it idle again. */
export function collectStationItem(station) {
  if (!station || station.state !== 'done') return null;
  const ingredientId = station.item;
  station.state = 'idle';
  station.item = null;
  station.progress = 0;
  station.duration = 0;
  return ingredientId;
}

/** How far through its cook a busy station is, 0 to 1; 0 when idle. */
export function stationProgressFraction(station) {
  if (station.state !== 'busy' || station.duration <= 0) return 0;
  return Math.min(1, station.progress / station.duration);
}

/** True when any cooking station (chop/wok/grill/steam) is busy right now. */
export function anyStationBusy(stations) {
  return stations.some((station) => station.state === 'busy' && STATION_TIMES[station.id]);
}
