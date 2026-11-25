// world.js — the whole game state and its rules, in one place.
// The world owns the chef, the stations, the orders, the plate, the score and
// the clock. Rendering only reads it; input only calls its verbs. A fixed
// STEP drives it, and the seeded roll deals the orders, so replay is exact.

import {
  CANVAS_WIDTH, CHEF_SPEED, COMBO_MAX, COMBO_STEP, COMBO_WINDOW_SECONDS,
  DAY_LENGTH_SECONDS, DEFAULT_SEED, HAND_CAPACITY, ORDER_SPAWN_EVERY_SECONDS,
  RUSH_SPAWN_EVERY_SECONDS, START_HEARTS, STATION_HEIGHT, STATION_WIDTH,
  STATIONS, TOTAL_DAYS,
} from './config.js';
import { createSeededRandom } from './random.js';
import { findCustomer, findIngredient, findRecipe, RECIPES } from './recipes.js';
import {
  boardHasRoom, clearDoneOrders, currentRush, findWaitingOrder,
  patienceFraction, resetOrderNumbers, spawnOrder, tickOrders,
} from './orders.js';
import {
  collectStationItem, createStations, findStation, startProcessing, tickStations,
} from './stations.js';

/**
 * A fresh world for one festival run. `seed` deals the orders; the same seed
 * always deals the same service, which is what makes screenshots reproducible.
 */
export class World {
  constructor(seed = DEFAULT_SEED) {
    this.seed = seed;
    this.random = createSeededRandom(seed);
    this.reset();
  }

  /** Start over from the title screen: day one, empty kitchen, full hearts. */
  reset() {
    this.random = createSeededRandom(this.seed);
    resetOrderNumbers();
    this.screen = 'title';
    this.day = 1;
    this.dayTime = 0;
    this.score = 0;
    this.hearts = START_HEARTS;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.dishesServed = 0;
    this.ordersLost = 0;
    this.totalEarned = 0;
    this.orders = [];
    this.stations = createStations();
    this.chef = { x: 640, y: 470, targetX: 640, targetY: 470, stationId: null };
    this.pendingAction = null;
    this.hands = [];
    this.tray = [];
    this.plate = [];
    this.plateReady = null;
    this.message = 'Welcome to EMBER & THYME — click an ingredient, then a station.';
    this.messageTimer = 0;
    this.spawnTimer = 4;
    this.lastServe = null;
    this.daySummary = null;
  }

  /** Begin day one: the board opens and the first orders walk in. */
  startGame() {
    this.reset();
    this.screen = 'play';
    this.spawnInitialOrders();
  }

  /** Deal the opening two orders so the board is never empty at first light. */
  spawnInitialOrders() {
    for (let index = 0; index < 2; index += 1) {
      this.orders.push(spawnOrder(this.random, this.day));
    }
  }

  /** The station rect the chef stands at, or null when between stations. */
  chefStationRect() {
    const station = STATIONS.find((entry) => entry.id === this.chef.stationId);
    if (!station) return null;
    return { x: station.x, y: station.y, width: STATION_WIDTH, height: STATION_HEIGHT };
  }

  /** Send the chef walking to a station; `action` runs when they arrive. */
  moveChefToStation(stationId, action = null) {
    const station = STATIONS.find((entry) => entry.id === stationId);
    if (!station) return false;
    this.chef.targetX = station.x + STATION_WIDTH / 2;
    this.chef.targetY = station.y + STATION_HEIGHT + 34;
    this.chef.stationId = stationId;
    this.pendingAction = action;
    return true;
  }

  /** Pick a raw ingredient off the counter into the chef's hands. */
  pickIngredient(ingredientId) {
    if (this.screen !== 'play') return false;
    if (this.hands.length >= HAND_CAPACITY) {
      this.flashMessage('Hands full — cook something first!');
      return false;
    }
    if (!findIngredient(ingredientId)) return false;
    this.hands.push(ingredientId);
    return true;
  }

  /** The verb for the station the chef stands at: cook, plate, or serve. */
  useStation(stationId) {
    if (this.screen !== 'play') return false;
    const station = findStation(this.stations, stationId);
    if (!station) return false;
    if (this.chef.stationId !== stationId) {
      return this.moveChefToStation(stationId, () => this.useStationNow(stationId));
    }
    return this.useStationNow(stationId);
  }

