// orders.js — the order board: what spawns, how long it waits, when it walks.
// An order is a recipe plus the customer who asked for it, a patience clock, and
// a slot on the board. Orders are dealt from the seeded roll, so the same seed
// serves the same customers in the same order.

import { MAX_ORDERS, RUSH_HOURS } from './config.js';
import { CUSTOMERS, RECIPES, findCustomer, findRecipe } from './recipes.js';
import { pickFromList, rollInt } from './random.js';

let nextOrderNumber = 1;

/** Reset the order counter (a fresh day starts numbering from #1 again). */
export function resetOrderNumbers() {
  nextOrderNumber = 1;
}

/**
 * Deal one new order from the seeded roll: a random recipe, a random customer,
 * and patience from that customer's type with a small seeded wobble.
 */
export function spawnOrder(random, day) {
  const recipe = pickFromList(random, RECIPES);
  const customer = pickFromList(random, CUSTOMERS);
  const patience = customer.patience + rollInt(random, -5, 5);
  const order = {
    number: nextOrderNumber,
    recipeId: recipe.id,
    customerId: customer.id,
    patience,
    patienceLeft: patience,
    day,
    state: 'waiting',
  };
  nextOrderNumber += 1;
  return order;
}

/** True while `dayTime` falls inside any rush hour of the day. */
export function currentRush(dayTime) {
  return RUSH_HOURS.find((rush) => dayTime >= rush.start && dayTime < rush.end) || null;
}

/** Tick every waiting order's patience down; returns the orders that just expired. */
export function tickOrders(orders, dt) {
  const expired = [];
  for (const order of orders) {
    if (order.state !== 'waiting') continue;
    order.patienceLeft -= dt;
    if (order.patienceLeft <= 0) {
      order.patienceLeft = 0;
      order.state = 'expired';
      expired.push(order);
    }
  }
  return expired;
}

/** Drop finished and expired tickets off the board, keeping the rest in place. */
export function clearDoneOrders(orders) {
  return orders.filter((order) => order.state === 'waiting');
}

/** The fraction of patience left, 1 while fresh and 0 when it walks away. */
export function patienceFraction(order) {
  return Math.max(0, order.patienceLeft / order.patience);
}

/** Find a waiting order whose recipe matches `recipeId`, or null. */
export function findWaitingOrder(orders, recipeId) {
  return orders.find((order) => order.state === 'waiting' && order.recipeId === recipeId) || null;
}

/** The recipe and customer behind an order ticket, for the board and scoring. */
export function describeOrder(order) {
  return { recipe: findRecipe(order.recipeId), customer: findCustomer(order.customerId) };
}

/** True when the board has a free slot for one more order. */
export function boardHasRoom(orders) {
  return orders.filter((order) => order.state === 'waiting').length < MAX_ORDERS;
}
