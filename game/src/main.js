// SHADOW VAULT — The Lantern Heist. Entry point: screens, input, HUD wiring
// and the deterministic ?shot= scenes the screenshots are taken from.
// You are the Wisp, a polite little thief. Lift every golden relic on each
// vault floor and slip out of the exit door unseen. Guards patrol with
// lanterns: their cones are real sight — shelves block them, shadow rugs and
// crawling bend them, lantern light betrays you. A full meter means a hunt,
// but break line of sight and it cools. Coins are noise on a string.
import { World, EV } from './world.js';
import { LEVELS } from './levels.js';
import { drawWorld } from './render.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const banner = document.getElementById('banner');
const keys = new Set();
let mouse = { x: 480, y: 300 };
let screen = 'title'; // title | play | caught | level | win
let world = new World();
let screenT = 0, last = performance.now(), ghost = true;

addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
  if (screen !== 'play' && (e.key === 'Enter' || e.key === ' ')) startGame();
  else if (e.key.toLowerCase() === 'q' && screen === 'play') doThrow();
  else if (e.key.toLowerCase() === 'r' && screen !== 'play') startGame();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mouse = { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) }; });
canvas.addEventListener('click', () => { if (screen === 'play') doThrow(); else startGame(); });
document.getElementById('startBtn').addEventListener('click', startGame);

function doThrow() { if (world.throwCoin(mouse.x, mouse.y) & EV.COIN) sfx.coin(); }
function startGame() { world = new World(); ghost = true; screen = 'play'; screenT = 0; sfx.click(); }

function input() {
  return {
    x: (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0),
    y: (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0),
    crawl: keys.has('shift') || keys.has('c'),
    sprint: keys.has('e') || keys.has('control'),
  };
}

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now; screenT += dt;
  const t = now / 1000;
  if (screen === 'play') {
    const ev = world.step(dt, input());
    if (ev & EV.STEP) sfx.step();
    if (ev & EV.RELIC) sfx.relic();
    if (ev & EV.SPOTTED) { sfx.spotted(); ghost = false; }
    if (ev & EV.CAUGHT) {
      sfx.caught(); world.lives--;
      if (world.lives <= 0) { screen = 'over'; }
      else { screen = 'caught'; const li = world.levelIndex, sc = world.score; world.loadLevel(li); world.score = sc; }
      screenT = 0;
    }
    if (ev & EV.LEVEL_DONE) {
      sfx.door();
      if (world.levelIndex + 1 >= LEVELS.length) screen = 'win';
      else { const keep = { lives: world.lives, score: world.score }; world.loadLevel(world.levelIndex + 1); Object.assign(world, keep); screen = 'level'; }
      screenT = 0;
    }
  }
  drawWorld(ctx, world, t);
  drawOverlay(t);
  updateHud();
  if (screen === 'caught' && screenT > 1.4) screen = 'play';
  if (screen === 'level' && screenT > 2.2) screen = 'play';
  requestAnimationFrame(frame);
}

function panel(title, lines, foot) {
  ctx.fillStyle = 'rgba(6,8,16,0.78)'; ctx.fillRect(0, 0, 960, 600);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 52px system-ui';
  ctx.fillText(title, 480, 190);
  ctx.fillStyle = '#e8ecff'; ctx.font = '19px system-ui';
  lines.forEach((l, i) => ctx.fillText(l, 480, 245 + i * 30));
  ctx.fillStyle = '#9fe8e0'; ctx.font = 'bold 20px system-ui';
  ctx.fillText(foot, 480, 245 + lines.length * 30 + 26);
}
function drawOverlay(t) {
  if (screen === 'title') panel('SHADOW VAULT', [
    '🏮  The Lantern Heist  🏮', '',
    'Lift every golden relic. Slip out unseen.',
    'Guards see in cones — shelves block sight, shadow rugs hide you,',
    'lantern light betrays you. Fill a meter and the hunt is on.',
    'Throw coins to pull a guard away. Ghost a floor for +500.',
  ], 'Click or press Enter to begin');
  else if (screen === 'caught') panel('CAUGHT!', [`A lantern swings round — the Wisp scatters.`, `Lanterns left: ${world.lives}`], 'Back to the shadows…');
  else if (screen === 'level') panel(world.level.name, [world.level.tip], 'The door behind you sighs shut…');
  else if (screen === 'win') panel('A CLEAN GETAWAY 🌙', [
    `The vault wakes empty and none the wiser.`,
    `Final score: ${world.score}`, ghost && !world.seenEver ? '👻 PERFECT GHOST — never seen, all three floors' : 'The relics sing softly in your sack.',
  ], 'Press R to play again');
  else if (screen === 'over') panel('THE VAULT KEEPS ITS GOLD', [`Final score: ${world.score}`, 'Three lanterns found you. The relics wait for a quieter night.'], 'Press R to try again');
  // aim marker for the coin throw
  if (screen === 'play') {
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 8, 0, 7); ctx.strokeStyle = 'rgba(255,233,168,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x - 12, mouse.y); ctx.lineTo(mouse.x + 12, mouse.y); ctx.moveTo(mouse.x, mouse.y - 12); ctx.lineTo(mouse.x, mouse.y + 12); ctx.stroke();
  }
}
function updateHud() {
  const got = world.relics.filter((r) => r.taken).length;
  hud.textContent = screen === 'play' || screen === 'caught' || screen === 'level'
    ? `${world.level.name}   •   Relics ${got}/${world.relicsTotal}   •   Coins 🪙 ${world.player.coins} (click / Q to throw)   •   Lanterns 🏮 ${world.lives}   •   Score ${world.score}   •   WASD move · Shift sneak · E sprint (loud!)`
    : 'SHADOW VAULT — a stealth game of lanterns, shelves and shadow rugs';
  banner.textContent = world.alarm > 0.55 ? '⚠ THE HUNT IS ON — break line of sight! ⚠' : '';
}

// --- deterministic screenshot scenes (?shot=title|play|hunt|win) ---
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  world = new World();
  if (shot === 'play' || shot === 'hunt') {
    // Stage a mid-heist moment on Floor I: the Wisp crouched on a shadow rug
    // with a relic in reach, one guard turning toward the thrown coin.
    world.loadLevel(0);
    world.player.x = 205; world.player.y = 225; world.player.crawl = true; world.player.dir = 0.4;
    world.guards[0].x = 300; world.guards[0].y = 130; world.guards[0].dir = 2.2; world.guards[0].alert = 0.45;
    world.guards[1].x = 500; world.guards[1].y = 330; world.guards[1].dir = -0.6; world.guards[1].alert = shot === 'hunt' ? 1 : 0.1;
    if (shot === 'hunt') { world.guards[1].state = 'hunt'; world.alarm = 0.8; world.seenEver = true; }
    world.noises.push({ x: 560, y: 260, radius: 150, ttl: 0.45 });
    world.relics[0].taken = true; world.score = 290;
    screen = 'play';
  } else if (shot === 'win') {
    world.loadLevel(2); world.relics.forEach((r) => (r.taken = true)); world.score = 2740; screen = 'win';
  } else { screen = 'title'; }
  drawWorld(ctx, world, 1.2); drawOverlay(1.2); updateHud();
  document.title = 'shot-ready';
} else {
  requestAnimationFrame(frame);
}
