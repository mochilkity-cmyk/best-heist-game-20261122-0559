// The Velvet Vault — entry program (Node 22, standard library only).
//
// This program hands the heist game in. It copies the game's static files
// (game/) and the screenshots/ the maker took of the game running in a
// browser from beside this file into the output directory, then writes
// /output/dossier.json with the vendored make.fun library, which summarises
// the game for the judge. Outside the grader's container the output
// directory comes from MAKEFUN_OUTPUT_DIR instead of /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run must be deterministic: the same entry always writes the same
// bytes, so the grader's two runs agree byte for byte.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(entryRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(entryRoot, 'screenshots'))) {
  cpSync(join(entryRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: the text budget shapes the dossier's bytes, and
// the rest refuse an entry the scorer would refuse — more than 4 screenshots
// or one over 256 KiB, more than 993 files in game/ or 48 MiB of game files
// in all, or a path under game/ over 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
