const defaultConfig = require('../shared/config');
const {
  buildIngredientDeck,
  buildRecipeDeck,
  buildArgumentDeck,
  buildCaseDeck,
  dealStarterRecipes,
  drawRandomIngredients,
  getRecipeImage,
  describeEffect,
  shuffle,
  enrichCaseCard,
  enrichArgumentCard,
  enrichRecipeCard,
  prosecutorAccusationFor,
} = require('../shared/cards');
const crypto = require('crypto');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function cryptoRandomIntInclusive(min, max) {
  return crypto.randomInt(min, max + 1);
}

/** Map printed case difficulty (post-rebalance) to Prestige reward 1–3. */
function prestigeForDifficulty(difficulty) {
  const d = Number(difficulty);
  if (!Number.isFinite(d) || d <= 2) return 1;
  if (d <= 4) return 2;
  return 3;
}

class GameEngine {
  constructor(players, config = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
      recipeDeckBuyCost: config.recipeDeckBuyCost ?? defaultConfig.recipeDeckBuyCost ?? 1,
      argumentDeckBuyCost: config.argumentDeckBuyCost ?? defaultConfig.argumentDeckBuyCost ?? 4,
      argumentSellValue: config.argumentSellValue ?? defaultConfig.argumentSellValue ?? 2,
      ingredientDeckBuyCost: config.ingredientDeckBuyCost ?? defaultConfig.ingredientDeckBuyCost ?? 2,
      partnershipPrestige:
        config.partnershipPrestige ??
        config.partnershipGp ??
        defaultConfig.partnershipPrestige ??
        10,
    };
    this.players = players.map((p, i) => ({
      id: p.id,
      name: p.name,
      characterId: p.characterId || null,
      isAI: !!p.isAI,
      isHost: !!p.isHost,
      seat: i,
      gold: this.config.startingGold,
      prestige: 0,
      casesWon: 0,
      hand: [], // ingredients + arguments
      recipes: [], // recipe cards owned
      foodTokens: [], // { recipeId, name, effect, tokenId }
      connected: p.connected !== false,
    }));
    this.judgeIndex = this.players.length > 0 ? cryptoRandomIntInclusive(0, this.players.length - 1) : 0;
    this.round = 1;
    this.phase = 'day_market';
    this.ingredientDeck = buildIngredientDeck();
    this.ingredientDiscard = [];
    this.ingredientMarket = [];
    this.recipeDeck = buildRecipeDeck();
    this.recipeDiscard = [];
    this.argumentDeck = buildArgumentDeck();
    this.argumentDiscard = [];
    this.caseDeck = buildCaseDeck();
    this.caseDiscard = [];
    this.log = [];
    this.winnerId = null;
    this.tieBreakNote = null;
    this.day = {
      turnSeat: null,
      passed: [],
    };
    this.cook = {
      done: [],
    };
    this.night = null;
    this._tokenSeq = 0;
    this._playSeq = 0;
    this._startSeq = 0;
    this._caseResultSeq = 0;
    this._wagesSeq = 0;
    this.lastNightCaseResult = null;
    this.pendingNightSummary = null;
    this.pendingDailyWages = null;

