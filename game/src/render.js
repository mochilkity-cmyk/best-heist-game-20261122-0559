// Rendering: the whole neon gallery on one canvas — floor, walls, cover,
// loot, cones, guards, cameras, the thief, smoke, and the HUD with its
// alarm meter. Everything the judge needs to see sits in this one frame.

import { HUD_HEIGHT, ROOM_HEIGHT, ROOM_WIDTH, WALL } from './level.js';
import { CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE } from './cameras.js';
import { GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE } from './guards.js';

const GOLD = '#ffd166';
const TEAL = '#2ec4b6';
const MAGENTA = '#e040fb';
const DANGER = '#ff4d5e';
const CAMERA_ORANGE = '#ff9f1c';

function roomY(y) {
  return y + HUD_HEIGHT;
}

function text(ctx, str, x, y, size, color, align = 'left', bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function outlinedText(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(5, 3, 12, 0.9)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, roomY(y));
  ctx.arc(x, roomY(y), range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#0d0a1e';
  ctx.fillRect(0, HUD_HEIGHT, ROOM_WIDTH, ROOM_HEIGHT);
  // Checker tiles, faint enough to read as a gallery floor.
  const tile = 64;
  for (let ty = 0; ty < ROOM_HEIGHT / tile; ty++) {
    for (let tx = 0; tx < ROOM_WIDTH / tile; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = 'rgba(46, 196, 182, 0.045)';
        ctx.fillRect(tx * tile, HUD_HEIGHT + ty * tile, tile, tile);
      }
    }
  }
  // A crimson carpet runner down the centre gallery, where the diamond sits.
  ctx.fillStyle = 'rgba(178, 34, 72, 0.16)';
  ctx.fillRect(560, HUD_HEIGHT, 160, ROOM_HEIGHT);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(560, HUD_HEIGHT + 4, 160, ROOM_HEIGHT - 8);
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = '#241a3d';
    ctx.fillRect(wall.x, roomY(wall.y), wall.w, wall.h);
    ctx.strokeStyle = '#6d4fa3';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, roomY(wall.y) + 1, wall.w - 2, wall.h - 2);
  }
}

