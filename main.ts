// EMBER & THYME — hand-in program for best-cooking-game-20261125-0137.
// Runs on Node 22 with the standard library only. It takes the game and its
// screenshots from this repository and lays them out under /output (or
// MAKEFUN_OUTPUT_DIR outside the grader), then writes /output/dossier.json,
// the summary the judge reads, using the vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader performs must write identical bytes: this program
// copies files and builds the dossier deterministically, with no timestamps,
// no random values and no network calls anywhere in the path.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The whole entry, exactly as it sits in the repository.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier, built with the same caps the gate enforces: at most 4
// screenshots of 256 KiB, at most 993 game files totalling 48 MiB, paths
// under 1,000 bytes, and the source text capped at 160 KiB.
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
