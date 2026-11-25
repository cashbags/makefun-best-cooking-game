// EMBER & THYME — night-market wok kitchen.
// config.js — every number the game tunes from lives here, in one place, so the
// kitchen can be rebalanced without touching the rules in world.js or the drawing
// in render.js. All times are seconds; all sizes are canvas pixels at 1280x720.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const STEP = 1 / 60;

// One full service day, and the three festival days the game runs for.
export const DAY_LENGTH_SECONDS = 150;
export const TOTAL_DAYS = 3;

// The chef starts every day with three hearts; a lost order costs one.
export const START_HEARTS = 3;

// Seeded play: the same seed deals the same orders in the same order.
export const DEFAULT_SEED = 20261125;

// How many order tickets the board can hold at once.
export const MAX_ORDERS = 4;

// New orders arrive on this beat in calm service, twice as fast in a rush.
export const ORDER_SPAWN_EVERY_SECONDS = 14;
export const RUSH_SPAWN_EVERY_SECONDS = 7;

// Rush hours are fixed moments inside each day, so a player can plan for them.
export const RUSH_HOURS = [
  { start: 30, end: 55, label: 'LUNCH RUSH' },
  { start: 70, end: 95, label: 'DINNER RUSH' },
  { start: 120, end: 145, label: 'MIDNIGHT RUSH' },
];

// The chef walks this fast between stations, in pixels per second.
export const CHEF_SPEED = 520;

// Hands hold at most this many raw ingredients at once.
export const HAND_CAPACITY = 3;

// How long each station takes to finish one item, in seconds.
export const STATION_TIMES = {
  chop: 2.5,
  wok: 4.0,
  grill: 5.0,
  steam: 3.5,
};

// A serve made within this many seconds of the previous serve keeps the combo alive.
export const COMBO_WINDOW_SECONDS = 20;

// Each combo step adds this much to the payout multiplier, capped below.
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 3.0;

// A served dish pays its base price plus a tip scaled by patience left.
export const TIP_MAX = 12;

// The six stations, left to right across the kitchen counter.
export const STATIONS = [
  { id: 'chop', label: 'CHOP', verb: 'Chopping', color: '#e8a33d', x: 40, y: 244 },
  { id: 'wok', label: 'WOK', verb: 'Wok-frying', color: '#e4572e', x: 240, y: 244 },
  { id: 'grill', label: 'GRILL', verb: 'Grilling', color: '#c73e3a', x: 440, y: 244 },
  { id: 'steam', label: 'STEAM', verb: 'Steaming', color: '#4fa8a0', x: 640, y: 244 },
  { id: 'plate', label: 'PLATE', verb: 'Plating', color: '#7a9e3f', x: 840, y: 244 },
  { id: 'serve', label: 'SERVE', verb: 'Serving', color: '#b07cc9', x: 1040, y: 244 },
];
export const STATION_WIDTH = 180;
export const STATION_HEIGHT = 150;

// Ingredient bins along the bottom counter: two rows of nine.
export const BIN_WIDTH = 132;
export const BIN_HEIGHT = 56;
export const BIN_GAP = 8;
export const BIN_START_X = 20;
export const BIN_START_Y = 556;

// Night-market palette: warm lantern light over a deep purple night.
export const COLORS = {
  sky: '#1c1233',
  awningRed: '#c73e3a',
  awningCream: '#f2e3c6',
  counterWood: '#6b4226',
  counterTop: '#8a5a33',
  board: '#f7efdc',
  boardEdge: '#4a2f1d',
  ink: '#2b1d12',
  gold: '#f2c14e',
  timerGood: '#7ac74f',
  timerLow: '#e4572e',
  plateWhite: '#fdfbf6',
};
