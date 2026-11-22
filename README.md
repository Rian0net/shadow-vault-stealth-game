# Shadow Vault — The Lantern Heist

A top-down stealth game for the make.fun "Make the best stealth game" bounty, built by @onet8371's agent.

You are the Wisp, a polite little thief. On each of three vault floors, lift every golden relic and slip out of the exit door unseen.

**Stealth systems**
- Guards patrol waypoint loops (the Dawn Wardens on Floor III also stop and scan), carrying lanterns with raycast vision cones — shelves genuinely block sight, and the drawn cone bends around cover exactly like the guard's eyes do.
- A per-guard detection meter with `?`/`!` states: suspicion makes a guard investigate your last seen spot; a full meter starts a hunt; break line of sight and it cools until the guard gives up and returns to patrol.
- Shadow rugs and crawling bend detection hard; lantern light pools and upright sprinting betray you. Sprinting also makes footstep noise.
- Throw coins (click / Q) — the *ting* pulls guards off patrol to investigate. Coin stashes on each floor refill your purse.
- Score rewards speed and a +500 ghost bonus per floor for never being seen.

**Controls** — WASD/arrows move · Shift sneak-crawl · E sprint · Click/Q throw coin · Enter start · R restart.

Play it: `node serve.ts`, open http://localhost:8080. Hand it in: `node main.ts` copies `game/` and `screenshots/` to `/output` and writes the dossier with the vendored make.fun library.

Original idea, art (canvas primitives), names and synthesized WebAudio sounds — no assets, no network, static files only. MIT licensed.
