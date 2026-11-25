// recipes.js — the pantry and the menu of EMBER & THYME.
// 18 ingredients, 12 recipes, 5 customer types. Every recipe names the station
// each ingredient must pass through, so an order is a small route plan through
// the kitchen: pick, prep, plate, serve. Nothing here is copied from any other
// cooking game; the dishes are invented for this night market.

// Each ingredient knows its pantry colour, its two-letter bin mark, and which
// station prepares it (raw ingredients go straight onto the plate).
export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', mark: 'RI', color: '#f2ead8', station: null },
  { id: 'noodle', name: 'Noodle', mark: 'NO', color: '#f2c14e', station: null },
  { id: 'chicken', name: 'Chicken', mark: 'CH', color: '#e8a87c', station: 'grill' },
  { id: 'beef', name: 'Beef', mark: 'BE', color: '#a34a3a', station: 'grill' },
  { id: 'prawn', name: 'Prawn', mark: 'PR', color: '#f28c6b', station: 'wok' },
  { id: 'tofu', name: 'Tofu', mark: 'TO', color: '#f7f3e8', station: 'steam' },
  { id: 'egg', name: 'Egg', mark: 'EG', color: '#f6d743', station: 'wok' },
  { id: 'chilli', name: 'Chilli', mark: 'CL', color: '#c1272d', station: 'chop' },
  { id: 'garlic', name: 'Garlic', mark: 'GA', color: '#efe6d0', station: 'chop' },
  { id: 'ginger', name: 'Ginger', mark: 'GI', color: '#d9b380', station: 'chop' },
  { id: 'basil', name: 'Basil', mark: 'BA', color: '#3f8f4f', station: 'chop' },
  { id: 'spring-onion', name: 'Spring Onion', mark: 'SO', color: '#7ac74f', station: 'chop' },
  { id: 'mushroom', name: 'Mushroom', mark: 'MU', color: '#c9b8a3', station: 'wok' },
  { id: 'pepper', name: 'Pepper', mark: 'PE', color: '#e4572e', station: 'chop' },
  { id: 'carrot', name: 'Carrot', mark: 'CA', color: '#ef8354', station: 'chop' },
  { id: 'bok-choy', name: 'Bok Choy', mark: 'BC', color: '#5da85d', station: 'steam' },
  { id: 'soy', name: 'Soy Sauce', mark: 'SY', color: '#4a2f1d', station: null },
  { id: 'lime', name: 'Lime', mark: 'LI', color: '#a8d84a', station: 'chop' },
];

