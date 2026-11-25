// render.js — every pixel of EMBER & THYME, drawn on one canvas.
// The kitchen is drawn top to bottom the way a cook reads it: the shift clock
// and score up top, the order board next, the six stations across the middle,
// the chef below them, and the pantry bins along the bottom counter. All art
// is shapes and text drawn by this file — no images, no fonts to fetch — so
// the game looks the same offline as it does in the screenshots.

import {
  BIN_GAP, BIN_HEIGHT, BIN_START_X, BIN_START_Y, BIN_WIDTH,
  CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, STATION_HEIGHT, STATION_WIDTH, STATIONS,
} from './config.js';
import { findIngredient, INGREDIENTS } from './recipes.js';
import { patienceFraction } from './orders.js';
import { stationProgressFraction } from './stations.js';

/** Round a rectangle path on `ctx` so stations and tickets get soft corners. */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Draw the night sky, the striped awning, lanterns and string lights. */
function drawBackground(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  sky.addColorStop(0, '#241640');
  sky.addColorStop(0.55, '#1c1233');
  sky.addColorStop(1, '#2a1a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Stars pricked into the night above the awning.
  ctx.fillStyle = '#f2e3c6';
  const stars = [[60, 12, 2], [300, 8, 2], [620, 14, 2], [900, 10, 2], [1180, 12, 2], [180, 20, 1], [760, 20, 1], [1050, 22, 1]];
  for (const [x, y, r] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // The market awning: red and cream stripes across the top.
  for (let index = 0; index < 16; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? COLORS.awningRed : COLORS.awningCream;
    ctx.fillRect(index * 80, 0, 80, 26);
  }
  ctx.fillStyle = '#7a1f1d';
  ctx.fillRect(0, 26, CANVAS_WIDTH, 4);

  // Paper lanterns hanging under the awning. They stay inside the awning
  // band (above the HUD bar) so they never cover the score or the timer.
  const lanterns = [[150, 30, '#e4572e'], [480, 30, '#f2c14e'], [810, 30, '#e4572e'], [1130, 30, '#f2c14e']];
  for (const [x, y, color] of lanterns) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 1, 26, 2, 6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 6, y + 1, 3, 14);
  }
}

/** The top bar: name, day, score, hearts, combo and the shift timer. */
function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 40, CANVAS_WIDTH, 34);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER & THYME', 20, 58);
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Night-Market Wok Kitchen', 250, 58);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('DAY ' + world.day + ' / 3', 560, 58);
  ctx.fillText('SCORE ' + world.score, 700, 58);

  // Hearts: filled for lives left, hollow for lives lost.
  ctx.font = '20px sans-serif';
  let hearts = '';
  for (let index = 0; index < 3; index += 1) hearts += index < world.hearts ? '♥' : '♡';
  ctx.fillStyle = world.hearts <= 1 ? '#e4572e' : '#ff7a7a';
  ctx.fillText(hearts, 790, 58);

  // Combo badge, only while a streak is alive.
  if (world.combo >= 2) {
    ctx.fillStyle = COLORS.gold;
    roundRect(ctx, 810, 44, 92, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#2b1d12';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMBO x' + world.combo, 856, 58);
    ctx.textAlign = 'right';
  }

  // The shift timer: a bar that drains across the day and turns red when low.
  const fraction = world.dayFractionLeft();
  const barX = 930;
  const barWidth = 260;
  const low = fraction < 0.2;
  // The pulse is driven by the game clock, never the wall clock, so a frame
  // is a pure function of the world state and replays byte-identically.
  const pulse = low ? 0.6 + 0.4 * Math.sin(world.dayTime * 20) : 1;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, barX, 48, barWidth, 18, 9);
  ctx.fill();
  ctx.fillStyle = low ? COLORS.timerLow : COLORS.timerGood;
  ctx.globalAlpha = pulse;
  roundRect(ctx, barX, 48, barWidth * fraction, 18, 9);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  const remaining = Math.max(0, Math.ceil(150 - world.dayTime));
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  ctx.fillText('SHIFT ' + minutes + ':' + seconds, barX, 88);
}

/** A rush banner across the board while a rush hour is running. */
function drawRushBanner(ctx, world) {
  const rush = world.activeRush();
  if (!rush) return;
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, CANVAS_WIDTH / 2 - 150, 76, 300, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ ' + rush.label + ' — ORDERS x2 ⚡', CANVAS_WIDTH / 2, 89);
}