  /** Run the station's verb at once; the chef is already standing there. */
  useStationNow(stationId) {
    if (stationId === 'plate') return this.assemblePlate();
    if (stationId === 'serve') return this.servePlate();
    return this.cookAtStation(stationId);
  }

  /**
   * Cook at a prep station: the first hand ingredient that station prepares
   * goes on the heat. Raw pantry goods (rice, noodle, soy) need no station.
   */
  cookAtStation(stationId) {
    const station = findStation(this.stations, stationId);
    const handIndex = this.hands.findIndex((held) => {
      const ingredient = findIngredient(held);
      return ingredient && ingredient.station === stationId;
    });
    if (handIndex === -1) {
      this.flashMessage('Nothing here needs the ' + station.label + ' — grab an ingredient first.');
      return false;
    }
    const ingredientId = this.hands[handIndex];
    if (!startProcessing(station, ingredientId)) {
      this.flashMessage('The ' + station.label + ' is busy — wait for it to finish.');
      return false;
    }
    this.hands.splice(handIndex, 1);
    return true;
  }

  /**
   * Assemble the plate: tray items (finished cooking) and raw pantry goods
   * from the hands move onto the plate, then the plate is matched against
   * the menu. A full exact match lights the plate READY.
   */
  assemblePlate() {
    let moved = false;
    while (this.tray.length > 0) {
      this.plate.push(this.tray.shift());
      moved = true;
    }
    for (let index = this.hands.length - 1; index >= 0; index -= 1) {
      const ingredient = findIngredient(this.hands[index]);
      if (ingredient && ingredient.station === null) {
        this.plate.push(this.hands.splice(index, 1)[0]);
        moved = true;
      }
    }
    if (!moved && this.plate.length === 0) {
      this.flashMessage('The plate is empty — cook something, then plate it.');
      return false;
    }
    this.plateReady = this.matchPlateToRecipe();
    return true;
  }

  /** Which recipe the plate matches exactly, or null when it matches none. */
  matchPlateToRecipe() {
    if (this.plate.length === 0) return null;
    const plated = this.plate.slice().sort();
    for (const recipe of this.menuRecipes()) {
      const wanted = recipe.steps.map((step) => step.ingredient).sort();
      if (plated.length === wanted.length && plated.every((item, index) => item === wanted[index])) {
        return recipe.id;
      }
    }
    return null;
  }

  /** The menu, in the order the board shows it. */
  menuRecipes() {
    return RECIPES;
  }

  /** Throw the plate away and start the dish again (no penalty, just time). */
  clearPlate() {
    if (this.plate.length === 0 && this.plateReady === null) return false;
    this.plate = [];
    this.plateReady = null;
    this.flashMessage('Plate cleared — start the dish again.');
    return true;
  }

  /**
   * Serve the ready plate to the matching waiting order. Pays the recipe
   * price plus a patience tip, multiplied by the combo, and keeps the combo
   * alive for the next serve. Returns the serve receipt, or null.
   */
  servePlate() {
    if (!this.plateReady) {
      this.flashMessage('No dish is ready — finish a recipe on the plate first.');
      return null;
    }
    const order = findWaitingOrder(this.orders, this.plateReady);
    if (!order) {
      this.flashMessage('Nobody ordered that right now — check the board.');
      return null;
    }
    const recipe = findRecipe(this.plateReady);
    const { customer } = this.orderDetails(order);
    const tip = Math.round(12 * patienceFraction(order) * customer.tipBonus);
    const multiplier = Math.min(1 + this.combo * COMBO_STEP, COMBO_MAX);
    const earned = Math.round((recipe.price + tip) * multiplier);
    this.score += earned;
    this.totalEarned += earned;
    this.dishesServed += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = COMBO_WINDOW_SECONDS;
    order.state = 'served';
    this.orders = clearDoneOrders(this.orders);
    this.lastServe = { recipe: recipe.name, earned, multiplier, combo: this.combo, customer: customer.name };
    this.plate = [];
    this.plateReady = null;
    this.flashMessage('Served ' + recipe.name + ' to the ' + customer.name + ' — +' + earned + ' coins!');
    return this.lastServe;
  }

  /** Recipe and customer behind an order, for scoring and the board. */
  orderDetails(order) {
    const recipe = findRecipe(order.recipeId);
    return { recipe, customer: findCustomer(order.customerId) };
  }

