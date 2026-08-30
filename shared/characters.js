/** Playable counsel + courtroom/market NPCs. Art: /assets/characters/{id}-front.png | -rear.png */

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const PLAYABLE_LOOKS = {
  // Male — short stout halflings in human-style clothes & shoes (no gnome hats, no bare hairy feet)
  'Brambly Briefs':
    'young scholarly male halfling, vivid ginger red curly hair, ink-stained green waistcoat, brown trousers, leather shoes, satchel of briefs, round spectacles',
  'Tolman Crumbs':
    'plump older male halfling, crumbs on vest, flour-dusted brown coat, cookie in pocket, polished brown shoes, no hat',
  'Corwin Crockpot':
    'round jolly male halfling cook-lawyer, bright blond curly hair, stew-stained coat over apron, holds small copper pot, sturdy boots, no hat',
  'Hamfast Hamhock':
    'burly Black male halfling, dark brown skin, thick mustache, smoked-ham pink tunic, butcher-apron under counsel coat, work boots',
  'Silas Stipulate':
    'precise East Asian male halfling, light warm skin, black hair, pince-nez, slate-grey suit with waistcoat, pointing at tiny contract, black dress shoes',
  'Barnaby Bisque':
    'cozy South Asian male halfling, medium brown skin, black hair, creamy bisque-colored coat, soup spoon lapel pin, soft brown shoes, no hat',
  // Female
  'Pippa Objection':
    'spirited young female halfling, blonde bob, berry-red jacket, raised finger mid-objection, skirts or tailored trousers with neat shoes',
  'Mira Quill':
    'elegant Black female halfling, dark brown skin, silver-streaked black hair in bun, ink-blue robes, oversized quill, formal shoes',
  'Hazel Snacks':
    'cheerful female halfling, hazel braids, snack pouch belt, patchwork apron over counsel robes, brown boots',
  'Rosie Rollingpin':
    'baker female halfling, flour dusting, rolling pin holster, pink-checked sleeves, sturdy baker shoes',
  'Vera Verdict':
    'decisive East Asian female halfling, light warm skin, black hair, black-and-gold counsel robe, scales pin, confident chin, black formal shoes',
  'Clover Cross-exam':
    'sharp Latina female halfling, warm olive-brown skin, dark wavy hair, clover pin, emerald jacket, piercing inquisitive stare, polished shoes',
};

const PLAYABLE_GENDER = {
  'Brambly Briefs': 'male',
  'Tolman Crumbs': 'male',
  'Corwin Crockpot': 'male',
  'Hamfast Hamhock': 'male',
  'Silas Stipulate': 'male',
  'Barnaby Bisque': 'male',
  'Pippa Objection': 'female',
  'Mira Quill': 'female',
  'Hazel Snacks': 'female',
  'Rosie Rollingpin': 'female',
  'Vera Verdict': 'female',
  'Clover Cross-exam': 'female',
};

const PLAYABLE_CHARACTERS = Object.entries(PLAYABLE_LOOKS).map(([name, look]) => {
  const id = slugify(name);
  return {
    id,
    name,
    look,
    gender: PLAYABLE_GENDER[name] || null,
    front: `/assets/characters/${id}-front.png`,
    rear: `/assets/characters/${id}-rear.png`,
  };
});

const NPC_CHARACTERS = [
  {
    id: 'npc_judge',
    name: 'The Judge',
    role: 'judge',
    look: 'elderly wise halfling judge, black robe gold trim, powdered wig, gavel',
    front: '/assets/characters/npc_judge-front.png',
    rear: '/assets/characters/npc_judge-rear.png',
  },
  {
    id: 'npc_bailiff',
    name: 'The Bailiff',
    role: 'bailiff',
    look: 'muscular middle-aged male halfling bailiff, broad shoulders and thick arms, dark blue tunic, brass badge, keys on belt, polished black boots, no conical hat',
    front: '/assets/characters/npc_bailiff-front.png',
    rear: '/assets/characters/npc_bailiff-rear.png',
  },
  {
    id: 'npc_prosecutor',
    name: 'The Crown',
    role: 'prosecutor',
    look: 'sharp male halfling prosecutor, berry-red waistcoat, scroll, confident smirk, black dress shoes, no conical hat',
    front: '/assets/characters/npc_prosecutor-front.png',
    rear: '/assets/characters/npc_prosecutor-rear.png',
  },
  {
    id: 'npc_market_girl',
    name: 'Market Girl',
    role: 'market',
    look: 'cheerful young halfling market girl, auburn braids, green apron, produce basket, sturdy brown leather shoes, no bare feet',
    front: '/assets/characters/npc_market_girl-front.png',
    rear: '/assets/characters/npc_market_girl-rear.png',
  },
];

function characterById(id) {
  if (!id) return null;
  return (
    PLAYABLE_CHARACTERS.find((c) => c.id === id) ||
    NPC_CHARACTERS.find((c) => c.id === id) ||
    null
  );
}

function playableById(id) {
  return PLAYABLE_CHARACTERS.find((c) => c.id === id) || null;
}

function artUrl(characterId, view = 'front') {
  const c = characterById(characterId);
  if (!c) return null;
  return view === 'rear' ? c.rear : c.front;
}

module.exports = {
  PLAYABLE_CHARACTERS,
  NPC_CHARACTERS,
  characterById,
  playableById,
  artUrl,
  slugify,
};