/** One order ticket: customer, dish, ingredient marks and the patience bar. */
function drawOrderTicket(ctx, world, order, x, y, width, height) {
  const { recipe, customer } = world.orderDetails(order);
  const fraction = patienceFraction(order);
  const urgent = fraction < 0.35;
  ctx.fillStyle = urgent ? '#ffe1d6' : COLORS.board;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e4572e' : COLORS.boardEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();

  // Customer face: a coloured disc with their initial.
  ctx.fillStyle = customer.color;
  ctx.beginPath();
  ctx.arc(x + 24, y + 24, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(customer.name[0], x + 24, y + 25);

  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('#' + order.number + ' ' + customer.name, x + 48, y + 18);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(recipe.name, x + 48, y + 40);

  // Ingredient marks: filled when that step is already on the plate.
  let markX = x + 12;
  for (const step of recipe.steps) {
    const ingredient = findIngredient(step.ingredient);
    const onPlate = world.plate.includes(step.ingredient) && world.plateReady !== recipe.id;
    const done = world.plateReady === recipe.id;
    ctx.fillStyle = done || onPlate ? ingredient.color : '#d8cbb2';
    ctx.beginPath();
    ctx.arc(markX + 11, y + 66, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = done || onPlate ? '#2b1d12' : '#6b5a44';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ingredient.mark, markX + 11, y + 67);
    markX += 28;
  }
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('$' + recipe.price, x + width - 12, y + 66);

  // Patience bar: green while fresh, red as the customer runs out of patience.
  ctx.fillStyle = '#d8cbb2';
  roundRect(ctx, x + 12, y + height - 16, width - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#7ac74f' : fraction > 0.25 ? '#e8a33d' : '#e4572e';
  roundRect(ctx, x + 12, y + height - 16, (width - 24) * fraction, 8, 4);
  ctx.fill();
  ctx.textAlign = 'left';
}

/** The order board: tickets in a row, or an empty-board note. */
function drawOrderBoard(ctx, world) {
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDER BOARD', 20, 122);
  ctx.fillStyle = '#c9b8a3';
  ctx.font = '13px sans-serif';
  ctx.fillText('click a station, then the plate, then SERVE', 170, 122);

  if (world.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('No orders yet — the market is waking up…', 20, 170);
    return;
  }
  const ticketWidth = 296;
  world.orders.slice(0, 4).forEach((order, index) => {
    drawOrderTicket(ctx, world, order, 20 + index * (ticketWidth + 8), 134, ticketWidth, 92);
  });
}

/** One station: coloured counter, big label, icon, progress, finished item. */
function drawStation(ctx, station) {
  const { x, y } = station;
  ctx.fillStyle = COLORS.counterWood;
  roundRect(ctx, x - 4, y - 4, STATION_WIDTH + 8, STATION_HEIGHT + 8, 12);
  ctx.fill();
  ctx.fillStyle = station.color;
  roundRect(ctx, x, y, STATION_WIDTH, 44, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(station.label, x + STATION_WIDTH / 2, y + 22);

  // The station's worktop, with its own drawn icon.
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(x, y + 44, STATION_WIDTH, STATION_HEIGHT - 44);
  drawStationIcon(ctx, station.id, x + STATION_WIDTH / 2, y + 92);

  if (station.state === 'busy') {
    const fraction = stationProgressFraction(station);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, x + 14, y + STATION_HEIGHT - 30, STATION_WIDTH - 28, 14, 7);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    roundRect(ctx, x + 14, y + STATION_HEIGHT - 30, (STATION_WIDTH - 28) * fraction, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(station.verb + '…', x + STATION_WIDTH / 2, y + STATION_HEIGHT - 44);
  } else if (station.state === 'done' && station.item) {
    const ingredient = findIngredient(station.item);
    ctx.fillStyle = '#7ac74f';
    roundRect(ctx, x + 14, y + STATION_HEIGHT - 30, STATION_WIDTH - 28, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('READY: ' + ingredient.name, x + STATION_WIDTH / 2, y + STATION_HEIGHT - 19);
  } else if (station.id === 'plate' || station.id === 'serve') {
    ctx.fillStyle = '#f2e3c6';
    ctx.font = '13px sans-serif';
    ctx.fillText(station.id === 'plate' ? 'assemble here' : 'deliver here', x + STATION_WIDTH / 2, y + STATION_HEIGHT - 18);
  }
}

/** A small drawn icon per station, so each counter reads at a glance. */
function drawStationIcon(ctx, stationId, cx, cy) {
  ctx.strokeStyle = '#f2e3c6';
  ctx.fillStyle = '#f2e3c6';
  ctx.lineWidth = 3;
  if (stationId === 'chop') {
    ctx.fillRect(cx - 26, cy - 4, 52, 8);
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 22);
    ctx.lineTo(cx + 26, cy - 4);
    ctx.lineTo(cx + 6, cy - 4);
    ctx.closePath();
    ctx.fill();
  } else if (stationId === 'wok') {
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 26, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#e4572e';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 8);
    ctx.quadraticCurveTo(cx, cy + 22, cx + 18, cy + 8);
    ctx.stroke();
  } else if (stationId === 'grill') {
    ctx.strokeRect(cx - 26, cy - 12, 52, 26);
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 3);
    ctx.lineTo(cx + 26, cy - 3);
    ctx.moveTo(cx - 26, cy + 6);
    ctx.lineTo(cx + 26, cy + 6);
    ctx.stroke();
  } else if (stationId === 'steam') {
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 22, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 12);
    ctx.quadraticCurveTo(cx - 16, cy - 22, cx - 10, cy - 30);
    ctx.moveTo(cx + 8, cy - 12);
    ctx.quadraticCurveTo(cx + 2, cy - 22, cx + 8, cy - 30);
    ctx.stroke();
  } else if (stationId === 'plate') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stationId === 'serve') {
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 20);
    ctx.moveTo(cx - 12, cy + 20);
    ctx.lineTo(cx + 12, cy + 20);
    ctx.stroke();
  }
}