  /** True while a rush hour is running right now. */
  activeRush() {
    return this.screen === 'play' ? currentRush(this.dayTime) : null;
  }

  /** Show a short message above the counter for a few seconds. */
  flashMessage(text) {
    this.message = text;
    this.messageTimer = 3;
  }

  /**
   * Advance the world by `dt` seconds: chef walks, stations cook, orders
   * wait, rushes roll in, the combo cools, the day ends. Returns an event
   * bitmask the main loop reads for sounds (see EVENT_* below).
   */
  step(dt) {
    let events = 0;
    if (this.screen !== 'play') return events;
    this.dayTime += dt;

    // The chef walks toward their target; on arrival a queued verb runs.
    const dx = this.chef.targetX - this.chef.x;
    const dy = this.chef.targetY - this.chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 4) {
      const move = Math.min(distance, CHEF_SPEED * dt);
      this.chef.x += (dx / distance) * move;
      this.chef.y += (dy / distance) * move;
    } else if (this.pendingAction) {
      const action = this.pendingAction;
      this.pendingAction = null;
      action();
    }

    // Finished cooking slides onto the tray, ready to plate.
    const finished = tickStations(this.stations, dt);
    for (const done of finished) {
      const station = findStation(this.stations, done.stationId);
      const ingredientId = collectStationItem(station);
      if (ingredientId) this.tray.push(ingredientId);
      events |= EVENT_COOKED;
    }

    // Orders wait, then walk away; a lost order costs a heart.
    const expired = tickOrders(this.orders, dt);
    for (const order of expired) {
      this.ordersLost += 1;
      this.hearts -= 1;
      this.combo = 0;
      this.comboTimer = 0;
      events |= EVENT_ORDER_LOST;
      this.flashMessage('An order walked away — one heart lost.');
      if (this.hearts <= 0) {
        this.endFestival();
        return events;
      }
    }
    this.orders = clearDoneOrders(this.orders);

    // New orders arrive faster while a rush is on.
    const rush = currentRush(this.dayTime);
    const spawnEvery = rush ? RUSH_SPAWN_EVERY_SECONDS : ORDER_SPAWN_EVERY_SECONDS;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnEvery;
      if (boardHasRoom(this.orders)) {
        this.orders.push(spawnOrder(this.random, this.day));
        events |= EVENT_ORDER;
      }
    }

    // The combo cools down when no serve lands in time.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    if (this.messageTimer > 0) this.messageTimer -= dt;

    // The day ends on the clock; the festival ends after the last day.
    if (this.dayTime >= DAY_LENGTH_SECONDS) this.endDay();
    return events;
  }

  /** Wrap a day up: bank the summary and open the next, or finish. */
  endDay() {
    this.daySummary = {
      day: this.day,
      score: this.score,
      dishes: this.dishesServed,
      lost: this.ordersLost,
      bestCombo: this.bestCombo,
    };
    if (this.day >= TOTAL_DAYS) {
      this.endFestival();
      return;
    }
    this.day += 1;
    this.dayTime = 0;
    this.orders = [];
    this.stations = createStations();
    this.hands = [];
    this.tray = [];
    this.plate = [];
    this.plateReady = null;
    this.spawnTimer = 4;
    this.combo = 0;
    this.comboTimer = 0;
    this.screen = 'dayEnd';
  }

  /** The festival is over: final score screen. */
  endFestival() {
    this.screen = 'over';
    this.daySummary = {
      day: this.day,
      score: this.score,
      dishes: this.dishesServed,
      lost: this.ordersLost,
      bestCombo: this.bestCombo,
    };
  }

  /** From a day-end screen, open the next day's service. */
  startNextDay() {
    if (this.screen !== 'dayEnd') return false;
    this.screen = 'play';
    this.daySummary = null;
    this.spawnInitialOrders();
    return true;
  }

  /** The shift timer as a fraction of the day left, 1 at open, 0 at close. */
  dayFractionLeft() {
    return Math.max(0, 1 - this.dayTime / DAY_LENGTH_SECONDS);
  }

  /** The combo payout multiplier on the next serve. */
  comboMultiplier() {
    return Math.min(1 + this.combo * COMBO_STEP, COMBO_MAX);
  }
}

// Event bits step() returns, so the main loop knows what to play.
export const EVENT_ORDER = 1;
export const EVENT_COOKED = 2;
export const EVENT_ORDER_LOST = 4;
