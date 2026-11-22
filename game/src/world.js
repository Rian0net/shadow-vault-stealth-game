// SHADOW VAULT — world simulation: guards with vision cones and line of sight,
// a detection meter that can cool back down, noise (sprinting, thrown coins),
// shadow rugs and lantern light that bend how fast you are seen.
import { LEVELS, TILE, COLS, ROWS } from './levels.js';

export const EV = { NONE: 0, CAUGHT: 1, LEVEL_DONE: 2, COIN: 4, RELIC: 8, SPOTTED: 16, STEP: 32 };

const FOV = (100 * Math.PI) / 180;
const SIGHT = 158;

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return level.rows[ty][tx];
}
export function solid(level, tx, ty) { return tileAt(level, tx, ty) === '#'; }

function losClear(level, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    if (solid(level, Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

function moveCircle(level, e, dx, dy, r) {
  // Axis-separated movement with shelf collision; shelves are cover, so the
  // player and guards both slide along them.
  let nx = e.x + dx;
  if (!hitsWall(level, nx, e.y, r)) e.x = nx;
  let ny = e.y + dy;
  if (!hitsWall(level, e.x, ny, r)) e.y = ny;
}
function hitsWall(level, x, y, r) {
  const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r], [x, y - r], [x, y + r], [x - r, y], [x + r, y]];
  return pts.some(([px, py]) => solid(level, Math.floor(px / TILE), Math.floor(py / TILE)));
}

export class World {
  constructor() { this.loadLevel(0); this.lives = 3; this.score = 0; this.time = 0; this.seenEver = false; }

  loadLevel(idx) {
    this.levelIndex = idx;
    this.level = LEVELS[idx];
    this.relics = []; this.coinStashes = []; this.exit = null;
    this.player = { x: 60, y: 60, r: 11, dir: 0, moving: false, crawl: false, coins: 3, speedWalk: 118 };
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      const c = this.level.rows[ty][tx], cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
      if (c === 'P') { this.player.x = cx; this.player.y = cy; }
      if (c === 'R') this.relics.push({ x: cx, y: cy, taken: false });
      if (c === 'o') this.coinStashes.push({ x: cx, y: cy, taken: false });
      if (c === 'E') this.exit = { x: cx, y: cy };
    }
    this.relicsTotal = this.relics.length;
    this.guards = this.level.guards.map((g) => ({
      path: g.path.map(([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 })),
      speed: g.speed, scan: !!g.scan, wp: 1, pause: 0, scanT: 0,
      x: g.path[0][0] * TILE + TILE / 2, y: g.path[0][1] * TILE + TILE / 2,
      dir: 0, alert: 0, state: 'patrol', tx: 0, ty: 0, waitT: 0,
    }));
    this.noises = []; this.thrown = null; this.alarm = 0; this.message = this.level.tip;
  }

  playerTile() { return tileAt(this.level, Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)); }

  throwCoin(tx, ty) {
    if (this.player.coins <= 0 || this.thrown) return EV.NONE;
    this.player.coins--;
    this.thrown = { x: this.player.x, y: this.player.y, tx, ty, t: 0 };
    return EV.COIN;
  }

  step(dt, input) {
    let ev = EV.NONE;
    this.time += dt;
    const p = this.player;
    // --- player movement: walk, sneak-crawl (Shift), sprint (noisy) ---
    let mx = input.x, my = input.y;
    const mag = Math.hypot(mx, my) || 1;
    p.crawl = !!input.crawl;
    p.moving = (mx !== 0 || my !== 0);
    const speed = p.crawl ? 58 : input.sprint ? 178 : p.speedWalk;
    if (p.moving) {
      p.dir = Math.atan2(my, mx);
      moveCircle(this.level, p, (mx / mag) * speed * dt, (my / mag) * speed * dt, p.r);
      if (!p.crawl && Math.random() < dt * (input.sprint ? 7 : 2.2)) ev |= EV.STEP;
      if (input.sprint) this.makeNoise(p.x, p.y, 74);
    }
    // --- thrown coin flight, then a bright *ting* that pulls nearby guards ---
    if (this.thrown) {
      const t = this.thrown; t.t += dt * 2.4;
      t.x += (t.tx - t.x) * Math.min(1, dt * 7); t.y += (t.ty - t.y) * Math.min(1, dt * 7);
      if (t.t >= 1) { this.makeNoise(t.tx, t.ty, 190); this.thrown = null; ev |= EV.COIN; }
    }
    // --- pickups ---
    for (const r of this.relics) if (!r.taken && Math.hypot(r.x - p.x, r.y - p.y) < 24) { r.taken = true; this.score += 250; ev |= EV.RELIC; }
    for (const c of this.coinStashes) if (!c.taken && Math.hypot(c.x - p.x, c.y - p.y) < 22) { c.taken = true; p.coins += 2; this.score += 40; }
    // --- exit: only opens once every relic on the floor is lifted ---
    if (this.exit && this.relics.every((r) => r.taken) && Math.hypot(this.exit.x - p.x, this.exit.y - p.y) < 26) {
      this.score += 400 + Math.max(0, 300 - Math.floor(this.time)) + (this.seenEver ? 0 : 500);
      return ev | EV.LEVEL_DONE;
    }
    // --- guards ---
    let anyHunt = false;
    for (const g of this.guards) { ev |= this.stepGuard(g, dt); if (g.state === 'hunt') anyHunt = true; }
    this.alarm = Math.max(0, Math.min(1, this.alarm + (anyHunt ? dt * 0.5 : -dt * 0.12)));
    for (const g of this.guards) {
      if (Math.hypot(g.x - p.x, g.y - p.y) < 21 && g.alert > 0.25) return ev | EV.CAUGHT;
    }
    this.noises = this.noises.filter((n) => (n.ttl -= dt) > 0);
    return ev;
  }

  makeNoise(x, y, radius) {
    this.noises.push({ x, y, radius, ttl: 0.5 });
    for (const g of this.guards) {
      if (Math.hypot(g.x - x, g.y - y) < radius && g.state !== 'hunt') {
        g.state = 'investigate'; g.tx = x; g.ty = y; g.waitT = 0;
      }
    }
  }

  seesPlayer(g) {
    const p = this.player;
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d > SIGHT) return 0;
    let ang = Math.atan2(p.y - g.y, p.x - g.x) - g.dir;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    if (Math.abs(ang) > FOV / 2 && d > 26) return 0;
    if (!losClear(this.level, g.x, g.y, p.x, p.y)) return 0;
    // How fast the meter fills: close, lit and upright fills fast; crawling in
    // shadow barely registers — patience is a real mechanic, not a flavour.
    const tile = this.playerTile();
    let rate = 1.25 - d / SIGHT;
    if (tile === ',') rate *= 0.32;
    if (tile === 'L') rate *= 1.5;
    if (p.crawl) rate *= 0.45;
    if (!p.moving) rate *= 0.7;
    return Math.max(0.06, rate);
  }

  stepGuard(g, dt) {
    let ev = EV.NONE;
    const seen = this.seesPlayer(g);
    if (seen > 0) {
      const before = g.alert;
      g.alert = Math.min(1, g.alert + seen * dt * 1.15);
      if (before < 1 && g.alert >= 1) { g.state = 'hunt'; this.seenEver = true; ev |= EV.SPOTTED; }
      else if (g.alert > 0.35 && g.state === 'patrol') { g.state = 'investigate'; g.tx = this.player.x; g.ty = this.player.y; }
      if (g.state === 'hunt') { g.tx = this.player.x; g.ty = this.player.y; }
    } else {
      g.alert = Math.max(0, g.alert - dt * (g.state === 'hunt' ? 0.11 : 0.3));
      if (g.state === 'hunt' && g.alert <= 0.05) { g.state = 'return'; }
    }
    const arrive = (x, y, sp) => {
      const d = Math.hypot(x - g.x, y - g.y);
      if (d < 5) return true;
      g.dir = Math.atan2(y - g.y, x - g.x);
      moveCircle(this.level, g, Math.cos(g.dir) * sp * dt, Math.sin(g.dir) * sp * dt, 11);
      return false;
    };
    if (g.state === 'patrol') {
      if (g.pause > 0) {
        g.pause -= dt;
        if (g.scan) { g.scanT += dt; g.dir += Math.sin(g.scanT * 1.7) * dt * 1.5; }
      } else if (arrive(g.path[g.wp].x, g.path[g.wp].y, g.speed)) {
        g.wp = (g.wp + 1) % g.path.length; g.pause = g.scan ? 1.6 : 0.7; g.scanT = 0;
      }
    } else if (g.state === 'investigate' || g.state === 'hunt') {
      const sp = g.state === 'hunt' ? g.speed * 1.85 : g.speed * 1.25;
      if (arrive(g.tx, g.ty, sp)) {
        g.waitT += dt;
        g.dir += dt * 1.9; // searching turn
        if (g.waitT > (g.state === 'hunt' ? 0.4 : 2.2)) { g.state = 'return'; g.waitT = 0; }
      }
    } else if (g.state === 'return') {
      // Head back to the nearest patrol waypoint and resume the round.
      let best = 0, bd = Infinity;
      g.path.forEach((w, i) => { const d = Math.hypot(w.x - g.x, w.y - g.y); if (d < bd) { bd = d; best = i; } });
      if (arrive(g.path[best].x, g.path[best].y, g.speed * 1.15)) { g.wp = (best + 1) % g.path.length; g.state = 'patrol'; }
    }
    return ev;
  }

  conePolygon(g) {
    // Raycast the cone edges against shelves so the drawn cone bends around
    // cover exactly the way the guard's sight does.
    const pts = [[g.x, g.y]];
    const rays = 22;
    for (let i = 0; i <= rays; i++) {
      const a = g.dir - FOV / 2 + (FOV * i) / rays;
      let d = SIGHT;
      for (let s = 8; s < SIGHT; s += 8) {
        if (solid(this.level, Math.floor((g.x + Math.cos(a) * s) / TILE), Math.floor((g.y + Math.sin(a) * s) / TILE))) { d = s; break; }
      }
      pts.push([g.x + Math.cos(a) * d, g.y + Math.sin(a) * d]);
    }
    return pts;
  }
}