/** The chef: apron, hat, and the ingredients carried overhead. */
function drawChef(ctx, world) {
  const { x, y } = world.chef;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#f2e3c6';
  roundRect(ctx, x - 18, y - 8, 36, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#c73e3a';
  ctx.fillRect(x - 18, y + 8, 36, 6);
  // Head and chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath();
  ctx.arc(x, y - 28, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 12, y - 30, 24, 6);
  // Ingredients in hand, carried overhead where the eye finds them.
  world.hands.forEach((ingredientId, index) => {
    const ingredient = findIngredient(ingredientId);
    const dotX = x - (world.hands.length - 1) * 12 + index * 24;
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(dotX, y - 46, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2b1d12';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ingredient.mark, dotX, y - 45);
  });
}

/** The tray of finished cooking, and the plate being assembled. */
function drawTrayAndPlate(ctx, world) {
  // Tray: finished items waiting to be plated, right of the stations.
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRAY', 20, 440);
  if (world.tray.length === 0) {
    ctx.fillStyle = '#c9b8a3';
    ctx.font = '13px sans-serif';
    ctx.fillText('finished cooking lands here', 70, 440);
  }
  world.tray.forEach((ingredientId, index) => {
    const ingredient = findIngredient(ingredientId);
    const dotX = 150 + index * 30;
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(dotX, 440, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2b1d12';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ingredient.mark, dotX, 441);
  });

  // The plate: a white disc showing what is on it, glowing when a recipe matches.
  const plateX = 640;
  const plateY = 472;
  if (world.plateReady) {
    ctx.fillStyle = 'rgba(122,199,79,0.35)';
    ctx.beginPath();
    ctx.arc(plateX, plateY, 52, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.plateWhite;
  ctx.beginPath();
  ctx.ellipse(plateX, plateY, 58, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = world.plateReady ? '#7ac74f' : '#c9b8a3';
  ctx.lineWidth = world.plateReady ? 4 : 2;
  ctx.stroke();
  if (world.plate.length === 0) {
    ctx.fillStyle = '#8a7a64';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty plate', plateX, plateY + 1);
  } else {
    world.plate.forEach((ingredientId, index) => {
      const ingredient = findIngredient(ingredientId);
      const dotX = plateX - (world.plate.length - 1) * 16 + index * 32;
      ctx.fillStyle = ingredient.color;
      ctx.beginPath();
      ctx.arc(dotX, plateY - 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#2b1d12';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ingredient.mark, dotX, plateY - 1);
    });
  }
  if (world.plateReady) {
    ctx.fillStyle = '#7ac74f';
    roundRect(ctx, plateX - 90, plateY + 36, 180, 26, 13);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ READY TO SERVE', plateX, plateY + 49);
  } else if (world.plate.length > 0) {
    ctx.fillStyle = '#e8a33d';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('mid-assembly — keep adding…', plateX, plateY + 48);
  }

  // The clear-plate bin, next to the SERVE station.
  ctx.fillStyle = '#5a4a3a';
  roundRect(ctx, 1024, 470, 64, 30, 6);
  ctx.fill();
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🗑 BIN', 1056, 485);
}

/** The pantry bins along the bottom counter: 18 ingredients, two rows. */
function drawIngredientBins(ctx, world) {
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PANTRY — click an ingredient to pick it up (hands hold 3)', 20, 540);
  INGREDIENTS.forEach((ingredient, index) => {
    const column = index % 9;
    const row = Math.floor(index / 9);
    const binX = BIN_START_X + column * (BIN_WIDTH + BIN_GAP);
    const binY = BIN_START_Y + row * (BIN_HEIGHT + BIN_GAP);
    const inHand = world.hands.includes(ingredient.id);
    ctx.fillStyle = inHand ? '#e8a33d' : COLORS.board;
    roundRect(ctx, binX, binY, BIN_WIDTH, BIN_HEIGHT, 8);
    ctx.fill();
    ctx.strokeStyle = inHand ? '#ffffff' : COLORS.boardEdge;
    ctx.lineWidth = inHand ? 3 : 1;
    ctx.stroke();
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(binX + 22, binY + BIN_HEIGHT / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2b1d12';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ingredient.mark, binX + 22, binY + BIN_HEIGHT / 2 + 1);
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ingredient.name, binX + 42, binY + 22);
    ctx.fillStyle = '#6b5a44';
    ctx.font = '11px sans-serif';
    ctx.fillText(ingredient.station ? '→ ' + ingredient.station.toUpperCase() : '→ plate', binX + 42, binY + 40);
  });
}

/** The running message line, in the thin strip under the pantry bins. */
function drawMessage(ctx, world) {
  if (!world.message || world.messageTimer <= 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const width = ctx.measureText(world.message).width + 32;
  roundRect(ctx, CANVAS_WIDTH / 2 - width / 2, 688, width, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.message, CANVAS_WIDTH / 2, 701);
}

/** The title screen: name, counts, how to play, and the start button. */
function drawTitleScreen(ctx, world) {
  ctx.fillStyle = 'rgba(12,6,26,0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER & THYME', CANVAS_WIDTH / 2, 150);
  ctx.fillStyle = '#f2e3c6';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('A night-market wok kitchen', CANVAS_WIDTH / 2, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  ctx.fillText('12 recipes  •  6 stations  •  18 ingredients  •  3 rushes a day  •  5 customers', CANVAS_WIDTH / 2, 250);
  ctx.font = '18px sans-serif';
  ctx.fillText('Click a pantry ingredient, click its station to cook it, plate it, serve it.', CANVAS_WIDTH / 2, 300);
  ctx.fillText('Serve fast for tips — chain serves for combos. 3 days, 3 hearts.', CANVAS_WIDTH / 2, 330);
  ctx.fillText('Keys: 1–6 walk to a station • Space uses it • B bins the plate', CANVAS_WIDTH / 2, 360);
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2 + 40, 280, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('OPEN THE STALL', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 68);
}

/** The day-end and festival-end screens, with the run's numbers. */
function drawEndScreen(ctx, world) {
  const summary = world.daySummary || { day: world.day, score: world.score, dishes: 0, lost: 0, bestCombo: 0 };
  ctx.fillStyle = 'rgba(12,6,26,0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const title = world.screen === 'over' ? 'FESTIVAL OVER' : 'DAY ' + summary.day + ' DONE';
  ctx.fillText(title, CANVAS_WIDTH / 2, 170);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Score: ' + summary.score + ' coins', CANVAS_WIDTH / 2, 240);
  ctx.font = '20px sans-serif';
  ctx.fillText('Dishes served: ' + summary.dishes + '   •   Orders lost: ' + summary.lost + '   •   Best combo: x' + summary.bestCombo, CANVAS_WIDTH / 2, 290);
  if (world.screen === 'over') {
    ctx.fillText('The market closes. Thanks for cooking at EMBER & THYME!', CANVAS_WIDTH / 2, 330);
  } else {
    ctx.fillText('The crowd grows hungrier tomorrow. Restock and go again.', CANVAS_WIDTH / 2, 330);
  }
  const button = world.screen === 'over' ? 'COOK AGAIN' : 'START DAY ' + (summary.day + 1);
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2 + 40, 280, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(button, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 68);
}

/**
 * Draw the whole game. `screen` overrides the world's screen (the screenshot
 * scenes use it to show the title over a live kitchen, for example).
 */
export function render(ctx, world, screen = null) {
  const activeScreen = screen || world.screen;
  drawBackground(ctx);
  drawHud(ctx, world);
  drawRushBanner(ctx, world);
  drawOrderBoard(ctx, world);
  for (const station of world.stations) drawStation(ctx, station);
  drawTrayAndPlate(ctx, world);
  drawChef(ctx, world);
  drawIngredientBins(ctx, world);
  drawMessage(ctx, world);
  if (activeScreen === 'title') drawTitleScreen(ctx, world);
  if (activeScreen === 'dayEnd' || activeScreen === 'over') drawEndScreen(ctx, world);
}
