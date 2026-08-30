const fs = require('fs');
const path = require('path');
const { RECIPES } = require('../shared/cards');

const root = path.join(__dirname, '..', 'public', 'assets');
const ingDir = path.join(root, 'ingredients');
const bgDir = path.join(root, 'bg');
const backsDir = path.join(root, 'backs');
const foodDir = path.join(root, 'food');

fs.mkdirSync(ingDir, { recursive: true });
fs.mkdirSync(bgDir, { recursive: true });
fs.mkdirSync(backsDir, { recursive: true });
fs.mkdirSync(foodDir, { recursive: true });

const palette = {
  green: '#2f6b4c',
  gold: '#f0c14b',
  cream: '#fff8e6',
  berry: '#9b3d55',
  night: '#3d5a8a',
};

function ingredientSvg(id, label, emoji, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.cream}"/>
      <stop offset="100%" stop-color="${color}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="18" fill="url(#g)"/>
  <rect x="8" y="8" width="112" height="112" rx="14" fill="none" stroke="${palette.gold}" stroke-width="4"/>
  <text x="64" y="72" text-anchor="middle" font-size="52">${emoji}</text>
</svg>`;
}

function grouncowIngredientSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Groun'cow">
  <defs>
    <linearGradient id="gc-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.cream}"/>
      <stop offset="100%" stop-color="#8b4a3b"/>
    </linearGradient>
    <linearGradient id="gc-meat" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="#e07a66"/>
      <stop offset="42%" stop-color="#b84338"/>
      <stop offset="100%" stop-color="#74281f"/>
    </linearGradient>
    <linearGradient id="gc-tray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#dedede"/>
    </linearGradient>
    <radialGradient id="gc-shine" cx="38%" cy="32%" r="55%">
      <stop offset="0%" stop-color="#ffd4c8" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#b84338" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="128" height="128" rx="18" fill="url(#gc-bg)"/>
  <rect x="8" y="8" width="112" height="112" rx="14" fill="none" stroke="${palette.gold}" stroke-width="4"/>
  <rect x="18" y="74" width="92" height="24" rx="5" fill="url(#gc-tray)" stroke="#c8c8c8" stroke-width="2"/>
  <rect x="20" y="76" width="88" height="5" rx="2.5" fill="#fff" opacity="0.65"/>
  <path d="M22 74 C24 62, 34 48, 48 44 C56 42, 60 40, 64 40 C68 40, 72 42, 80 44 C94 48, 104 62, 106 74 C98 80, 82 84, 64 85 C46 84, 30 80, 22 74 Z" fill="url(#gc-meat)" stroke="#5a2018" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="42" cy="56" rx="7" ry="5" fill="#8f3a30" opacity="0.55" transform="rotate(-18 42 56)"/>
  <ellipse cx="58" cy="50" rx="8" ry="6" fill="#6f2a22" opacity="0.45" transform="rotate(12 58 50)"/>
  <ellipse cx="74" cy="54" rx="6.5" ry="4.5" fill="#8f3a30" opacity="0.5" transform="rotate(-8 74 54)"/>
  <ellipse cx="52" cy="64" rx="5" ry="3.5" fill="#6f2a22" opacity="0.4" transform="rotate(22 52 64)"/>
  <ellipse cx="68" cy="62" rx="5.5" ry="4" fill="#7a2e24" opacity="0.45" transform="rotate(-14 68 62)"/>
  <ellipse cx="46" cy="68" rx="4" ry="3" fill="#6f2a22" opacity="0.35"/>
  <ellipse cx="78" cy="66" rx="4.5" ry="3" fill="#6f2a22" opacity="0.35"/>
  <ellipse cx="50" cy="50" rx="20" ry="13" fill="url(#gc-shine)"/>
  <path d="M20 52 C38 40, 90 40, 108 52" fill="none" stroke="#ffffff" stroke-width="2.2" opacity="0.55" stroke-linecap="round"/>
  <path d="M24 62 C44 72, 84 72, 104 62" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.35" stroke-linecap="round"/>
  <rect x="76" y="78" width="24" height="14" rx="2" fill="#6a9a52" stroke="#466832" stroke-width="1.5"/>
  <circle cx="88" cy="83" r="2.8" fill="${palette.gold}"/>
  <path d="M84.5 87.5h7v2.8h-7z" fill="${palette.cream}" opacity="0.85"/>
</svg>`;
}

const ingredients = [
  ['brockolli', 'Brockolli', '🥦', '#8fd694'],
  ['carroot', 'Carroot', '🥕', '#e07a42'],
  ['potatoe', 'Potatoe', '🥔', '#c9a66b'],
  ['termater', 'Termater', '🍅', '#d64b4b'],
  ['hweetgrains', 'Hweetgrains', '🌾', '#d8b85a'],
  ['dillyweed', 'Dillyweed', '🌿', '#6aa66a'],
  ['rosemarie', 'Rosemarie', '🌱', '#5f8f5f'],
  ['gahlic', 'Gahlic', '🧄', '#e8dcc8'],
  ['punkin', 'Punkin', '🎃', '#e8903a'],
  ['cheez', 'Cheez', '🧀', '#f5d76e'],
  ['milk', 'Milk', '🥛', '#eef5ff'],
  ['eggz', "B'cock Eggz", '🥚', '#ffe8a3'],
  ['hoark', 'Hoark Chop', '🥩', '#b85c5c'],
  ['mutton', 'Mutton', '🍖', '#a05252'],
  ['tofurkey', 'Tofurkey', '🍗', '#c8a882'],
  ['bcock', "B'cock Meat", '🐔', '#f0b67a'],
];