// A recipe step is one ingredient plus the station that must prepare it.
// `station: null` means the ingredient goes on the plate raw.
export const RECIPES = [
  { id: 'ember-fried-rice', name: 'Ember Fried Rice', price: 18, steps: [
    { ingredient: 'rice', station: null }, { ingredient: 'egg', station: 'wok' },
    { ingredient: 'spring-onion', station: 'chop' }, { ingredient: 'soy', station: null },
  ] },
  { id: 'thai-basil-noodle', name: 'Thyme Basil Noodle', price: 22, steps: [
    { ingredient: 'noodle', station: null }, { ingredient: 'chicken', station: 'grill' },
    { ingredient: 'basil', station: 'chop' }, { ingredient: 'chilli', station: 'chop' },
  ] },
  { id: 'wok-prawn-lime', name: 'Wok Prawn & Lime', price: 26, steps: [
    { ingredient: 'prawn', station: 'wok' }, { ingredient: 'lime', station: 'chop' },
    { ingredient: 'garlic', station: 'chop' }, { ingredient: 'rice', station: null },
  ] },
  { id: 'charred-beef-pepper', name: 'Charred Beef Pepper', price: 28, steps: [
    { ingredient: 'beef', station: 'grill' }, { ingredient: 'pepper', station: 'chop' },
    { ingredient: 'ginger', station: 'chop' }, { ingredient: 'noodle', station: null },
  ] },
  { id: 'steamed-tofu-bok', name: 'Steamed Tofu & Bok Choy', price: 20, steps: [
    { ingredient: 'tofu', station: 'steam' }, { ingredient: 'bok-choy', station: 'steam' },
    { ingredient: 'ginger', station: 'chop' }, { ingredient: 'soy', station: null },
  ] },
  { id: 'mushroom-egg-rice', name: 'Mushroom Egg Rice', price: 19, steps: [
    { ingredient: 'rice', station: null }, { ingredient: 'mushroom', station: 'wok' },
    { ingredient: 'egg', station: 'wok' }, { ingredient: 'spring-onion', station: 'chop' },
  ] },
  { id: 'chilli-chicken-skewer', name: 'Chilli Chicken Skewer', price: 24, steps: [
    { ingredient: 'chicken', station: 'grill' }, { ingredient: 'chilli', station: 'chop' },
    { ingredient: 'lime', station: 'chop' }, { ingredient: 'carrot', station: 'chop' },
  ] },
  { id: 'garlic-prawn-noodle', name: 'Garlic Prawn Noodle', price: 27, steps: [
    { ingredient: 'noodle', station: null }, { ingredient: 'prawn', station: 'wok' },
    { ingredient: 'garlic', station: 'chop' }, { ingredient: 'basil', station: 'chop' },
  ] },
  { id: 'ginger-beef-rice', name: 'Ginger Beef Rice', price: 25, steps: [
    { ingredient: 'rice', station: null }, { ingredient: 'beef', station: 'grill' },
    { ingredient: 'ginger', station: 'chop' }, { ingredient: 'pepper', station: 'chop' },
  ] },
  { id: 'tofu-chilli-stirfry', name: 'Tofu Chilli Stir-Fry', price: 21, steps: [
    { ingredient: 'tofu', station: 'steam' }, { ingredient: 'chilli', station: 'chop' },
    { ingredient: 'mushroom', station: 'wok' }, { ingredient: 'noodle', station: null },
  ] },
  { id: 'lantern-egg-noodle', name: 'Lantern Egg Noodle', price: 23, steps: [
    { ingredient: 'noodle', station: null }, { ingredient: 'egg', station: 'wok' },
    { ingredient: 'carrot', station: 'chop' }, { ingredient: 'soy', station: null },
  ] },
  { id: 'midnight-bok-prawn', name: 'Midnight Bok Prawn', price: 29, steps: [
    { ingredient: 'prawn', station: 'wok' }, { ingredient: 'bok-choy', station: 'steam' },
    { ingredient: 'garlic', station: 'chop' }, { ingredient: 'lime', station: 'chop' },
  ] },
];

/** Look a recipe up by id; returns undefined for an unknown id. */
export function findRecipe(recipeId) {
  return RECIPES.find((recipe) => recipe.id === recipeId);
}

/** Look an ingredient up by id; returns undefined for an unknown id. */
export function findIngredient(ingredientId) {
  return INGREDIENTS.find((ingredient) => ingredient.id === ingredientId);
}

// Five customer types. Patience is how long an order waits before it walks
// away; tipBonus scales the tip a happy customer leaves behind.
export const CUSTOMERS = [
  { id: 'regular', name: 'Regular', patience: 60, tipBonus: 1.0, color: '#7ab8e8', face: '🙂' },
  { id: 'foodie', name: 'Foodie', patience: 50, tipBonus: 1.5, color: '#e8a33d', face: '😋' },
  { id: 'critic', name: 'Critic', patience: 40, tipBonus: 2.0, color: '#b07cc9', face: '🧐' },
  { id: 'kid', name: 'Kid', patience: 75, tipBonus: 0.8, color: '#7ac74f', face: '😄' },
  { id: 'night-owl', name: 'Night Owl', patience: 55, tipBonus: 1.2, color: '#4fa8a0', face: '🦉' },
];

/** Look a customer type up by id; falls back to the Regular. */
export function findCustomer(customerId) {
  return CUSTOMERS.find((customer) => customer.id === customerId) || CUSTOMERS[0];
}
