// SHADOW VAULT — canvas rendering: marble and shadow-rug floors, shelf cover,
// lantern light pools, raycast vision cones that warm from amber to red as a
// guard's suspicion rises, and little hooded figures drawn from primitives.
import { TILE, COLS, ROWS } from './levels.js';
import { tileAt } from './world.js';

export function drawWorld(ctx, world, t) {
  const { level, player: p } = world;
  ctx.fillStyle = '#10131f'; ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const c = tileAt(level, tx, ty), x = tx * TILE, y = ty * TILE;
    if (c === '#') {
      ctx.fillStyle = '#2c3550'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#3a4670'; ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = '#57648f'; ctx.fillRect(x + 7, y + 9, TILE - 14, 4); ctx.fillRect(x + 7, y + 21, TILE - 14, 4);
    } else if (c === ',') {
      ctx.fillStyle = '#181a2e'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#222040'; ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    } else if (c === 'L') {
      const g = ctx.createRadialGradient(x + 20, y + 20, 4, x + 20, y + 20, 30);
      g.addColorStop(0, 'rgba(255,196,86,0.55)'); g.addColorStop(1, 'rgba(255,196,86,0.05)');
      ctx.fillStyle = '#232033'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = g; ctx.fillRect(x, y, TILE, TILE);
    } else {
      ctx.fillStyle = (tx + ty) % 2 ? '#1b1f30' : '#1e2236'; ctx.fillRect(x, y, TILE, TILE);
    }
  }
  // exit door
  if (world.exit) {
    const open = world.relics.every((r) => r.taken);
    ctx.fillStyle = open ? '#2fbf71' : '#54452a';
    ctx.fillRect(world.exit.x - 15, world.exit.y - 15, 30, 30);
    ctx.fillStyle = open ? '#baffdc' : '#8a744a';
    ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT' : '🔒', world.exit.x, world.exit.y + 5);
  }
  // relics and coin stashes
  for (const r of world.relics) if (!r.taken) {
    const bob = Math.sin(t * 3 + r.x) * 2;
    ctx.save(); ctx.translate(r.x, r.y + bob); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd94d'; ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore();
  }
  for (const c of world.coinStashes) if (!c.taken) {
    ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, 7); ctx.fillStyle = '#e8b64c'; ctx.fill();
    ctx.beginPath(); ctx.arc(c.x, c.y, 3.4, 0, 7); ctx.fillStyle = '#ffe9a8'; ctx.fill();
  }
  // vision cones, under the figures
  for (const g of world.guards) {
    const pts = world.conePolygon(g);
    const heat = g.alert;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = heat > 0.65 ? `rgba(255,64,48,${0.24 + heat * 0.2})` : `rgba(255,190,70,${0.13 + heat * 0.14})`;
    ctx.fill();
  }
  // noise ripples (sprint steps, coin *ting*)
  for (const n of world.noises) {
    ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * (1 - n.ttl), 0, 7);
    ctx.strokeStyle = 'rgba(160,220,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (world.thrown) {
    ctx.beginPath(); ctx.arc(world.thrown.x, world.thrown.y, 4, 0, 7); ctx.fillStyle = '#ffe9a8'; ctx.fill();
  }
  // guards
  for (const g of world.guards) {
    ctx.save(); ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 9, 11, 4, 0, 0, 7); ctx.fill();
    ctx.rotate(g.dir);
    ctx.fillStyle = g.state === 'hunt' ? '#a12622' : '#6d2f35';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8c39e'; ctx.beginPath(); ctx.arc(3, 0, 5.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd94d'; ctx.fillRect(6, -1.6, 6, 3.2); // lantern carried ahead
    ctx.restore();
    if (g.alert > 0.04) {
      ctx.fillStyle = '#0c0e16'; ctx.fillRect(g.x - 13, g.y - 24, 26, 5);
      ctx.fillStyle = g.alert >= 1 ? '#ff4030' : g.alert > 0.35 ? '#ffb020' : '#ffe9a8';
      ctx.fillRect(g.x - 12, g.y - 23, 24 * Math.min(1, g.alert), 3);
      ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(g.alert >= 1 ? '!' : g.alert > 0.35 ? '?' : '', g.x, g.y - 29);
    }
  }
  // player: a small hooded wisp with a teal cloak; crouching shrinks the cloak.
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 9, 11, 4, 0, 0, 7); ctx.fill();
  ctx.rotate(p.dir);
  const s = p.crawl ? 0.78 : 1;
  ctx.scale(s, s);
  ctx.fillStyle = '#1f8a8a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
  ctx.fillStyle = '#0f5f63'; ctx.beginPath(); ctx.arc(-3, 0, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe9c9'; ctx.beginPath(); ctx.arc(3.4, 0, 5, 0, 7); ctx.fill();
  ctx.restore();
  // darkness vignette: the vault is lit, the edges are not
  const vg = ctx.createRadialGradient(480, 300, 260, 480, 300, 640);
  vg.addColorStop(0, 'rgba(4,6,12,0)'); vg.addColorStop(1, 'rgba(4,6,12,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  if (world.alarm > 0.25) {
    ctx.fillStyle = `rgba(255,30,20,${(world.alarm - 0.25) * 0.13 * (0.7 + 0.3 * Math.sin(t * 9))})`;
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
  }
}
