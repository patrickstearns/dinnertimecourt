/** Chroma-key only the regenerated playable + bailiff + prosecutor portraits. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-David-Desktop-Jovian-Games-Games-Halfling-Night-Court',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'characters');

const IDS = [
  'brambly_briefs',
  'tolman_crumbs',
  'corwin_crockpot',
  'hamfast_hamhock',
  'silas_stipulate',
  'barnaby_bisque',
  'pippa_objection',
  'mira_quill',
  'hazel_snacks',
  'rosie_rollingpin',
  'vera_verdict',
  'clover_cross_exam',
  'npc_bailiff',
  'npc_prosecutor',
];

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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  const missing = [];
  for (const id of IDS) {
    for (const view of ['front', 'rear']) {
      const name = `${id}-${view}.png`;
      const src = path.join(SRC_DIR, name);
      const out = path.join(OUT_DIR, name);
      if (!fs.existsSync(src)) {
        missing.push(name);
        continue;
      }
      process.stdout.write(`Keying ${name}\n`);
      await keyFile(src, out);
      ok += 1;
    }
  }
  console.log(`Done. Keyed ${ok}. Missing ${missing.length}.`);
  if (missing.length) console.log(missing.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
