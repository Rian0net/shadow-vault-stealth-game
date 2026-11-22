// SHADOW VAULT — The Lantern Heist: the hand-in program (Node 22, standard
// library only). The game itself is the game/ folder beside this file — plain
// static files a desktop browser plays offline, no build step and no network.
// This program copies game/ and screenshots/ into the output directory and
// writes dossier.json there with buildDossier from vendor/makefun-game.ts,
// exactly the summary the judge reads.
//
// Play it locally:  node serve.ts   then open http://localhost:8080
// Hand it in here:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.)
// The game needs no install and no dependencies: Node 22 runs this file as-is.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (reference/gate.json): text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse anyway — over 4 screenshots or one over 256 KiB, over 993 files or
// 48 MiB under game/, or a game/ path over 1000 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