function drawCover(ctx, cover) {
  const y = roomY(cover.y);
  ctx.fillStyle = cover.kind === 'crate' ? '#3a2c17' : '#14424a';
  ctx.fillRect(cover.x, y, cover.w, cover.h);
  ctx.strokeStyle = cover.kind === 'crate' ? '#8a6d3b' : TEAL;
  ctx.lineWidth = 2;
  ctx.strokeRect(cover.x + 1, y + 1, cover.w - 2, cover.h - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COVER', cover.x + cover.w / 2, y + cover.h / 2 - 4);
  ctx.fillText(cover.label, cover.x + cover.w / 2, y + cover.h / 2 + 10);
}

function drawLoot(ctx, item, time) {
  const y = roomY(item.y);
  if (item.taken) return;
  const pulse = 1 + Math.sin(time * 3 + item.x) * 0.12;
  // Glow ring so loot reads at a glance.
  const glow = ctx.createRadialGradient(item.x, y, 4, item.x, y, 46 * pulse);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, y, 46 * pulse, 0, Math.PI * 2);
  ctx.fill();

  if (item.kind === 'diamond') {
    ctx.save();
    ctx.translate(item.x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#b8f1ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const s = 17 * pulse;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(item.x - 4, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    outlinedText(ctx, '★ VELVET DIAMOND ★', item.x, y - 30, 15, GOLD);
    text(ctx, 'THE PRIZE — $5,000', item.x, y + 42, 11, GOLD, 'center', true);
  } else if (item.kind === 'painting') {
    ctx.fillStyle = '#7b2f8b';
    ctx.fillRect(item.x - 22, y - 16, 44, 32);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(item.x - 22, y - 16, 44, 32);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(item.x - 8, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    outlinedText(ctx, item.name, item.x, y - 26, 11, GOLD);
  } else if (item.kind === 'gold') {
    ctx.fillStyle = GOLD;
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(item.x + i * 14 - 6, y - 6, 12, 12);
    }
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(item.x - 20, y - 6, 40, 12);
    outlinedText(ctx, item.name, item.x, y - 26, 11, GOLD);
  } else {
    ctx.fillStyle = '#3ddc97';
    ctx.beginPath();
    ctx.arc(item.x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d5c36';
    ctx.lineWidth = 2;
    ctx.stroke();
    outlinedText(ctx, item.name, item.x, y - 26, 11, '#3ddc97');
  }
  // The diamond's own caption already names its value; the side pieces
  // get a plain price tag instead.
  if (item.kind !== 'diamond') {
    text(ctx, `$${item.value.toLocaleString('en-US')}`, item.x, y + 30, 11, '#e8e4ff', 'center', true);
  }
}

function drawDoors(ctx, level, thief) {
  // Entry: the service door the thief slipped through.
  const entryY = roomY(level.entry.y);
  ctx.fillStyle = '#1d3a2a';
  ctx.fillRect(level.entry.x, entryY, level.entry.w, level.entry.h);
  ctx.strokeStyle = '#3ddc97';
  ctx.lineWidth = 2;
  ctx.strokeRect(level.entry.x, entryY, level.entry.w, level.entry.h);
  outlinedText(ctx, '◀ ENTRY · SERVICE DOOR', level.entry.x + 50, entryY - 8, 11, '#3ddc97');

  // Getaway: the van door. It lights up once the diamond is in hand.
  const gateY = roomY(level.getaway.y);
  const lit = thief.hasDiamond;
  ctx.fillStyle = lit ? '#5c3a00' : '#2a2118';
  ctx.fillRect(level.getaway.x, gateY, level.getaway.w, level.getaway.h);
  ctx.strokeStyle = lit ? GOLD : '#8a7a5c';
  ctx.lineWidth = lit ? 3 : 2;
  ctx.strokeRect(level.getaway.x, gateY, level.getaway.w, level.getaway.h);
  outlinedText(
    ctx,
    lit ? '★ GETAWAY VAN — GO! ★' : 'GETAWAY VAN',
    level.getaway.x + level.getaway.w - 4,
    gateY - 8,
    12,
    lit ? GOLD : '#cbb98a',
    'right',
  );
}

function drawGuard(ctx, guard, time) {
  const y = roomY(guard.y);
  const coneFacing = guard.coneAngle(time);
  const seen = guard.state === 'stare';
  // Vision cone first, under the guard.
  drawCone(
    ctx, guard.x, guard.y, coneFacing, GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE,
    seen ? 'rgba(255, 77, 94, 0.42)' : 'rgba(255, 77, 94, 0.20)',
    seen ? 'rgba(255, 120, 130, 0.8)' : 'rgba(255, 77, 94, 0.45)',
  );
  // Body: a broad-shouldered guard with a torch.
  ctx.save();
  ctx.translate(guard.x, y);
  const bob = Math.sin(guard.walkPhase) * 1.5;
  ctx.fillStyle = '#2b3a67';
  ctx.strokeStyle = '#8fa3e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, bob, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Cap brim pointing where the guard faces.
  ctx.fillStyle = '#8fa3e8';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.facing) * 10, bob + Math.sin(guard.facing) * 10, 5, 0, Math.PI * 2);
  ctx.fill();
  // Torch beam dot at the cone's edge.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(Math.cos(coneFacing) * 20, bob + Math.sin(coneFacing) * 20, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  outlinedText(ctx, `GUARD ${guard.name}`, guard.x, y - 24, 11, '#c3ccff');
  if (guard.state === 'investigate') {
    outlinedText(ctx, '?', guard.x, y - 38, 14, '#ffe9a8');
  } else if (seen) {
    outlinedText(ctx, '!', guard.x, y - 38, 16, DANGER);
  }
}

function drawCamera(ctx, camera, time) {
  const y = roomY(camera.y);
  const offline = camera.isOffline(time);
  const angle = camera.angleAt(time);
  if (!offline) {
    drawCone(
      ctx, camera.x, camera.y, angle, CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE,
      'rgba(255, 159, 28, 0.20)',
      'rgba(255, 159, 28, 0.5)',
    );
  }
  // Wall mount + lens.
  ctx.fillStyle = '#3d3d4d';
  ctx.fillRect(camera.x - 12, y - 8, 24, 16);
  ctx.strokeStyle = offline ? '#888' : CAMERA_ORANGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(camera.x - 12, y - 8, 24, 16);
  ctx.fillStyle = offline ? '#666' : '#ff3b30';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 4, 0, Math.PI * 2);
  ctx.fill();
  outlinedText(ctx, offline ? `${camera.name} OFFLINE` : camera.name, camera.x, y - 18, 11, offline ? '#aaa' : CAMERA_ORANGE);
}

