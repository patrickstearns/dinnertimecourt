/** Simple heuristic AI for Dinnertime Court */

function pickMarketAction(engine, playerId) {
  const player = engine.playerById(playerId);
  if (!player || engine.phase !== 'day_market') return { type: 'pass' };
  if (player.seat !== engine.day.turnSeat) return null;

  const recipeCost = engine.config.recipeDeckBuyCost != null ? engine.config.recipeDeckBuyCost : 1;
  const argumentCost = engine.config.argumentDeckBuyCost != null ? engine.config.argumentDeckBuyCost : 4;
  const pantryCost = engine.config.ingredientDeckBuyCost != null ? engine.config.ingredientDeckBuyCost : 2;
  const argsInHand = player.hand.filter((h) => h.type === 'argument').length;
  const argStock = (engine.argumentDeck?.length || 0) + (engine.argumentDiscard?.length || 0);
  if (
    argsInHand === 0 &&
    player.gold >= 6 &&
    player.gold >= argumentCost &&
    argStock > 0
  ) {
    return { type: 'buy', source: 'argument' };
  }

  const options = [];

  for (const c of engine.ingredientMarket || []) {
    if (!c || c.empty) continue;
    if (c.cost <= player.gold) {
      let bonus = 0;
      for (const r of player.recipes) {
        if (r.ingredients.includes(c.id)) bonus += 3;
      }
      options.push({ type: 'buy', source: 'ingredient', instanceId: c.instanceId, score: 2 + bonus - c.cost * 0.3 });
    }
  }

  const pantryStock = (engine.ingredientDeck?.length || 0) + (engine.ingredientDiscard?.length || 0);
  if (player.gold >= pantryCost && pantryStock > 0) {
    let missing = 0;
    for (const r of player.recipes) {
      for (const ing of r.ingredients) {
        const have = player.hand.some((h) => h.type === 'ingredient' && h.id === ing);
        if (!have) missing += 1;
      }
    }
    if (missing > 0) {
      options.push({ type: 'buy', source: 'ingredient_deck', score: 2 + missing * 0.8 - pantryCost * 0.2 });
    }
  }

  if (player.gold >= recipeCost && (engine.recipeDeck?.length || engine.recipeDiscard?.length) && player.recipes.length < 4) {
    options.push({ type: 'buy', source: 'recipe', score: 7 - player.recipes.length });
  }

  if (player.gold >= argumentCost && (engine.argumentDeck?.length || engine.argumentDiscard?.length)) {
    options.push({ type: 'buy', source: 'argument', score: 6 - argumentCost });
  }

  options.sort((a, b) => b.score - a.score);
  const best = options[0];
  if (!best || best.score < 1) return { type: 'pass' };
  return { type: 'buy', source: best.source, instanceId: best.instanceId };
}

function pickCookActions(engine, playerId) {
  const player = engine.playerById(playerId);
  if (!player) return [];
  const actions = [];
  const recipes = [...player.recipes].sort((a, b) => {
    const val = (r) => r.effect?.amount || r.effect?.self || (r.effect?.kind === 'swap_scores' ? 4 : 3);
    return val(b) - val(a);
  });
  for (const r of recipes) {
    if (engine.canCook(playerId, r.id)) {
      actions.push({ type: 'cook', recipeId: r.id });
    }
  }
  return actions;
}

/** Expected value of a play toward beating caseDifficulty with a final d6. */
function effectValue(effect, player, night) {
  if (!effect) return 0;
  const my = night.defenseScore;
  const diff = night.caseDifficulty;
  const need = diff - my;
  switch (effect.kind) {
    case 'self':
      return effect.amount;
    case 'self_and_opp':
      return effect.self - (effect.opp || 0);
    case 'self_if_food':
      return player.foodTokens.length > 0 ? effect.withFood : effect.withoutFood;
    case 'self_and_force_pass':
      return effect.amount + 1;
    case 'force_pass':
      return 2;
    case 'swap_scores':
      return diff - my;
    case 'spend_prestige':
      if ((player.prestige || 0) < (effect.prestigeCost || 1)) return -20;
      return effect.amount - (effect.prestigeCost || 1) * 1.5;
    case 'raise_stakes':
      return -(effect.difficulty || 0) + (effect.prestige || 0) * 0.5;
    case 'ease_case':
      return (effect.difficulty || 0) - (effect.prestige || 0) - (effect.gp || 0) * 0.2;
    case 'self_and_raise_stakes':
      return effect.amount - (effect.difficulty || 0) + (effect.prestige || 0) * 0.4;
    case 'end_case_no_score':
      return need > 6 ? 10 : -8;
    case 'nullify_last_argument':
      return night.lastArgument ? 4 : 0.2;
    case 'nullify_last_food':
      return night.lastFood ? 4 : 0.2;
    default:
      return 1;
  }
}

function pickCourtAction(engine, playerId) {
  const n = engine.night;
  const player = engine.playerById(playerId);
  if (!n || !player || playerId !== n.currentActorId) return null;
  if (playerId !== n.defenseId) return { type: 'pass' };

  const my = n.defenseScore;
  const diff = n.caseDifficulty;
  const need = diff - my;

  const options = [];
  for (const c of player.hand.filter((x) => x.type === 'argument')) {
    options.push({
      type: 'argument',
      instanceId: c.instanceId,
      value: effectValue(c.effect, player, n),
    });
  }
  for (const t of player.foodTokens) {
    options.push({
      type: 'food',
      tokenId: t.tokenId,
      value: effectValue(t.effect, player, n),
    });
  }
  options.sort((a, b) => b.value - a.value);
  const best = options[0];

  // Guaranteed win on the judgement die — rest and roll.
  if (need <= 1) return { type: 'pass' };
  if (!best) return { type: 'pass' };

  // Avoid self-sabotage; otherwise keep playing to win the case.
  if (best.value < -4) return { type: 'pass' };

  if (best.type === 'argument') return { type: 'argument', instanceId: best.instanceId };
  return { type: 'food', tokenId: best.tokenId };
}

module.exports = { pickMarketAction, pickCookActions, pickCourtAction };
