// Staged shots: ?shot=cover|play|stealth|getaway freezes the museum at a
// chosen moment so screenshots are reproducible. Each preset places the
// thief, the guards and the alarm at fixed spots and stops the clock —
// the frame a screenshot takes is the frame the preset describes.

export function applyShot(game, name) {
  const level = game.level;
  const presets = {
    // The cover: the whole game in one frame — room, cones, cameras, loot,
    // thief mid-sneak and the alarm already climbing.
    cover: () => {
      game.thief.x = 620;
      game.thief.y = 480;
      game.thief.sneaking = true;
      game.thief.facing = -Math.PI / 2;
      game.alarm.value = 32;
      game.score = 1250;
      game.spent = 0;
      game.time = 48;
      game.timeLeft = 192;
      game.message = 'The Velvet Diamond glitters at the far end of the gallery…';
      placeGuard(game, 0, 720, 210, -Math.PI / 2);
      placeGuard(game, 1, 700, 380, Math.PI);
      placeGuard(game, 2, 780, 600, Math.PI);
    },
    // Mid-play: the thief creeps toward the gold bars while Bruno's cone
    // sweeps the top gallery.
    play: () => {
      game.thief.x = 250;
      game.thief.y = 210;
      game.thief.sneaking = true;
      game.thief.facing = -2.49;
      game.alarm.value = 18;
      game.score = 0;
      game.spent = 0;
      game.time = 24;
      game.timeLeft = 216;
      game.message = 'Gold bars, unguarded for one more second…';
      placeGuard(game, 0, 500, 95, 0);
      placeGuard(game, 1, 420, 340, Math.PI / 2);
      placeGuard(game, 2, 620, 600, 0);
    },
    // Stealth: a smoke puff swallows the thief while a camera cone rakes
    // the spot they just left, alarm high and falling.
    stealth: () => {
      game.thief.x = 905;
      game.thief.y = 300;
      game.thief.sneaking = true;
      game.thief.facing = Math.PI;
      game.alarm.value = 55;
      game.score = 2000;
      game.spent = 50;
      game.gadgets.smokeCharges = 2;
      game.gadgets.smokes = [{ x: 905, y: 300, radius: 92, until: 9999 }];
      game.time = 96;
      game.timeLeft = 144;
      game.message = 'Smoke! The cameras see nothing — move now.';
      placeGuard(game, 0, 830, 240, 0.6);
      placeGuard(game, 1, 1060, 480, -Math.PI / 2);
      placeGuard(game, 2, 700, 600, Math.PI);
    },
    // The getaway: diamond secured, alarm screaming, the van door glowing.
    getaway: () => {
      game.thief.x = 1180;
      game.thief.y = 625;
      game.thief.sneaking = false;
      game.thief.facing = Math.PI / 2;
      game.thief.hasDiamond = true;
      game.thief.lootValue = 6200;
      game.thief.lootCount = 2;
      game.loot.items.find((item) => item.main).taken = true;
      game.alarm.value = 78;
      game.alarm.heat = true;
      game.score = 6200;
      game.spent = 200;
      game.gadgets.empCharges = 0;
      game.gadgets.smokeCharges = 1;
      game.time = 180;
      game.timeLeft = 60;
      game.message = '★ DIAMOND SECURED — RUN FOR THE VAN! ★';
      placeGuard(game, 0, 810, 250, Math.PI / 2);
      placeGuard(game, 1, 980, 500, Math.PI / 2);
      placeGuard(game, 2, 950, 600, Math.PI);
    },
  };

  const preset = presets[name];
  if (!preset) return false;
  preset();
  game.state = 'playing';
  game.frozen = true;
  game.paused = false;
  return true;
}

function placeGuard(game, index, x, y, facing) {
  const guard = game.guards[index];
  if (!guard) return;
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.state = 'patrol';
}
