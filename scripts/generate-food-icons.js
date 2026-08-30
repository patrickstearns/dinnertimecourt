/**
 * Generate emoji-free SVG food icons for recipe cards.
 * Windows often fails to render emoji inside SVG <img> sources.
 */
const fs = require('fs');
const path = require('path');
const { RECIPES } = require('../shared/cards');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'food');

function frame(label, inner, accent = '#f0c14b') {
  const uid = label.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'food';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff8e6"/>
      <stop offset="100%" stop-color="#e8c878"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="18" fill="url(#${uid}-bg)"/>
  <rect x="8" y="8" width="112" height="112" rx="14" fill="none" stroke="${accent}" stroke-width="4"/>
${inner}
</svg>
`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function skillet(color = '#c45c26') {
  return `
  <ellipse cx="64" cy="86" rx="42" ry="10" fill="#5a4208" opacity="0.25"/>
  <ellipse cx="64" cy="72" rx="40" ry="18" fill="#3d2a12" stroke="#2a1a08" stroke-width="2"/>
  <ellipse cx="64" cy="68" rx="34" ry="14" fill="${color}"/>
  <rect x="96" y="64" width="18" height="8" rx="3" fill="#3d2a12"/>`;
}

function bowl(fill = '#d97b3d') {
  return `
  <ellipse cx="64" cy="88" rx="36" ry="8" fill="#5a4208" opacity="0.2"/>
  <path d="M28 58 C30 86, 98 86, 100 58 Z" fill="#efe6d4" stroke="#b8a078" stroke-width="2"/>
  <ellipse cx="64" cy="58" rx="36" ry="12" fill="${fill}" stroke="#8a5020" stroke-width="1.5"/>`;
}

function pie(fill = '#c9782a', crust = '#e8b86a') {
  return `
  <ellipse cx="64" cy="90" rx="38" ry="8" fill="#5a4208" opacity="0.2"/>
  <path d="M26 70 A38 28 0 0 1 102 70 L94 88 A30 12 0 0 1 34 88 Z" fill="${crust}" stroke="#9a6a28" stroke-width="2"/>
  <ellipse cx="64" cy="68" rx="36" ry="14" fill="${fill}" stroke="#8a4a18" stroke-width="1.5"/>
  <path d="M40 64 Q64 52 88 64" fill="none" stroke="#ffe0a8" stroke-width="2" opacity="0.7"/>`;
}

function toast() {
  return `
  <rect x="30" y="34" width="68" height="54" rx="10" fill="#e8b86a" stroke="#9a6a28" stroke-width="2"/>
  <rect x="36" y="40" width="56" height="42" rx="8" fill="#f5d090"/>
  <circle cx="52" cy="58" r="5" fill="#6a9a42"/>
  <circle cx="72" cy="62" r="4" fill="#d4a017"/>
  <path d="M48 72 Q64 66 80 74" fill="none" stroke="#8a5a18" stroke-width="2"/>`;
}

function wrap() {
  return `
  <ellipse cx="64" cy="92" rx="34" ry="7" fill="#5a4208" opacity="0.2"/>
  <path d="M24 70 C36 40, 92 40, 104 70 C90 92, 38 92, 24 70 Z" fill="#c9e07a" stroke="#6a8a32" stroke-width="2"/>
  <path d="M34 66 C48 52, 80 52, 94 66" fill="none" stroke="#8fbc4a" stroke-width="3"/>
  <ellipse cx="56" cy="68" rx="8" ry="5" fill="#c45c26"/>
  <ellipse cx="74" cy="70" rx="6" ry="4" fill="#e8b86a"/>`;
}

function chili() {
  return `
  ${bowl('#b84338')}
  <ellipse cx="50" cy="56" rx="8" ry="5" fill="#e07a66"/>
  <ellipse cx="70" cy="58" rx="7" ry="4" fill="#8f3a30"/>
  <ellipse cx="62" cy="52" rx="6" ry="3.5" fill="#f0c14b"/>
  <path d="M88 42 C92 34, 100 36, 98 44" fill="#2f9e5a" stroke="#1f6a3a" stroke-width="1"/>`;
}

function casserole() {
  return `
  <rect x="28" y="48" width="72" height="40" rx="8" fill="#d8d0c0" stroke="#8a8070" stroke-width="2"/>
  <rect x="32" y="52" width="64" height="28" rx="6" fill="#c45c26"/>
  <ellipse cx="48" cy="64" rx="8" ry="5" fill="#f0c14b"/>
  <ellipse cx="70" cy="66" rx="10" ry="6" fill="#8f3a30"/>
  <rect x="40" y="42" width="12" height="10" rx="2" fill="#b8a078"/>
  <rect x="76" y="42" width="12" height="10" rx="2" fill="#b8a078"/>
  <circle cx="64" cy="40" r="6" fill="#f0c14b" stroke="#9a7510" stroke-width="1.5"/>`;
}

function scramble() {
  return `
  ${skillet('#f0c14b')}
  <ellipse cx="52" cy="66" rx="10" ry="7" fill="#ffe89a"/>
  <ellipse cx="72" cy="68" rx="9" ry="6" fill="#e8b86a"/>
  <circle cx="60" cy="62" r="3" fill="#fff8e6"/>`;
}

function bites() {
  return `
  <ellipse cx="44" cy="70" rx="18" ry="14" fill="#c45c26" stroke="#8a3018" stroke-width="2"/>
  <ellipse cx="78" cy="66" rx="16" ry="12" fill="#e8b86a" stroke="#9a6a28" stroke-width="2"/>
  <ellipse cx="62" cy="84" rx="14" ry="10" fill="#6a9a42" stroke="#3d6a28" stroke-width="2"/>
  <circle cx="40" cy="66" r="3" fill="#ffe0a8" opacity="0.7"/>`;
}

function soup() {
  return `
  ${bowl('#e09a4a')}
  <ellipse cx="64" cy="56" rx="28" ry="8" fill="#c9782a"/>
  <path d="M48 48 Q52 40 56 48" fill="none" stroke="#fff8e6" stroke-width="2" opacity="0.7"/>
  <path d="M64 46 Q68 38 72 46" fill="none" stroke="#fff8e6" stroke-width="2" opacity="0.7"/>
  <path d="M78 50 Q82 42 86 50" fill="none" stroke="#fff8e6" stroke-width="2" opacity="0.6"/>`;
}

function mash() {
  return `
  ${bowl('#e8d4a8')}
  <ellipse cx="54" cy="56" rx="10" ry="6" fill="#d4b878"/>
  <ellipse cx="72" cy="58" rx="9" ry="5" fill="#c9a868"/>
  <circle cx="64" cy="52" r="4" fill="#6a9a42"/>`;
}

function roast() {
  return `
  <ellipse cx="64" cy="92" rx="36" ry="8" fill="#5a4208" opacity="0.2"/>
  <ellipse cx="64" cy="70" rx="34" ry="22" fill="#c45c26" stroke="#8a3018" stroke-width="2"/>
  <ellipse cx="54" cy="62" rx="8" ry="6" fill="#e07a66" opacity="0.8"/>
  <path d="M40 70 Q64 58 88 70" fill="none" stroke="#ffe0a8" stroke-width="2" opacity="0.5"/>
  <circle cx="78" cy="74" r="5" fill="#6a9a42"/>`;
}

function melts() {
  return `
  <rect x="34" y="40" width="60" height="44" rx="8" fill="#e8b86a" stroke="#9a6a28" stroke-width="2"/>
  <path d="M38 52 C50 48, 78 48, 90 56 L90 78 C70 84, 48 82, 38 74 Z" fill="#f0c14b" stroke="#9a7510" stroke-width="1.5"/>
  <ellipse cx="64" cy="48" rx="16" ry="10" fill="#e09a4a" stroke="#8a5a18" stroke-width="1.5"/>`;
}

function crunch() {
  return `
  <circle cx="44" cy="58" r="16" fill="#7ec8e8" stroke="#3a7a9a" stroke-width="2"/>
  <circle cx="72" cy="52" r="14" fill="#f07178" stroke="#a03840" stroke-width="2"/>
  <circle cx="62" cy="78" r="15" fill="#f0c14b" stroke="#9a7510" stroke-width="2"/>
  <circle cx="48" cy="54" r="3" fill="#fff" opacity="0.7"/>
  <circle cx="76" cy="48" r="2.5" fill="#fff" opacity="0.7"/>`;
}

function boat() {
  return `
  <path d="M24 78 C40 96, 88 96, 104 78 L96 58 C80 68, 48 68, 32 58 Z" fill="#8a5a18" stroke="#5a3a10" stroke-width="2"/>
  <ellipse cx="64" cy="62" rx="30" ry="12" fill="#f0c14b" stroke="#9a7510" stroke-width="1.5"/>
  <ellipse cx="54" cy="60" rx="8" ry="5" fill="#c45c26"/>
  <ellipse cx="74" cy="62" rx="7" ry="4" fill="#8f3a30"/>`;
}

function clubette() {
  return `
  <rect x="40" y="30" width="48" height="64" rx="8" fill="#e8d4a8" stroke="#9a6a28" stroke-width="2"/>
  <rect x="44" y="38" width="40" height="10" fill="#6a9a42"/>
  <rect x="44" y="50" width="40" height="10" fill="#c45c26"/>
  <rect x="44" y="62" width="40" height="10" fill="#f0c14b"/>
  <rect x="44" y="74" width="40" height="10" fill="#e07a66"/>`;
}

function meatpie() {
  return `
  ${pie('#8f3a30', '#e8b86a')}
  <path d="M48 68 L56 56 L64 68 L72 56 L80 68" fill="none" stroke="#9a6a28" stroke-width="2"/>`;
}

function crownCasserole() {
  return `
  ${casserole()}
  <path d="M48 28 L54 38 L64 30 L74 38 L80 28 L76 42 L52 42 Z" fill="#f0c14b" stroke="#9a7510" stroke-width="1.5"/>`;
}

function stew() {
  return `
  ${bowl('#a05028')}
  <ellipse cx="50" cy="56" rx="7" ry="4" fill="#c45c26"/>
  <ellipse cx="68" cy="54" rx="8" ry="5" fill="#6a9a42"/>
  <ellipse cx="60" cy="60" rx="6" ry="3" fill="#e09a4a"/>`;
}

function hash() {
  return `
  ${skillet('#c9782a')}
  <rect x="48" y="60" width="10" height="10" rx="2" fill="#e8b86a" transform="rotate(12 53 65)"/>
  <rect x="62" y="58" width="11" height="11" rx="2" fill="#d4a868" transform="rotate(-8 67 63)"/>
  <rect x="56" y="68" width="9" height="9" rx="2" fill="#6a9a42"/>
  <circle cx="74" cy="70" r="4" fill="#c45c26"/>`;
}

function quiche() {
  return `
  ${pie('#f5e6b8', '#e8b86a')}
  <circle cx="52" cy="66" r="5" fill="#f0c14b"/>
  <circle cx="70" cy="64" r="4" fill="#6a9a42"/>
  <circle cx="62" cy="72" r="3.5" fill="#c45c26"/>`;
}

function inferno() {
  return `
  ${clubette()}
  <path d="M86 36 C92 28, 102 32, 98 42 C104 40, 106 50, 98 52 C102 58, 92 62, 88 54 Z" fill="#e85d04" stroke="#9a2808" stroke-width="1.5"/>`;
}

const TEMPLATES = {
  rock_candy_crunch: () => crunch(),
  skillet_taters: () => hash(),
  dill_grain_bites: () => bites(),
  herb_garlic_toast: () => toast(),
  punkin_cheez_melts: () => melts(),
  mystery_scramble: () => scramble(),
  double_chop_skillet: () => `${skillet('#8f3a30')}<ellipse cx="52" cy="66" rx="12" ry="8" fill="#c45c26"/><ellipse cx="74" cy="68" rx="11" ry="7" fill="#a05028"/>`,
  bird_beast_bites: () => bites(),
  pantry_hash: () => hash(),
  punkin_herb_soup: () => soup(),
  meat_greens_skillet: () => `${skillet('#6a9a42')}<ellipse cx="54" cy="66" rx="12" ry="8" fill="#c45c26"/><circle cx="74" cy="64" r="6" fill="#4a7a32"/>`,
  herb_grain_mash: () => mash(),
  punkin_chop_stew: () => stew(),
  garden_bird_roast: () => roast(),
  herb_bird_bowl: () => `${bowl('#c45c26')}<ellipse cx="64" cy="56" rx="20" ry="8" fill="#e07a66"/><circle cx="52" cy="54" r="4" fill="#6a9a42"/>`,
  cream_bisque: () => soup(),
  pastoral_chili: () => chili(),
  mixed_beast_chili: () => chili(),
  grouncow_cheez_boat: () => boat(),
  grouncow_breakfast_skillet: () => `${skillet('#c45c26')}<ellipse cx="52" cy="64" rx="10" ry="7" fill="#f0c14b"/><ellipse cx="72" cy="66" rx="9" ry="6" fill="#ffe89a"/><circle cx="62" cy="70" r="4" fill="#8f3a30"/>`,
  royal_bird_quiche: () => quiche(),
  inferno_clubette: () => inferno(),
  triple_meatpie: () => meatpie(),
  spicy_bird_wrap: () => wrap(),
  grand_court_casserole: () => crownCasserole(),
};

function genericFor(id, name) {
  const n = `${id} ${name}`.toLowerCase();
  if (n.includes('chili')) return chili();
  if (n.includes('soup') || n.includes('bisque') || n.includes('stew')) return soup();
  if (n.includes('pie') || n.includes('quiche')) return pie();
  if (n.includes('wrap') || n.includes('sammich') || n.includes('club')) return wrap();
  if (n.includes('toast') || n.includes('melt')) return toast();
  if (n.includes('scramble') || n.includes('omellette') || n.includes('skillet') || n.includes('hash') || n.includes('pan')) return hash();
  if (n.includes('boat') || n.includes('gravy')) return boat();
  if (n.includes('casserole') || n.includes('ratatouille')) return casserole();
  if (n.includes('roast')) return roast();
  if (n.includes('mash') || n.includes('mousse') || n.includes('custard') || n.includes('souffle')) return mash();
  if (n.includes('crunch') || n.includes('candy') || n.includes('salad') || n.includes('bites')) return bites();
  if (n.includes('chili') || n.includes('inferno')) return chili();
  return bowl('#d97b3d');
}

function writeIcon(id, name) {
  const inner = (TEMPLATES[id] || (() => genericFor(id, name)))();
  const svg = frame(name || id, inner);
  fs.writeFileSync(path.join(OUT, `${id}.svg`), svg);
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

for (const r of RECIPES) {
  writeIcon(r.id, r.name);
}

// Also refresh any leftover emoji icons in the folder
for (const file of fs.readdirSync(OUT)) {
  if (!file.endsWith('.svg')) continue;
  const full = path.join(OUT, file);
  const raw = fs.readFileSync(full, 'utf8');
  if (!raw.includes('<text')) continue;
  const id = file.replace(/\.svg$/, '');
  if (RECIPES.some((r) => r.id === id)) continue;
  writeIcon(id, id.replace(/_/g, ' '));
}

console.log(`Wrote icons for ${RECIPES.length} recipes (+ leftovers cleaned)`);