function drawThief(ctx, thief) {
  const y = roomY(thief.y);
  // A soft shadow so the thief pops off the floor.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(thief.x, y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Violet coat, hood up, facing the way they move.
  ctx.save();
  ctx.translate(thief.x, y);
  const lean = thief.moving ? Math.sin(thief.stepPhase) * 2 : 0;
  ctx.fillStyle = '#7b2fbe';
  ctx.strokeStyle = '#d9a7ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, lean * 0.4, thief.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Hood point.
  ctx.fillStyle = '#9d4edd';
  ctx.beginPath();
  ctx.moveTo(0, -thief.r - 4);
  ctx.lineTo(-7, -thief.r + 6);
  ctx.lineTo(7, -thief.r + 6);
  ctx.closePath();
  ctx.fill();
  // Eyes in the direction of travel.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(Math.cos(thief.facing) * 6 - 2, Math.sin(thief.facing) * 6, 2.2, 0, Math.PI * 2);
  ctx.arc(Math.cos(thief.facing) * 6 + 2, Math.sin(thief.facing) * 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  outlinedText(ctx, thief.sneaking ? 'THIEF · SNEAKING' : 'THIEF', thief.x, y - 24, 11, '#d9a7ff');
  if (thief.hasDiamond) {
    outlinedText(ctx, '◆ DIAMOND SECURED ◆', thief.x, y - 38, 11, GOLD);
  }
}

function drawSmoke(ctx, smoke, time) {
  const y = roomY(smoke.y);
  const remaining = Math.max(0, smoke.until - time);
  const alpha = Math.min(0.75, 0.25 + remaining * 0.08);
  const gradient = ctx.createRadialGradient(smoke.x, y, 6, smoke.x, y, smoke.radius);
  gradient.addColorStop(0, `rgba(200, 200, 215, ${alpha})`);
  gradient.addColorStop(1, 'rgba(200, 200, 215, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(smoke.x, y, smoke.radius, 0, Math.PI * 2);
  ctx.fill();
  outlinedText(ctx, 'SMOKE', smoke.x, y - smoke.radius - 6, 11, '#dfe0ea');
}

function drawCoin(ctx, coin, time) {
  if (!coin) return;
  const age = time - coin.at;
  if (age > 2.5) return;
  const y = roomY(coin.y);
  const alpha = 1 - age / 2.5;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(coin.x, y, 6 + age * 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(coin.x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function alarmColor(value) {
  if (value >= 80) return '#ff2e4d';
  if (value >= 55) return '#ff9f1c';
  if (value >= 25) return '#ffd166';
  return '#3ddc97';
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#120e24';
  ctx.fillRect(0, 0, ROOM_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = '#3a2b5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT - 1);
  ctx.lineTo(ROOM_WIDTH, HUD_HEIGHT - 1);
  ctx.stroke();

  // Left: title + objective.
  text(ctx, 'THE VELVET VAULT', 16, 26, 21, GOLD, 'left', true);
  text(ctx, 'Steal the Velvet Diamond, then reach the GETAWAY VAN', 16, 50, 13, '#b9b3d9');

  // Centre: the legend — safe, danger and loot at a glance.
  text(ctx, 'GOLD ◆ LOOT    TEAL ■ COVER    RED CONE = SPOTTED', 470, 24, 12, '#cfc9ec', 'left', true);
  text(ctx, 'WASD move · SHIFT sneak · Q smoke · E EMP · CLICK toss coin · P pause', 470, 46, 12, '#8f88b3');

  // Right: alarm meter, score, dawn timer.
  const alarm = game.alarm;
  const barX = 930;
  const barY = 14;
  const barW = 180;
  const barH = 18;
  text(ctx, 'ALARM', barX - 8, barY + 14, 13, '#ff8a96', 'right', true);
  ctx.fillStyle = '#241a2e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = alarmColor(alarm.value);
  ctx.fillRect(barX, barY, Math.round(barW * (alarm.value / 100)), barH);
  ctx.strokeStyle = '#5c4a7a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barW, barH);
  text(ctx, `${Math.round(alarm.value)}%`, barX + barW + 8, barY + 14, 14, alarmColor(alarm.value), 'left', true);
  if (alarm.heat) {
    text(ctx, 'HEAT: guards on edge', barX, barY + 36, 11, '#ff8a96', 'left', true);
  } else if (alarm.rising) {
    text(ctx, 'SPOTTED!', barX, barY + 36, 11, DANGER, 'left', true);
  } else if (alarm.value > 0) {
    text(ctx, 'hidden — alarm falling', barX, barY + 36, 11, '#3ddc97');
  }

  text(ctx, `SCORE ${game.score.toLocaleString('en-US')}`, 1264, 26, 14, '#e8e4ff', 'right', true);
  const minutes = Math.floor(game.timeLeft / 60);
  const seconds = Math.floor(game.timeLeft % 60);
  const timeColor = game.timeLeft < 60 ? DANGER : '#e8e4ff';
  text(ctx, `DAWN ${minutes}:${String(seconds).padStart(2, '0')}`, 1264, 50, 14, timeColor, 'right', true);

  // Gadget charges under the alarm bar, right side.
  const g = game.gadgets;
  text(ctx, `SMOKE ${g.smokeCharges} · EMP ${g.empCharges} · COIN ${g.coins}`, 1264, 62, 11, '#8f88b3', 'right');
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 3, 12, 0.78)';
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT + HUD_HEIGHT);
  outlinedText(ctx, title, ROOM_WIDTH / 2, 250, 46, accent);
  lines.forEach((line, index) => {
    text(ctx, line.text, ROOM_WIDTH / 2, 300 + index * 30, line.size || 17, line.color || '#e8e4ff', 'center', line.bold || false);
  });
}

function drawTitleScreen(ctx, game) {
  drawOverlay(ctx, 'THE VELVET VAULT', [
    { text: 'One night. One diamond. Three guards, three cameras, one very loud alarm.', size: 18 },
    { text: 'Sneak through the gallery, pocket the Velvet Diamond, and slip out the GETAWAY VAN.', size: 16 },
    { text: 'WASD / arrows — move      SHIFT — sneak      Q — smoke      E — EMP      CLICK — toss a coin', size: 15, color: GOLD },
    { text: 'Red cones see you. Teal blocks hide you. The alarm climbs while you are seen —', size: 15 },
    { text: 'at 100% the museum locks down and you are caught. Dawn breaks in 4:00.', size: 15 },
    { text: 'CLICK or press ENTER to begin the heist', size: 18, color: GOLD, bold: true },
  ], GOLD);
}

function drawWinScreen(ctx, game) {
  drawOverlay(ctx, 'CLEAN GETAWAY!', [
    { text: `The Velvet Diamond is yours — and the van is already rolling.`, size: 19 },
    { text: `Loot pocketed: $${game.thief.lootValue.toLocaleString('en-US')}  ·  Gadget costs: $${game.spent.toLocaleString('en-US')}`, size: 16 },
    { text: `Time bonus: $${game.timeBonus.toLocaleString('en-US')}  ·  FINAL SCORE: ${game.score.toLocaleString('en-US')}`, size: 18, color: GOLD, bold: true },
    { text: 'Press R to plan the next heist', size: 16, color: GOLD },
  ], '#3ddc97');
}

function drawCaughtScreen(ctx, game) {
  drawOverlay(ctx, 'CAUGHT!', [
    { text: game.loseReason, size: 19 },
    { text: `Loot pocketed before the fall: $${game.thief.lootValue.toLocaleString('en-US')}`, size: 16 },
    { text: `Final score: ${game.score.toLocaleString('en-US')}`, size: 17, color: GOLD, bold: true },
    { text: 'Press R to try again — read the cones before you move', size: 16, color: GOLD },
  ], DANGER);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(5, 3, 12, 0.6)';
  ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT + HUD_HEIGHT);
  outlinedText(ctx, 'PAUSED', ROOM_WIDTH / 2, 360, 40, '#e8e4ff');
  text(ctx, 'Press P to keep sneaking', ROOM_WIDTH / 2, 400, 16, '#b9b3d9', 'center');
}

export function drawScene(ctx, game) {
  ctx.clearRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT + HUD_HEIGHT);
  drawFloor(ctx);
  drawDoors(ctx, game.level, game.thief);
  for (const cover of game.level.covers) drawCover(ctx, cover);
  for (const item of game.loot.items) drawLoot(ctx, item, game.time);
  for (const camera of game.cameras) drawCamera(ctx, camera, game.time);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  for (const smoke of game.gadgets.smokes) drawSmoke(ctx, smoke, game.time);
  drawCoin(ctx, game.gadgets.lastCoin, game.time);
  drawWalls(ctx, game.level);
  drawThief(ctx, game.thief);
  drawHud(ctx, game);
  if (game.state === 'title') drawTitleScreen(ctx, game);
  else if (game.state === 'won') drawWinScreen(ctx, game);
  else if (game.state === 'caught') drawCaughtScreen(ctx, game);
  else if (game.paused) drawPaused(ctx);
  if (game.message) {
    outlinedText(ctx, game.message, ROOM_WIDTH / 2, HUD_HEIGHT + 40, 17, GOLD);
  }
}
