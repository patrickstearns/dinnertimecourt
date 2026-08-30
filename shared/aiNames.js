const crypto = require('crypto');
const { PLAYABLE_CHARACTERS } = require('./characters');

const AI_NAMES = PLAYABLE_CHARACTERS.map((c) => c.name);

function randomIndex(length) {
  if (length <= 0) return 0;
  return crypto.randomInt(0, length);
}

function shuffleAiNames(names = AI_NAMES) {
  const arr = [...names];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomAiName(usedNames = [], bag = null) {
  const used = new Set(usedNames.map((n) => n.toLowerCase()));

  if (Array.isArray(bag) && bag.length) {
    while (bag.length) {
      const name = bag.shift();
      if (!used.has(name.toLowerCase())) return name;
    }
  }

  const pool = AI_NAMES.filter((n) => !used.has(n.toLowerCase()));
  if (!pool.length) {
    return `Counsel ${usedNames.length + 1}`;
  }
  return pool[randomIndex(pool.length)];
}

module.exports = { AI_NAMES, pickRandomAiName, shuffleAiNames };