for (const [id, label, emoji, color] of ingredients) {
  fs.writeFileSync(path.join(ingDir, `${id}.svg`), ingredientSvg(id, label, emoji, color));
}
fs.writeFileSync(path.join(ingDir, 'grouncow.svg'), grouncowIngredientSvg());

const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Gold coin">
  <circle cx="32" cy="32" r="28" fill="#f0c14b" stroke="#9a7510" stroke-width="4"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#ffe89a" stroke-width="2" opacity="0.8"/>
  <text x="32" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#5a4208">GP</text>
</svg>`;
fs.writeFileSync(path.join(root, 'coin.svg'), coinSvg);

function sceneSvg(name, colors, shapes) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="100%" stop-color="${colors[1]}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  ${shapes}
  <text x="800" y="820" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="${colors[2] || '#fff8e6'}" opacity="0.35">${name}</text>
</svg>`;
}

const scenes = {
  title: sceneSvg('Dinnertime Court', ['#1f4a36', '#143528', '#f0c14b'],
    '<ellipse cx="400" cy="700" rx="520" ry="120" fill="#0f2a1d" opacity="0.5"/><rect x="620" y="260" width="360" height="420" rx="24" fill="#d5e6da" opacity="0.15"/><path d="M700 680 L800 420 L900 680 Z" fill="#f0c14b" opacity="0.25"/>'),
  lobby: sceneSvg('Counsel Lobby', ['#24553c', '#1a3a2a', '#d5e6da'],
    '<rect x="180" y="220" width="1240" height="460" rx="36" fill="#fff8e6" opacity="0.08"/><circle cx="260" cy="760" r="90" fill="#f0c14b" opacity="0.2"/><circle cx="1340" cy="760" r="90" fill="#9b3d55" opacity="0.18"/>'),
  market: sceneSvg('Day Market', ['#87bce8', '#2f6b4c', '#fff8e6'],
    '<rect x="0" y="560" width="1600" height="340" fill="#1f4a36"/><rect x="220" y="300" width="220" height="260" rx="12" fill="#c9a66b" opacity="0.55"/><rect x="520" y="320" width="220" height="240" rx="12" fill="#c9a66b" opacity="0.45"/><rect x="820" y="310" width="220" height="250" rx="12" fill="#c9a66b" opacity="0.5"/>'),
  court: sceneSvg('Dinnertime Court', ['#0e1628', '#1a2744', '#eef3fb'],
    '<rect x="500" y="180" width="600" height="520" rx="28" fill="#243656" opacity="0.65"/><rect x="650" y="120" width="300" height="90" rx="12" fill="#f0c14b" opacity="0.35"/><circle cx="800" cy="430" r="110" fill="#3d5a8a" opacity="0.45"/>'),
  victory: sceneSvg('Partnership!', ['#4a2a5a', '#1f4a36', '#f0c14b'],
    '<path d="M800 120 L860 280 L1030 280 L895 390 L950 550 L800 450 L650 550 L705 390 L570 280 L740 280 Z" fill="#f0c14b" opacity="0.55"/><rect x="560" y="620" width="480" height="120" rx="24" fill="#fff8e6" opacity="0.12"/>'),
  kitchen: sceneSvg('Halfling Kitchen', ['#3d2817', '#6b4423', '#fff8e6'],
    '<rect x="0" y="520" width="1600" height="380" fill="#4a3020"/><rect x="120" y="280" width="420" height="320" rx="8" fill="#8b6914" opacity="0.55"/><rect x="620" y="200" width="360" height="400" rx="12" fill="#5c3d2e" opacity="0.7"/><ellipse cx="800" cy="380" rx="90" ry="70" fill="#f0c14b" opacity="0.35"/><circle cx="800" cy="380" r="45" fill="#e07a42" opacity="0.5"/><rect x="1080" y="300" width="280" height="300" rx="8" fill="#7a5238" opacity="0.5"/>'),
};