    this._dealStartingLoadouts();
    this._startDayMarket();
  }

  _dealStartingLoadouts() {
    const starters = dealStarterRecipes(this.players.length, 2);
    const starterIds = new Set();
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      const recipes = starters[i] || [];
      for (const recipe of recipes) {
        starterIds.add(recipe.id);
        p.recipes.push({
          id: recipe.id,
          name: recipe.name,
          ingredients: [...recipe.ingredients],
          effect: recipe.effect,
          flavor: recipe.flavor,
          image: recipe.image || getRecipeImage(recipe.id),
        });
      }
      for (const ing of drawRandomIngredients(3)) {
        p.hand.push({
          ...ing,
          instanceId: `start_${++this._startSeq}_${p.id}`,
          freshness: this._ingredientFreshness(),
        });
      }
      const recipeNames = recipes.map((r) => r.name).join(' & ');
      this.addLog(`${p.name} starts with ${recipeNames || 'no recipes'} and three pantry staples.`);
    }
    // Each recipe exists once in the game — starters leave the buy deck.
    if (starterIds.size) {
      this.recipeDeck = this.recipeDeck.filter((r) => !starterIds.has(r.id));
    }
  }

  _ingredientFreshness() {
    return this.config.ingredientFreshness ?? this.config.marketIngredientFreshness ?? 3;
  }

  addLog(msg) {
    this.log.push({ t: Date.now(), msg });
    if (this.log.length > 80) this.log.shift();
  }

  playerById(id) {
    return this.players.find((p) => p.id === id);
  }

  playerBySeat(seat) {
    return this.players.find((p) => p.seat === seat);
  }

  leftOf(seat) {
    return (seat + 1) % this.players.length;
  }

  publicState(forPlayerId = null) {
    const night = this.night
      ? (() => {
          const activeCase = this.night.activeCase ? enrichCaseCard(this.night.activeCase) : null;
          const prosecutorRoll = this.night.prosecutorRoll;
          const lastPlay = this.night.lastPlay
            ? {
                ...this.night.lastPlay,
                card:
                  this.night.lastPlay.kind === 'argument' && this.night.lastPlay.card
                    ? enrichArgumentCard(this.night.lastPlay.card)
                    : this.night.lastPlay.kind === 'food' && this.night.lastPlay.card
                      ? enrichRecipeCard(this.night.lastPlay.card)
                      : this.night.lastPlay.card,
              }
            : null;
          return {
            ...this.night,
            activeCase,
            lastPlay,
            prosecutorAccusation:
              activeCase && prosecutorRoll
                ? prosecutorAccusationFor(activeCase, prosecutorRoll)
                : this.night.prosecutorAccusation,
            pendingCases: this.night.pendingCases.map((pc) => {
              const card =
                pc.revealed || forPlayerId === 'spectator'
                  ? enrichCaseCard(pc.card)
                  : { instanceId: pc.card.instanceId, type: 'case' };
              return {
                targetPlayerId: pc.targetPlayerId,
                revealed: pc.revealed,
                card,
              };
            }),
          };
        })()
      : null;

    return {
      config: this.config,
      phase: this.phase,
      round: this.round,
      judgeIndex: this.judgeIndex,
      judgeId: this.players[this.judgeIndex]?.id,
      firstPlayerId: this.players[this.judgeIndex]?.id,
      firstPlayerIndex: this.judgeIndex,
      ingredientMarket: (this.ingredientMarket || []).map((c, slot) =>
        c && !c.empty ? { ...c, slot } : { empty: true, slot }
      ),
      ingredientDeckCount: this.ingredientDeck.length,
      ingredientDiscardCount: this.ingredientDiscard.length,
      canBuyIngredientDeck: this.ingredientDeck.length > 0 || this.ingredientDiscard.length > 0,
      recipeDeckCount: this.recipeDeck.length,
      recipeDiscardCount: this.recipeDiscard.length,
      canBuyRecipeDeck: this.recipeDeck.length > 0 || this.recipeDiscard.length > 0,
      argumentDeckCount: this.argumentDeck.length,
      argumentDiscardCount: this.argumentDiscard.length,
      canBuyArgumentDeck: this.argumentDeck.length > 0 || this.argumentDiscard.length > 0,
      ingredientDeckBuyCost: this.config.ingredientDeckBuyCost || 2,
      recipeDeckBuyCost: this.config.recipeDeckBuyCost ?? 1,
      argumentDeckBuyCost: this.config.argumentDeckBuyCost ?? 4,
      deckBuyCost: this.config.deckBuyCost || 2,
      caseDeckCount: this.caseDeck.length,
      day: this.day,
      cook: this.cook,
      night,
      winnerId: this.winnerId,
      tieBreakNote: this.tieBreakNote,
      pendingNightSummary: this.pendingNightSummary,
      pendingDailyWages: this.pendingDailyWages,
      log: this.log.slice(-30),
      players: this.players.map((p) => {
        const ingredientCount = p.hand.filter((c) => c.type === 'ingredient').length;
        const argumentCount = p.hand.filter((c) => c.type === 'argument').length;
        const base = {
          id: p.id,
          name: p.name,
          characterId: p.characterId || null,
          isAI: p.isAI,
          isHost: p.isHost,
          seat: p.seat,
          gold: p.gold,
          prestige: p.prestige || 0,
          casesWon: p.casesWon,
          recipes: p.recipes,
          foodTokens: p.foodTokens,
          handCount: p.hand.length,
          ingredientCount,
          argumentCount,
          recipeCount: p.recipes.length,
          foodTokenCount: p.foodTokens.length,
          connected: p.connected,
        };
        if (forPlayerId === p.id || forPlayerId === 'all') {
          return { ...base, hand: p.hand };
        }
        return base;
      }),
    };
  }

  _peekDeckTop(deck) {
    if (!deck.length) return null;
    const top = deck[deck.length - 1];
    return { ...top, cost: this.config.deckBuyCost || 2 };
  }

  _drawIngredient() {
    if (this.ingredientDeck.length === 0) {
      if (this.ingredientDiscard.length === 0) return null;
      this.ingredientDeck = shuffle(this.ingredientDiscard);
      this.ingredientDiscard = [];
      this.addLog('Ingredient stock reshuffled.');
    }
    return this.ingredientDeck.pop();
  }

  _drawRecipeFromDeck() {
    if (this.recipeDeck.length === 0) {
      if (this.recipeDiscard.length === 0) return null;
      this.recipeDeck = shuffle(this.recipeDiscard);
      this.recipeDiscard = [];
      this.addLog('Recipe deck reshuffled.');
    }
    return this.recipeDeck.pop();
  }

  _drawArgumentFromDeck() {
    if (this.argumentDeck.length === 0) {
      if (this.argumentDiscard.length === 0) return null;
      this.argumentDeck = shuffle(this.argumentDiscard);
      this.argumentDiscard = [];
      this.addLog('Argument deck reshuffled.');
    }
    return this.argumentDeck.pop();
  }

  // ——— Day: Market ———
  _startDayMarket() {
    this.phase = 'day_market';
    this.pendingNightSummary = null;
    this.lastNightCaseResult = null;
    this.day = { turnSeat: this.judgeIndex, passed: [] };
    this.cook = { done: [] };
    const slots = this.config.marketIngredientSlots || 12;
    this.ingredientMarket = [];
    for (let i = 0; i < slots; i++) {
      // Keep a fixed slot list; purchases leave empty placeholders in place.
      const card = this._drawIngredient();
      if (!card) {
        this.addLog(`Market slot ${i + 1} left empty — pantry exhausted.`);
      }
      this.ingredientMarket.push(card || { empty: true });
    }
    this.addLog(
      `Day ${this.round}: The market opens. ${this.players[this.judgeIndex].name} holds the First Player Token.`
    );
  }

  buyMarketCard(playerId, payload = {}) {
    this.pendingNightSummary = null;
    if (this.phase !== 'day_market') return { ok: false, error: 'Not market phase' };
    const player = this.playerById(playerId);
    if (!player) return { ok: false, error: 'Unknown player' };
    if (player.seat !== this.day.turnSeat) return { ok: false, error: 'Not your turn' };
    if (this.day.passed.includes(playerId)) return { ok: false, error: 'You already passed' };

    let source = payload.source || payload.purchaseSource || payload.deck || 'ingredient';
    if (source === 'ingredient-deck' || source === 'pantry') source = 'ingredient_deck';
    if (source === 'ingredient') {
      return this._buyIngredient(player, payload.instanceId);
    }
    if (source === 'ingredient_deck') {
      return this._buyIngredientDeck(player);
    }
    if (source === 'recipe') {
      return this._buyRecipeDeck(player);
    }
    if (source === 'argument') {
      return this._buyArgumentDeck(player);
    }
    return { ok: false, error: `Unknown purchase type: ${source}` };
  }

  _buyIngredient(player, instanceId) {
    const idx = this.ingredientMarket.findIndex((c) => c && !c.empty && c.instanceId === instanceId);
    if (idx < 0) return { ok: false, error: 'Ingredient not in market' };
    const card = this.ingredientMarket[idx];
    if (player.gold < card.cost) return { ok: false, error: 'Not enough gold' };

    player.gold -= card.cost;
    // Leave the slot vacant so remaining cards do not shift.
    this.ingredientMarket[idx] = { empty: true };
    player.hand.push({
      id: card.id,
      name: card.name,
      type: card.type,
      effect: card.effect,
      flavor: card.flavor,
      image: card.image,
      instanceId: card.instanceId,
      freshness: this._ingredientFreshness(),
    });
    this.addLog(`${player.name} bought ${card.name} for ${card.cost}g.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  _buyIngredientDeck(player) {
    const cost = this.config.ingredientDeckBuyCost || 2;
    if (player.gold < cost) return { ok: false, error: 'Not enough gold' };
    const card = this._drawIngredient();
    if (!card) return { ok: false, error: 'Ingredient deck is empty' };

    player.gold -= cost;
    player.hand.push({
      id: card.id,
      name: card.name,
      type: card.type,
      effect: card.effect,
      flavor: card.flavor,
      image: card.image,
      instanceId: card.instanceId,
      freshness: this._ingredientFreshness(),
    });
    this.addLog(`${player.name} bought a pantry staple from the deck for ${cost}g.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  _buyRecipeDeck(player) {
    const cost = this.config.recipeDeckBuyCost != null ? this.config.recipeDeckBuyCost : 1;
    if (player.gold < cost) return { ok: false, error: 'Not enough gold' };

    const skipped = [];
    let card = null;
    while (true) {
      const drawn = this._drawRecipeFromDeck();
      if (!drawn) break;
      if (player.recipes.some((r) => r.id === drawn.id)) {
        skipped.push(drawn);
        continue;
      }
      card = drawn;
      break;
    }
    for (const dup of skipped) this.recipeDiscard.push(dup);

    if (!card) return { ok: false, error: 'No new recipes left for you to learn' };

    player.gold -= cost;
    player.recipes.push({
      id: card.id,
      name: card.name,
      ingredients: card.ingredients,
      effect: card.effect,
      flavor: card.flavor,
      image: card.image || getRecipeImage(card.id),
    });
    this.addLog(`${player.name} bought a recipe for ${cost}g.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  _buyArgumentDeck(player) {
    const cost = this.config.argumentDeckBuyCost != null ? this.config.argumentDeckBuyCost : 4;
    if (player.gold < cost) return { ok: false, error: 'Not enough gold' };
    const card = this._drawArgumentFromDeck();
    if (!card) return { ok: false, error: 'Argument deck is empty' };

    player.gold -= cost;
    player.hand.push({
      id: card.id,
      name: card.name,
      type: card.type,
      effect: card.effect,
      flavor: card.flavor,
      instanceId: card.instanceId,
    });
    this.addLog(`${player.name} bought a legal argument for ${cost}g.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  sellArgument(playerId, instanceId) {
    this.pendingNightSummary = null;
    if (this.phase !== 'day_market') return { ok: false, error: 'Not market phase' };
    const player = this.playerById(playerId);
    if (!player) return { ok: false, error: 'Unknown player' };
    if (player.seat !== this.day.turnSeat) return { ok: false, error: 'Not your turn' };
    if (this.day.passed.includes(playerId)) return { ok: false, error: 'You already passed' };

    const idx = player.hand.findIndex((c) => c.instanceId === instanceId && c.type === 'argument');
    if (idx < 0) return { ok: false, error: 'Argument not in hand' };

    const card = player.hand.splice(idx, 1)[0];
    const value = this.config.argumentSellValue != null ? this.config.argumentSellValue : 2;
    player.gold += value;
    this.argumentDiscard.push(card);
    this.addLog(`${player.name} sold ${card.name} for ${value}g.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  passMarket(playerId) {
    this.pendingNightSummary = null;
    if (this.phase !== 'day_market') return { ok: false, error: 'Not market phase' };
    const player = this.playerById(playerId);
    if (!player) return { ok: false, error: 'Unknown player' };
    if (player.seat !== this.day.turnSeat) return { ok: false, error: 'Not your turn' };
    if (!this.day.passed.includes(playerId)) this.day.passed.push(playerId);
    this.addLog(`${player.name} passes on the market.`);
    this._advanceMarketTurn();
    return { ok: true };
  }

  _advanceMarketTurn() {
    if (this.day.passed.length >= this.players.length) {
      this._endMarket();
      return;
    }
    let seat = this.day.turnSeat;
    for (let i = 0; i < this.players.length; i++) {
      seat = this.leftOf(seat);
      const p = this.playerBySeat(seat);
      if (!this.day.passed.includes(p.id)) {
        this.day.turnSeat = seat;
        return;
      }
    }
    this._endMarket();
  }

  _endMarket() {
    for (const card of this.ingredientMarket) {
      if (card && !card.empty) this.ingredientDiscard.push(card);
    }
    this.ingredientMarket = [];
    this.addLog('Unsold ingredients discarded. Cooking begins!');
    this.phase = 'day_cook';
    this.cook = { done: [] };
  }

  // ——— Day: Cook ———
  cookRecipe(playerId, recipeId) {
    if (this.phase !== 'day_cook') return { ok: false, error: 'Not cook phase' };
    const player = this.playerById(playerId);
    if (!player) return { ok: false, error: 'Unknown player' };
    if (this.cook.done.includes(playerId)) return { ok: false, error: 'Already finished cooking' };

    const recipe = player.recipes.find((r) => r.id === recipeId);
    if (!recipe) return { ok: false, error: 'You do not have that recipe' };

    // Only one cook per recipe card per round
    if (player.foodTokens.some((t) => t.recipeId === recipeId && t.cookedRound === this.round)) {
      return { ok: false, error: 'Already cooked that recipe this round' };
    }

    const needed = [...recipe.ingredients];
    const usedInstances = [];
    const handCopy = [...player.hand];
    const maxFresh = this._ingredientFreshness();

    for (const ingId of needed) {
      const candidates = handCopy
        .filter((c) => c.type === 'ingredient' && c.id === ingId && !usedInstances.includes(c.instanceId))
        .sort((a, b) => {
          const fa = a.freshness != null ? a.freshness : maxFresh;
          const fb = b.freshness != null ? b.freshness : maxFresh;
          return fa - fb; // more spoiled (lower freshness) first
        });
      if (!candidates.length) return { ok: false, error: `Missing ingredient: ${ingId}` };
      usedInstances.push(candidates[0].instanceId);
    }

    player.hand = player.hand.filter((c) => !usedInstances.includes(c.instanceId));
    const tokenId = `food_${++this._tokenSeq}`;
    player.foodTokens.push({
      tokenId,
      recipeId: recipe.id,
      name: recipe.name,
      image: recipe.image || getRecipeImage(recipe.id),
      effect: recipe.effect,
      judgeDialogue: recipe.judgeDialogue,
      cookedRound: this.round,
    });
    this.addLog(`${player.name} cooked ${recipe.name}!`);
    return { ok: true };
  }

  finishCooking(playerId) {
    if (this.phase !== 'day_cook') return { ok: false, error: 'Not cook phase' };
    const player = this.playerById(playerId);
    if (!player) return { ok: false, error: 'Unknown player' };
    if (this.cook.done.includes(playerId)) return { ok: true, spoiled: 0 };
    this.cook.done.push(playerId);
    this.addLog(`${player.name} is done cooking.`);
    const spoiled = this._decayPlayerIngredients(player);
    if (spoiled > 0) {
      this.addLog('Discarded spoilt ingredients.');
    }
    if (this.cook.done.length >= this.players.length) {
      this._endCook();
    }
    return { ok: true, spoiled };
  }

  _endCook() {
    this._startNight();
  }

  // ——— Night ———
  _startNight() {
    this.phase = 'night_case';
    this.addLog(`Night ${this.round}: Court is in session!`);

    // One case per player as defense counsel vs NPC prosecution.
    const pending = [];
    const order = [];
    for (let i = 0; i < this.players.length; i++) {
      order.push(this.players[(this.judgeIndex + i) % this.players.length]);
    }
    for (const p of order) {
      if (this.caseDeck.length === 0) {
        this.caseDeck = shuffle(this.caseDiscard);
        this.caseDiscard = [];
      }
      const card = enrichCaseCard(this.caseDeck.pop());
      if (!card) break;
      pending.push({
        targetPlayerId: p.id,
        card,
        revealed: false,
        resolved: false,
      });
    }

    if (pending.length !== this.players.length) {
      console.warn(
        `[court] Expected ${this.players.length} cases, dealt ${pending.length}. caseDeck=${this.caseDeck.length} discard=${this.caseDiscard.length}`
      );
    }

    this.night = {
      pendingCases: pending,
      currentIndex: 0,
      defenseId: null,
      defenseScore: 0,
      caseDifficulty: 0,
      caseBaseDifficulty: 0,
      prosecutorRoll: 0,
      prosecutorAccusation: null,
      casePrestigeReward: 0,
      caseGpReward: 0,
      currentActorId: null,
      lastArgument: null,
      lastFood: null,
      endedEarly: false,
      activeCase: null,
      pendingDice: null,
      awaitingDice: false,
      awaitingAdvance: false,
      lastPlay: null,
    };

    if (pending.length === 0) {
      this._endRound();
      return;
    }
    this._beginCurrentCase();
  }

  _beginCurrentCase() {
    const n = this.night;
    while (n.currentIndex < n.pendingCases.length && n.pendingCases[n.currentIndex].resolved) {
      n.currentIndex++;
    }
    if (n.currentIndex >= n.pendingCases.length) {
      this._endRound();
      return;
    }

    const pc = n.pendingCases[n.currentIndex];
    pc.card = enrichCaseCard(pc.card);
    pc.revealed = true;
    const defense = this.playerById(pc.targetPlayerId);
    n.defenseId = defense.id;
    n.defenseScore = 0;
    const baseDiff = Number(pc.card.difficulty) > 0 ? Number(pc.card.difficulty) : 1;
    if (pc.card.difficulty == null) pc.card.difficulty = baseDiff;
    n.caseBaseDifficulty = baseDiff;
    n.prosecutorRoll = this._rollD6();
    n.prosecutorAccusation = prosecutorAccusationFor(pc.card, n.prosecutorRoll);
    n.caseDifficulty = baseDiff + n.prosecutorRoll;
    n.casePrestigeReward = prestigeForDifficulty(pc.card.difficulty);
    n.caseGpReward = pc.card.gp || 0;
    n.lastArgument = null;
    n.lastFood = null;
    n.endedEarly = false;
    n.pendingDice = null;
    n.awaitingDice = false;
    n.awaitingAdvance = false;
    n.lastPlay = null;
    n.activeCase = pc.card;
    n.currentActorId = n.defenseId;
    this.addLog(
      `Case: "${pc.card.name}" — ${defense.name} for the defense vs the Crown. Base ${baseDiff} + prosecutor d6 ${n.prosecutorRoll} = difficulty ${n.caseDifficulty}. Stakes: ${n.casePrestigeReward} Prestige, ${n.caseGpReward} GP.`
    );
  }

  _snapshotScores() {
    const n = this.night;
    return {
      d: n.defenseScore,
      difficulty: n.caseDifficulty,
      casePrestige: n.casePrestigeReward,
      caseGp: n.caseGpReward,
    };
  }

  courtAction(playerId, action) {
    // action: { type: 'pass' } | { type: 'argument', instanceId } | { type: 'food', tokenId }
    if (this.phase !== 'night_case') return { ok: false, error: 'Not court phase' };
    const n = this.night;
    if (!n || !n.activeCase) return { ok: false, error: 'No active case' };
    if (n.awaitingDice || n.awaitingAdvance) return { ok: false, error: 'Case is resolving' };
    if (playerId !== n.currentActorId) return { ok: false, error: 'Not your turn in court' };
    if (playerId !== n.defenseId) return { ok: false, error: 'Only the defense may act' };

    const player = this.playerById(playerId);

    if (action.type === 'pass') {
      this._startDiceResolution();
      return { ok: true };
    }

    if (action.type === 'argument') {
      const cardIdx = player.hand.findIndex((c) => c.instanceId === action.instanceId && c.type === 'argument');
      if (cardIdx < 0) return { ok: false, error: 'Argument not in hand' };
      const card = enrichArgumentCard(player.hand[cardIdx]);
      const scoresBefore = this._snapshotScores();
      player.hand.splice(cardIdx, 1);
      const result = this._applyEffect(player, card.effect, 'argument', card);
      if (!result.ok) {
        player.hand.splice(cardIdx, 0, card);
        return result;
      }
      this.argumentDiscard.push(card);
      n.lastPlay = {
        playId: ++this._playSeq,
        playerId: player.id,
        playerName: player.name,
        kind: 'argument',
        instanceId: card.instanceId,
        scoresBefore,
        scoresAfter: this._snapshotScores(),
        card: {
          id: card.id,
          name: card.name,
          dialogue: card.dialogue,
          type: 'argument',
          effect: card.effect,
          flavor: card.flavor,
          image: card.image || '/assets/arguments/scales.svg',
          instanceId: card.instanceId,
        },
      };
      if (n.endedEarly) {
        this._resolveCase();
        return { ok: true };
      }
      n.currentActorId = n.defenseId;
      return { ok: true };
    }

    if (action.type === 'food') {
      const tIdx = player.foodTokens.findIndex((t) => t.tokenId === action.tokenId);
      if (tIdx < 0) return { ok: false, error: 'No such food token' };
      const token = enrichRecipeCard(player.foodTokens[tIdx]);
      const scoresBefore = this._snapshotScores();
      player.foodTokens.splice(tIdx, 1);
      const result = this._applyEffect(player, token.effect, 'food', token);
      if (!result.ok) {
        player.foodTokens.splice(tIdx, 0, token);
        return result;
      }
      n.lastPlay = {
        playId: ++this._playSeq,
        playerId: player.id,
        playerName: player.name,
        kind: 'food',
        tokenId: token.tokenId,
        scoresBefore,
        scoresAfter: this._snapshotScores(),
        card: {
          name: token.name,
          type: 'food',
          effect: token.effect,
          effectText: describeEffect(token.effect),
          image: token.image || getRecipeImage(token.recipeId),
          recipeId: token.recipeId,
          judgeDialogue: token.judgeDialogue,
          tokenId: token.tokenId,
        },
      };
      if (n.endedEarly) {
        this._resolveCase();
        return { ok: true };
      }
      n.currentActorId = n.defenseId;
      return { ok: true };
    }

    return { ok: false, error: 'Unknown action' };
  }

  _rollD6() {
    return cryptoRandomIntInclusive(1, 6);
  }

  _startDiceResolution() {
    const n = this.night;
    n.lastPlay = null;
    const defense = this.playerById(n.defenseId);
    const scoreBefore = this._snapshotScores();
    const defenseRoll = this._rollD6();

    n.defenseScore += defenseRoll;
    const success = n.defenseScore >= n.caseDifficulty;
    n.pendingDice = {
      die: 6,
      defenseRoll,
      defenseId: n.defenseId,
      defenseName: defense?.name || 'Defense',
      scoreBefore,
      defenseScore: n.defenseScore,
      caseDifficulty: n.caseDifficulty,
      success,
    };
    n.awaitingDice = true;
    n.currentActorId = null;
    this.addLog(
      `Defense rests — rolling d6! ${defense?.name} ${scoreBefore.d}+${defenseRoll}=${n.defenseScore} vs difficulty ${n.caseDifficulty}.`
    );
  }

  finalizeDiceAndResolve() {
    const n = this.night;
    if (!n?.awaitingDice) return;
    n.awaitingDice = false;
    n.pendingDice = null;
    this._resolveCase();
  }

  _applyEffect(player, effect, sourceType, source) {
    const n = this.night;
    const lowerDifficulty = (amt) => {
      n.caseDifficulty = Math.max(1, n.caseDifficulty - amt);
    };
    const raiseDifficulty = (amt) => {
      n.caseDifficulty += amt;
    };

    const restoreSnapshot = (prev) => {
      n.defenseScore = prev.scoresBefore.d;
      n.caseDifficulty = prev.scoresBefore.difficulty;
      if (prev.scoresBefore.casePrestige != null) n.casePrestigeReward = prev.scoresBefore.casePrestige;
      if (prev.scoresBefore.caseGp != null) n.caseGpReward = prev.scoresBefore.caseGp;
      if (prev.prestigeSpent && prev.spenderId) {
        const spender = this.playerById(prev.spenderId);
        if (spender) spender.prestige = (spender.prestige || 0) + prev.prestigeSpent;
      }
    };

    const undoLastArgument = () => {
      if (!n.lastArgument) return false;
      restoreSnapshot(n.lastArgument);
      this.addLog(`Nuh-Uh! ${n.lastArgument.cardName} is nullified.`);
      n.lastArgument = null;
      return true;
    };

    const undoLastFood = () => {
      if (!n.lastFood) return false;
      const prev = n.lastFood;
      restoreSnapshot(prev);
      this.addLog(`Mystery Quiche nullifies ${prev.name}!`);
      n.lastFood = null;
      return true;
    };

    const scoresBefore = this._snapshotScores();
    let prestigeSpent = 0;

    switch (effect.kind) {
      case 'self': {
        n.defenseScore += effect.amount;
        this.addLog(`${player.name} plays ${source.name}: +${effect.amount}.`);
        break;
      }
      case 'self_and_opp': {
        n.defenseScore += effect.self;
        n.caseDifficulty = Math.max(1, n.caseDifficulty + (effect.opp || 0));
        this.addLog(`${player.name} plays ${source.name}: +${effect.self} / difficulty ${effect.opp >= 0 ? '+' : ''}${effect.opp}.`);
        break;
      }
      case 'self_if_food': {
        const hasFood = player.foodTokens.length > 0;
        const amt = hasFood ? effect.withFood : effect.withoutFood;
        n.defenseScore += amt;
        this.addLog(`${player.name} plays ${source.name}: +${amt}${hasFood ? ' (with snacks)' : ''}.`);
        break;
      }
      case 'self_and_force_pass': {
        n.defenseScore += effect.amount;
        lowerDifficulty(1);
        this.addLog(`${player.name} plays ${source.name}: +${effect.amount}; difficulty −1.`);
        break;
      }
      case 'force_pass': {
        lowerDifficulty(2);
        this.addLog(`${player.name} plays ${source.name}: difficulty −2.`);
        break;
      }
      case 'swap_scores': {
        const tmp = n.defenseScore;
        n.defenseScore = n.caseDifficulty;
        n.caseDifficulty = Math.max(1, tmp);
        this.addLog(`${player.name} plays ${source.name}: score and difficulty swapped!`);
        break;
      }
      case 'spend_prestige': {
        const cost = effect.prestigeCost || 1;
        if ((player.prestige || 0) < cost) {
          return { ok: false, error: `Need ${cost} Prestige to play this` };
        }
        player.prestige -= cost;
        prestigeSpent = cost;
        n.defenseScore += effect.amount;
        this.addLog(`${player.name} plays ${source.name}: −${cost} Prestige, +${effect.amount}.`);
        break;
      }
      case 'raise_stakes': {
        if (effect.difficulty) raiseDifficulty(effect.difficulty);
        if (effect.prestige) n.casePrestigeReward += effect.prestige;
        if (effect.gp) n.caseGpReward += effect.gp;
        const bits = [];
        if (effect.difficulty) bits.push(`difficulty +${effect.difficulty}`);
        if (effect.prestige) bits.push(`Prestige stake +${effect.prestige}`);
        if (effect.gp) bits.push(`GP stake +${effect.gp}`);
        this.addLog(`${player.name} plays ${source.name}: ${bits.join(', ')}.`);
        break;
      }
      case 'ease_case': {
        if (effect.difficulty) lowerDifficulty(effect.difficulty);
        if (effect.gp) n.caseGpReward = Math.max(0, n.caseGpReward - effect.gp);
        if (effect.prestige) n.casePrestigeReward = Math.max(0, n.casePrestigeReward - effect.prestige);
        const bits = [];
        if (effect.difficulty) bits.push(`difficulty −${effect.difficulty}`);
        if (effect.gp) bits.push(`GP stake −${effect.gp}`);
        if (effect.prestige) bits.push(`Prestige stake −${effect.prestige}`);
        this.addLog(`${player.name} plays ${source.name}: ${bits.join(', ')}.`);
        break;
      }
      case 'self_and_raise_stakes': {
        n.defenseScore += effect.amount;
        if (effect.difficulty) raiseDifficulty(effect.difficulty);
        if (effect.prestige) n.casePrestigeReward += effect.prestige;
        if (effect.gp) n.caseGpReward += effect.gp;
        this.addLog(
          `${player.name} plays ${source.name}: +${effect.amount}` +
            (effect.difficulty ? `, difficulty +${effect.difficulty}` : '') +
            (effect.prestige ? `, Prestige stake +${effect.prestige}` : '') +
            (effect.gp ? `, GP stake +${effect.gp}` : '') +
            '.'
        );
        break;
      }
      case 'end_case_no_score': {
        n.endedEarly = true;
        this.addLog(`${player.name} plays Plead for a Fifth! Case dismissed, no rewards.`);
        break;
      }
      case 'nullify_last_argument': {
        if (sourceType !== 'argument') return { ok: false, error: 'Invalid' };
        if (!undoLastArgument()) {
          this.addLog(`${player.name} plays Nuh-Uh, but nothing to nullify.`);
        }
        return { ok: true };
      }
      case 'nullify_last_food': {
        if (!undoLastFood()) {
          this.addLog(`${player.name} uses ${source.name}, but no food to nullify.`);
        }
        return { ok: true };
      }
      default:
        return { ok: false, error: 'Unknown effect' };
    }

    if (sourceType === 'argument' && effect.kind !== 'nullify_last_argument') {
      n.lastArgument = {
        playerId: player.id,
        spenderId: prestigeSpent ? player.id : null,
        cardName: source.name,
        effect,
        scoresBefore,
        prestigeSpent,
      };
    }
    if (sourceType === 'food' && effect.kind !== 'nullify_last_food') {
      n.lastFood = {
        name: source.name,
        effect,
        scoresBefore,
        prestigeSpent: 0,
        spenderId: null,
      };
    }

    return { ok: true };
  }

  _resolveCase() {
    const n = this.night;
    const pc = n.pendingCases[n.currentIndex];
    pc.resolved = true;
    const card = n.activeCase;
    const defense = this.playerById(n.defenseId);

    if (n.endedEarly) {
      this.caseDeck.unshift(card);
      this.addLog(`Case "${card.name}" shelved with no winner.`);
      this.lastNightCaseResult = { type: 'dismissed', caseName: card.name };
    } else if (n.defenseScore >= n.caseDifficulty) {
      const prestigeGain = Math.max(0, n.casePrestigeReward ?? prestigeForDifficulty(card.difficulty));
      const gpGain = Math.max(0, n.caseGpReward ?? card.gp ?? 0);
      defense.gold += gpGain;
      defense.prestige = (defense.prestige || 0) + prestigeGain;
      defense.casesWon += 1;
      this.addLog(
        `${defense.name} wins "${card.name}" (${n.defenseScore} ≥ ${n.caseDifficulty}) — +${prestigeGain} Prestige, +${gpGain} GP!`
      );
      this.caseDiscard.push(card);
      this.lastNightCaseResult = {
        type: 'win',
        winnerId: defense.id,
        winnerName: defense.name,
        gp: gpGain,
        prestige: prestigeGain,
        caseName: card.name,
        defenseScore: n.defenseScore,
        caseDifficulty: n.caseDifficulty,
      };
    } else {
      const fullGp = Math.max(0, n.caseGpReward ?? card.gp ?? 0);
      const gpGain = Math.ceil(fullGp / 2);
      defense.gold += gpGain;
      this.addLog(
        `${defense.name} loses "${card.name}" (${n.defenseScore} < ${n.caseDifficulty}). No Prestige, +${gpGain} GP.`
      );
      this.caseDiscard.push(card);
      this.lastNightCaseResult = {
        type: 'loss',
        defenseId: defense.id,
        defenseName: defense.name,
        winnerId: defense.id,
        gp: gpGain,
        caseName: card.name,
        defenseScore: n.defenseScore,
        caseDifficulty: n.caseDifficulty,
      };
    }

    n.activeCase = null;
    n.currentIndex += 1;
    const resultId = ++this._caseResultSeq;
    this.pendingNightSummary = this.lastNightCaseResult
      ? { ...this.lastNightCaseResult, resultId }
      : { type: 'loss', caseName: card?.name || 'Case', resultId };
    n.awaitingAdvance = true;
    n.currentActorId = null;
  }

  advanceNightAfterSummary() {
    const n = this.night;
    if (!n?.awaitingAdvance) return;
    n.awaitingAdvance = false;
    this.pendingNightSummary = null;
    this._beginCurrentCase();
  }

  _tryDeclareWinner() {
    const threshold = this.config.partnershipPrestige ?? this.config.partnershipGp ?? 10;
    const eligible = this.players.filter((p) => (p.prestige || 0) >= threshold);
    if (eligible.length === 0) return false;
    if (eligible.length === 1) {
      this.winnerId = eligible[0].id;
      this.phase = 'game_over';
      this.addLog(`${eligible[0].name} makes Partner with ${eligible[0].prestige} Prestige!`);
      return true;
    }
    eligible.sort((a, b) => {
      if ((b.prestige || 0) !== (a.prestige || 0)) return (b.prestige || 0) - (a.prestige || 0);
      if (b.casesWon !== a.casesWon) return b.casesWon - a.casesWon;
      if (b.gold !== a.gold) return b.gold - a.gold;
      return 0;
    });
    if (
      eligible[0].prestige !== eligible[1].prestige ||
      eligible[0].casesWon !== eligible[1].casesWon
    ) {
      this.winnerId = eligible[0].id;
      this.phase = 'game_over';
      this.addLog(`${eligible[0].name} makes Partner (tie-break)!`);
      return true;
    }
    this.tieBreakNote = 'equal Prestige and cases — milk chug contest!';
    const champ = shuffle([...eligible])[0];
    this.winnerId = champ.id;
    this.phase = 'game_over';
    this.addLog(`${champ.name} wins the ceremonial Milk chug-off!`);
    return true;
  }

  _decayPlayerIngredients(player) {
    if (!player) return 0;
    const maxFresh = this._ingredientFreshness();
    const kept = [];
    let spoiled = 0;
    for (const c of player.hand) {
      if (c.type !== 'ingredient') {
        kept.push(c);
        continue;
      }
      const current = c.freshness != null ? c.freshness : maxFresh;
      const next = { ...c, freshness: current - 1 };
      if (next.freshness <= 0) {
        spoiled += 1;
        this.ingredientDiscard.push({
          id: next.id,
          name: next.name,
          type: next.type,
          flavor: next.flavor,
          image: next.image,
          instanceId: next.instanceId,
        });
      } else {
        kept.push(next);
      }
    }
    player.hand = kept;
    return spoiled;
  }

  _endRound() {
    if (this._tryDeclareWinner()) return;

    const salary = this.config.dailySalary ?? 1;
    for (const p of this.players) {
      p.gold += salary;
    }
    this.addLog(`Each attorney receives ${salary} GP salary for the day's work.`);
    this.pendingDailyWages = {
      amount: salary,
      wagesId: ++this._wagesSeq,
    };

    if (this._tryDeclareWinner()) return;

    this.judgeIndex = this.leftOf(this.judgeIndex);
    this.round += 1;
    this.night = null;
    this.addLog(`Round over. First Player Token passes to ${this.players[this.judgeIndex].name}.`);
    this._startDayMarket();
  }

  // Helpers for AI / validation
  canCook(playerId, recipeId) {
    const player = this.playerById(playerId);
    if (!player) return false;
    const recipe = player.recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    if (player.foodTokens.some((t) => t.recipeId === recipeId && t.cookedRound === this.round)) return false;
    const counts = {};
    for (const c of player.hand) {
      if (c.type === 'ingredient') counts[c.id] = (counts[c.id] || 0) + 1;
    }
    const need = {};
    for (const id of recipe.ingredients) need[id] = (need[id] || 0) + 1;
    return Object.entries(need).every(([id, n]) => (counts[id] || 0) >= n);
  }

  /** Reassign a disconnected human's socket id everywhere it appears in game state. */
  reconnectPlayer(oldId, newId) {
    const player = this.playerById(oldId);
    if (!player) return false;
    const swap = (id) => (id === oldId ? newId : id);

    player.id = newId;
    player.connected = true;

    if (this.day?.passed) {
      this.day.passed = this.day.passed.map(swap);
    }
    if (this.cook?.done) {
      this.cook.done = this.cook.done.map(swap);
    }

    const n = this.night;
    if (n) {
      if (n.defenseId === oldId) n.defenseId = newId;
      if (n.currentActorId === oldId) n.currentActorId = newId;
      for (const pc of n.pendingCases || []) {
        if (pc.targetPlayerId === oldId) pc.targetPlayerId = newId;
      }
      if (n.lastPlay) {
        if (n.lastPlay.playerId === oldId) n.lastPlay.playerId = newId;
        if (n.lastPlay.spenderId === oldId) n.lastPlay.spenderId = newId;
      }
      if (n.pendingDice?.defenseId === oldId) n.pendingDice.defenseId = newId;
    }

    if (this.winnerId === oldId) this.winnerId = newId;

    const summary = this.pendingNightSummary;
    if (summary) {
      if (summary.winnerId === oldId) summary.winnerId = newId;
      if (summary.defenseId === oldId) summary.defenseId = newId;
    }

    return true;
  }
}

module.exports = { GameEngine };
