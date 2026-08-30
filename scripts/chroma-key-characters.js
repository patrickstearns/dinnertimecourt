/**
 * Convert chroma-key green backgrounds to transparent PNGs for character art.
 * Usage: node scripts/chroma-key-characters.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PLAYABLE_CHARACTERS, NPC_CHARACTERS } = require('../shared/characters');

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'characters');
const SRC_DIR = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-David-Desktop-Jovian-Games-Games-Halfling-Night-Court',
  'assets'
);

const EXPECTED = new Set();
for (const c of [...PLAYABLE_CHARACTERS, ...NPC_CHARACTERS]) {
  EXPECTED.add(`${c.id}-front.png`);
  EXPECTED.add(`${c.id}-rear.png`);
}

/** Map GenerateImage filenames → our id filenames */
function normalizeName(filename) {
  let f = filename.toLowerCase();
  f = f
    .replace(/^npc-judge/, 'npc_judge')
    .replace(/^npc-bailiff/, 'npc_bailiff')
    .replace(/^npc-prosecutor/, 'npc_prosecutor')
    .replace(/^npc-market-girl/, 'npc_market_girl')
    .replace(/^npc-market_girl/, 'npc_market_girl')
    .replace(/jury-rig/, 'jury_rig')
    .replace(/cross-exam/, 'cross_exam');
  return f;
}

async function keyFile(inputPath, outputPath) {
  const resized = await sharp(inputPath)
    .resize({ width: 512, height: 768, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const greenDominance = g - Math.max(r, b);
    const isGreen = g > 90 && greenDominance > 35 && r < 160 && b < 160;
    const isLime = g > 180 && r < 120 && b < 120;
    if (isGreen || isLime) {
      const softness = Math.min(1, Math.max(0, (greenDominance - 20) / 80));
      data[i + 3] = Math.round(data[i + 3] * (1 - softness));
      if (softness > 0.55) data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

function candidateSources() {
  const map = new Map(); // outName -> srcPath
  if (!fs.existsSync(SRC_DIR)) return map;
  for (const file of fs.readdirSync(SRC_DIR)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    const outName = normalizeName(file);
    if (!EXPECTED.has(outName)) continue;
    map.set(outName, path.join(SRC_DIR, file));
  }
  // Also allow already-copied raw files in OUT_DIR that still need keying
  if (fs.existsSync(OUT_DIR)) {
    for (const file of fs.readdirSync(OUT_DIR)) {
      if (!EXPECTED.has(file)) continue;
      if (!map.has(file)) map.set(file, path.join(OUT_DIR, file));
    }
  }
  return map;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const sources = candidateSources();
  let n = 0;
  for (const [outName, src] of sources) {
    const out = path.join(OUT_DIR, outName);
    process.stdout.write(`Keying ${path.basename(src)} -> ${outName}\n`);
    await keyFile(src, out);
    n += 1;
  }
  const missing = [...EXPECTED].filter((f) => !fs.existsSync(path.join(OUT_DIR, f)));
  console.log(`Done. Processed ${n}. Missing ${missing.length}:`);
  if (missing.length) console.log(missing.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