function cardBackSvg(label, border, fill, accent, icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${fill[0]}"/>
      <stop offset="100%" stop-color="${fill[1]}"/>
    </linearGradient>
    <pattern id="pat" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="3" fill="${accent}" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="250" height="350" rx="18" fill="url(#bg)"/>
  <rect x="10" y="10" width="230" height="330" rx="14" fill="url(#pat)" stroke="${border}" stroke-width="5"/>
  <rect x="28" y="28" width="194" height="294" rx="10" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>
  <text x="125" y="175" text-anchor="middle" font-size="64">${icon}</text>
  <text x="125" y="310" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${palette.cream}" opacity="0.85">${label}</text>
</svg>`;
}

const backs = {
  'ingredient-back': null, // written separately as frying-pan art below
  'recipe-back': cardBackSvg('Recipes', '#c9a020', ['#5a4208', '#9a7510'], '#f0c14b', '📜'),
  'argument-back': cardBackSvg('Arguments', '#3d5a8a', ['#1a2744', '#243656'], '#87bce8', '⚖️'),
};

const pantryBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" role="img" aria-label="Ingredient deck">
  <defs>
    <linearGradient id="panBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5c4030"/>
      <stop offset="100%" stop-color="#3a2818"/>
    </linearGradient>
    <linearGradient id="panMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a7078"/>
      <stop offset="45%" stop-color="#3d434a"/>
      <stop offset="100%" stop-color="#2a2e34"/>
    </linearGradient>
    <linearGradient id="handleWood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5a2b"/>
      <stop offset="100%" stop-color="#5a3a18"/>
    </linearGradient>
    <radialGradient id="panShine" cx="38%" cy="32%" r="55%">
      <stop offset="0%" stop-color="#9aa3ad" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#3d434a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="250" height="350" rx="18" fill="url(#panBg)"/>
  <rect x="10" y="10" width="230" height="330" rx="14" fill="none" stroke="#f0c14b" stroke-width="5"/>
  <rect x="28" y="28" width="194" height="294" rx="10" fill="none" stroke="#e8c878" stroke-width="2" opacity="0.55"/>
  <g transform="translate(125 175) scale(0.5)">
    <ellipse cx="0" cy="8" rx="72" ry="18" fill="#1a1510" opacity="0.35"/>
    <ellipse cx="0" cy="0" rx="70" ry="52" fill="url(#panMetal)" stroke="#1c1f24" stroke-width="4"/>
    <ellipse cx="0" cy="0" rx="70" ry="52" fill="url(#panShine)"/>
    <ellipse cx="0" cy="-4" rx="52" ry="36" fill="#2a2e34" stroke="#1c1f24" stroke-width="2"/>
    <ellipse cx="-12" cy="-14" rx="18" ry="10" fill="#8a939c" opacity="0.35"/>
    <rect x="62" y="-10" width="58" height="20" rx="8" fill="url(#handleWood)" stroke="#3a2410" stroke-width="2"/>
    <circle cx="112" cy="0" r="7" fill="#c9a66b" stroke="#3a2410" stroke-width="2"/>
    <circle cx="112" cy="0" r="2.5" fill="#3a2410"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(backsDir, 'ingredient-back.svg'), pantryBackSvg);

for (const [name, svg] of Object.entries(backs)) {
  if (!svg) continue;
  fs.writeFileSync(path.join(backsDir, `${name}.svg`), svg);
}

const recipeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Needed for recipe">
  <rect width="32" height="32" rx="6" fill="#f0c14b" stroke="#9a7510" stroke-width="2"/>
  <text x="16" y="22" text-anchor="middle" font-size="16">📜</text>
</svg>`;
fs.writeFileSync(path.join(root, 'recipe-icon.svg'), recipeIconSvg);

const foodEmojis = {
  rock_candy_crunch: '🥗',
  skillet_taters: '🥔',
  dill_grain_bites: '🌾',
  herb_garlic_toast: '🍞',
  punkin_cheez_melts: '🎃',
  mystery_scramble: '🍳',
  double_chop_skillet: '🥩',
  bird_beast_bites: '🍗',
  pantry_hash: '🥘',
  punkin_herb_soup: '🥣',
  meat_greens_skillet: '🥦',
  herb_grain_mash: '🍳',
  punkin_chop_stew: '🍲',
  garden_bird_roast: '🐔',
  herb_bird_bowl: '🍚',
  cream_bisque: '🥣',
  pastoral_chili: '🌶️',
  mixed_beast_chili: '🍛',
  grouncow_cheez_boat: '🛶',
  grouncow_breakfast_skillet: '🍳',
  royal_bird_quiche: '🥧',
  inferno_clubette: '🌶️',
  triple_meatpie: '🥧',
  spicy_bird_wrap: '🌯',
  grand_court_casserole: '👑',
};

function foodSvg(id, label, emoji) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff8e6"/>
      <stop offset="100%" stop-color="#e8c878"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="18" fill="url(#g)"/>
  <rect x="8" y="8" width="112" height="112" rx="14" fill="none" stroke="#f0c14b" stroke-width="4"/>
  <text x="64" y="72" text-anchor="middle" font-size="52">${emoji}</text>
</svg>`;
}

for (const recipe of RECIPES) {
  const emoji = foodEmojis[recipe.id] || '🍽️';
  fs.writeFileSync(path.join(foodDir, `${recipe.id}.svg`), foodSvg(recipe.id, recipe.name, emoji));
}

for (const [name, svg] of Object.entries(scenes)) {
  fs.writeFileSync(path.join(bgDir, `${name}.svg`), svg);
}

console.log('Generated ingredients, food, card backs, coin, and scene backgrounds.');
