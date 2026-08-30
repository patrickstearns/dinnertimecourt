(() => {
  const socket = io();

  const state = {
    username: '',
    screen: 'title',
    lobby: null,
    game: null,
    myId: null,
    serverRooms: [],
    characterRoster: [],
    caseCatalog: [],
    argumentCatalog: [],
    ingredientCatalog: [],
    recipeCatalog: [],
    pendingStates: [],
    draining: false,
    lastShownCaseResultId: null,
    lastShownDiceKey: null,
    /** Dice key for which bailiff/judge verdict lines already played during the roll. */
    verdictSpokenForDiceKey: null,
    lastShownPlayId: null,
    /** Hold court scores at pre-play values until reveal animation finishes. */
    revealingCourtPlay: null,
    /** @type {(object|null)[]|null} fixed market seats for the current day */
    marketSlotCards: null,
    marketAwaitingDeal: false,
    /** Hold winner GP on score card until coin fly completes. */
    pendingGpReward: null,
    pendingPrestigeReward: null,
    /** Hold salary GP until Daily Wages overlay finishes. */
    pendingSalaryHold: null,
    lastShownWagesId: null,
    lastShownCaseOpenKey: null,
    /** Case key for which the Crown's prosecutor d6 has finished revealing. */
    prosecutorRollRevealedKey: null,
    /** Case key after "The crown rests." — defense may act. */
    crownRestedKey: null,
    /** Bailiff/prosecutor opening sequence still playing — defense may not rest. */
    caseOpeningInProgress: false,
    marketHelpTurnKey: null,
    marketHelpDismissed: false,
    marketGirlPokeCount: 0,
    /** Hide cook/court panel contents until mealtime overlay finishes. */
    suppressPhaseUi: false,
    turnTimerTick: null,
    lastTurnReadyKey: null,
  };

  const HAND_TYPE_ORDER = { ingredient: 0, argument: 1 };
  const CARD_FLY_MS = 310;
  const MARKET_DEAL_FLY_MS = 140;
  const MARKET_INGREDIENT_SLOTS = 12;

  function characterArtUrl(characterId, view = 'front') {
    if (!characterId) return '';
    return `/assets/characters/${characterId}-${view === 'rear' ? 'rear' : 'front'}.png`;
  }

  function setCharacterRoster(list) {
    if (Array.isArray(list) && list.length) {
      state.characterRoster = list;
      return true;
    }
    return false;
  }

  function setCaseCatalog(list) {
    if (Array.isArray(list) && list.length) {
      state.caseCatalog = list;
      return true;
    }
    return false;
  }

  function setArgumentCatalog(list) {
    if (Array.isArray(list) && list.length) {
      state.argumentCatalog = list;
      return true;
    }
    return false;
  }

  function setIngredientCatalog(list) {
    if (Array.isArray(list) && list.length) {
      state.ingredientCatalog = list;
      return true;
    }
    return false;
  }

  function caseCatalogEntry(caseCard) {
    if (!caseCard?.id) return caseCard;
    return state.caseCatalog.find((c) => c.id === caseCard.id) || caseCard;
  }

  function caseFlavorText(caseCard) {
    const entry = caseCatalogEntry(caseCard);
    return entry?.flavor || caseCard?.flavor || '';
  }

  function prosecutorAccusationText(n) {
    if (!n) return '';
    const entry = caseCatalogEntry(n.activeCase);
    const roll = n.prosecutorRoll;
    if (entry?.accusations?.length && roll) {
      const idx = Math.max(0, Math.min(entry.accusations.length - 1, roll - 1));
      return entry.accusations[idx];
    }
    return n.prosecutorAccusation || '';
  }

  function argumentCatalogEntry(card) {
    if (!card) return null;
    if (card.id) {
      const byId = state.argumentCatalog.find((a) => a.id === card.id);
      if (byId) return byId;
    }
    if (card.name) {
      return state.argumentCatalog.find((a) => a.name === card.name) || null;
    }
    return null;
  }

  function argumentDialogueText(play) {
    const card = play?.card || {};
    if (card.dialogue) return card.dialogue;
    const entry = argumentCatalogEntry(card);
    if (entry?.dialogue) return entry.dialogue;
    const name = card.name || play?.cardName;
    if (name) {
      const byName = state.argumentCatalog.find((a) => a.name === name);
      if (byName?.dialogue) return byName.dialogue;
    }
    return name || 'Objection!';
  }

  function recipeCatalogEntry(card) {
    if (!card) return null;
    if (card.recipeId) {
      const byId = state.recipeCatalog.find((r) => r.id === card.recipeId);
      if (byId) return byId;
    }
    if (card.id) {
      const byId = state.recipeCatalog.find((r) => r.id === card.id);
      if (byId) return byId;
    }
    if (card.name) {
      return state.recipeCatalog.find((r) => r.name === card.name) || null;
    }
    return null;
  }

  function judgeFoodDialogueText(play) {
    const card = play?.card || {};
    if (card.judgeDialogue) return card.judgeDialogue;
    const entry = recipeCatalogEntry(card);
    if (entry?.judgeDialogue) return entry.judgeDialogue;
    const name = card.name || play?.cardName || 'that';
    return `Mmm, delicious ${name}!`;
  }

  function ingredientFlavorText(card) {
    if (card?.flavor) return card.flavor;
    if (card?.id) {
      const entry = state.ingredientCatalog.find((i) => i.id === card.id);
      if (entry?.flavor) return entry.flavor;
    }
    return '';
  }

  let ingredientTooltipEl = null;

  function ensureIngredientTooltip() {
    if (!ingredientTooltipEl) {
      ingredientTooltipEl = document.createElement('div');
      ingredientTooltipEl.id = 'ingredient-tooltip';
      ingredientTooltipEl.className = 'ingredient-tooltip';
      ingredientTooltipEl.hidden = true;
      document.body.appendChild(ingredientTooltipEl);
    }
    return ingredientTooltipEl;
  }

  function hideIngredientTooltip() {
    if (ingredientTooltipEl) ingredientTooltipEl.hidden = true;
  }

  function positionIngredientTooltip(event) {
    const tip = ingredientTooltipEl;
    if (!tip || tip.hidden) return;
    const pad = 12;
    const rect = tip.getBoundingClientRect();
    let left = event.clientX + pad;
    let top = event.clientY + pad;
    if (left + rect.width > window.innerWidth - 8) left = event.clientX - rect.width - pad;
    if (top + rect.height > window.innerHeight - 8) top = event.clientY - rect.height - pad;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  }

  function bindIngredientTooltip(el, text) {
    if (!el || !text) return;
    ensureIngredientTooltip();
    el.addEventListener('mouseenter', (event) => {
      const tip = ensureIngredientTooltip();
      tip.textContent = text;
      tip.hidden = false;
      positionIngredientTooltip(event);
    });
    el.addEventListener('mousemove', positionIngredientTooltip);
    el.addEventListener('mouseleave', hideIngredientTooltip);
  }

  function counselRoster(room) {
    if (room?.characters?.length) return room.characters;
    if (state.characterRoster?.length) return state.characterRoster;
    return [];
  }

  // Catch hello even if it arrives before other handlers are wired.
  socket.on('hello', (payload) => {
    setCharacterRoster(payload?.characters);
    setCaseCatalog(payload?.cases);
    setArgumentCatalog(payload?.arguments);
    setIngredientCatalog(payload?.ingredients);
    if (Array.isArray(payload?.recipes) && payload.recipes.length) {
      state.recipeCatalog = payload.recipes;
    }
  });

  fetch('/api/meta')
    .then((r) => r.json())
    .then((meta) => {
      setCaseCatalog(meta?.cases);
      setArgumentCatalog(meta?.arguments);
      setIngredientCatalog(meta?.ingredients);
      if (Array.isArray(meta?.recipes) && meta.recipes.length) state.recipeCatalog = meta.recipes;
      if (setCharacterRoster(meta?.characters) && state.screen === 'room') renderRoom();
    })
    .catch(() => {});

  fetch('/argument-catalog.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((list) => {
      if (!state.argumentCatalog.length) setArgumentCatalog(list);
    })
    .catch(() => {});

  fetch('/ingredient-catalog.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((list) => {
      if (Array.isArray(list) && list.length) state.ingredientCatalog = list;
    })
    .catch(() => {});

  fetch('/recipe-catalog.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((list) => {
      if (Array.isArray(list) && list.length) state.recipeCatalog = list;
    })
    .catch(() => {});

  fetch('/js/character-roster.json')
    .then((r) => r.json())
    .then((list) => {
      if (setCharacterRoster(list) && state.screen === 'room') renderRoom();
    })
    .catch(() => {});

  const MEALTIME = {
    day_market: { id: 'breakfast', label: 'Breakfasttime', image: '/assets/mealtimes/breakfast.png' },
    day_cook: { id: 'lunch', label: 'Lunchtime', image: '/assets/mealtimes/lunch.png' },
    night_case: { id: 'dinner', label: 'Dinnertime', image: '/assets/mealtimes/dinner.png' },
    game_over: { id: 'dinner', label: 'Dinnertime', image: '/assets/mealtimes/dinner.png' },
  };

  function mealtimeForPhase(phase) {
    return MEALTIME[phase] || MEALTIME.day_market;
  }

  function setMealtimeVisual(phase, { animate = false } = {}) {
    const meal = mealtimeForPhase(phase);
    const marker = $('#phase-marker');
    const coin = $('#mealtime-coin');
    const img = $('#mealtime-img');
    const label = $('#phase-label');
    if (!marker || !img || !label) return Promise.resolve();

    const apply = () => {
      marker.dataset.mealtime = meal.id;
      marker.classList.toggle('night', meal.id === 'dinner');
      img.src = meal.image;
      img.alt = meal.label;
      label.textContent = meal.label;
    };

    if (!animate || marker.dataset.mealtime === meal.id) {
      apply();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      coin?.classList.add('flipping');
      window.setTimeout(() => {
        apply();
      }, 280);
      window.setTimeout(() => {
        coin?.classList.remove('flipping');
        resolve();
      }, 580);
    });
  }

  async function runPhaseTransition(prevPhase, nextPhase, next) {
    const overlays = {
      'day_market->day_cook': { text: 'Lunchtime!\nThe kitchen opens.', ms: 2200, variant: 'phase' },
      'day_cook->night_case': {
        text: 'Dinnertime!\nCourt is in session!',
        ms: 2600,
        variant: 'phase phase-night',
        sfx: 'gavelTriple',
      },
      'night_case->day_market': {
        text: 'Breakfasttime!\nThe market opens.',
        ms: 2200,
        variant: 'phase',
        sfx: 'bell',
      },
      'night_case->game_over': { text: 'Final Verdict!', ms: 2200, variant: 'phase' },
      'day_market->night_case': {
        text: 'Dinnertime!\nCourt is in session!',
        ms: 2600,
        variant: 'phase phase-night',
        sfx: 'gavelTriple',
      },
    };
    const key = `${prevPhase}->${nextPhase}`;
    const overlay = overlays[key];
    // Reset to previous face first so the flip always animates (renderGame may have jumped ahead).
    await setMealtimeVisual(prevPhase, { animate: false });
    await sleep(40);
    await setMealtimeVisual(nextPhase, { animate: true });

    if (overlay) {
      if (overlay.sfx === 'bell') window.GameAudio?.playOpeningBell?.();
      if (overlay.sfx === 'gavelTriple') window.GameAudio?.playGavelTriple?.();
      await showOverlay(overlay.text, overlay.ms, overlay.variant);
    }
    if (nextPhase === 'day_market' && next) {
      state.marketAwaitingDeal = true;
      prepareMarketForDeal(next);
      await animateMarketDeal(next);
      state.marketAwaitingDeal = false;
      renderMarket(next);
    }
  }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  function showScreen(id) {
    state.screen = id;
    $$('.screen').forEach((el) => el.classList.toggle('active', el.id === `screen-${id}`));
    if (id === 'title') {
      window.GameAudio?.setMusicVolumeScale?.(0.5);
      window.GameAudio?.startMusic?.();
    } else {
      window.GameAudio?.setMusicVolumeScale?.(1);
    }
    if (id === 'lobby') {
      requestServerRoomList();
      renderServerGames();
    }
  }

  function requestServerRoomList() {
    socket.emit('lobby:list', {}, (res) => {
      if (res?.rooms) {
        state.serverRooms = res.rooms;
        if (state.screen === 'lobby') renderServerGames();
      }
    });
  }

  function renderServerGames() {
    const list = $('#server-games');
    const empty = $('#server-games-empty');
    if (!list || !empty) return;
    list.innerHTML = '';
    const rooms = state.serverRooms || [];
    empty.hidden = rooms.length > 0;

    for (const room of rooms) {
      const li = document.createElement('li');
      const classes = ['server-game'];
      if (room.joinable || room.status === 'playing') classes.push('is-clickable');
      if (room.status === 'playing') classes.push('playing');
      else if (!room.joinable) classes.push('full');
      li.className = classes.join(' ');

      const info = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'server-game-title';
      title.textContent = `${room.hostName}'s table`;
      const meta = document.createElement('p');
      meta.className = 'server-game-meta';
      meta.textContent = `${room.playerCount}/${room.maxPlayers} seats · ${room.partnershipPrestige ?? room.partnershipGp} Prestige to Partner`;
      const names = document.createElement('p');
      names.className = 'server-game-players';
      names.textContent = (room.playerNames || []).join(', ');
      const status = document.createElement('span');
      status.className = 'server-game-status';
      if (room.status === 'playing') status.textContent = 'In progress — rejoin with your name';
      else if (!room.joinable) status.textContent = 'Full';
      else status.textContent = 'Open';
      info.appendChild(title);
      info.appendChild(meta);
      info.appendChild(names);
      info.appendChild(status);

      const action = document.createElement('span');
      if (room.joinable) {
        action.className = 'btn secondary';
        action.textContent = 'Join';
        li.addEventListener('click', () => joinServerRoom(room.code));
      } else if (room.status === 'playing') {
        action.className = 'btn secondary';
        action.textContent = 'Rejoin';
        li.addEventListener('click', () => joinServerRoom(room.code));
      } else {
        action.className = 'btn secondary faded';
        action.textContent = 'Full';
      }

      li.appendChild(info);
      li.appendChild(action);
      list.appendChild(li);
    }
  }

  function joinServerRoom(code) {
    window.GameAudio?.playButton?.();
    showError($('#lobby-error'));
    if (!state.username) return showError($('#lobby-error'), 'Enter a username first');
    socket.emit('lobby:join', { username: state.username, code }, (res) => {
      if (!res?.ok) return showError($('#lobby-error'), res?.error || 'Could not join');
      state.myId = socket.id;
      applyLobbyRoom(res.room);
      if (res.playing || res.room?.status === 'playing') {
        showScreen('game');
      } else {
        renderRoom();
        showScreen('room');
      }
    });
  }

  function toast(msg, duration = 2800, variant = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (variant ? ` ${variant}` : '');
    el.hidden = false;
    el.style.left = '';
    el.style.top = '';
    el.style.bottom = '';
    el.style.transform = '';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
      el.className = 'toast';
      el.style.left = '';
      el.style.top = '';
      el.style.bottom = '';
      el.style.transform = '';
    }, duration);
  }

  /** Float a toast over the player's ingredient hand. */
  function toastOverHand(msg, duration = 2800) {
    const el = $('#toast');
    const hand = $('#hand-cards');
    el.textContent = msg;
    el.className = 'toast hand-toast';
    el.hidden = false;
    if (hand) {
      const r = hand.getBoundingClientRect();
      el.style.left = `${r.left + r.width / 2}px`;
      el.style.top = `${r.top + r.height / 2}px`;
      el.style.bottom = 'auto';
      el.style.transform = 'translate(-50%, -50%)';
    }
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
      el.className = 'toast';
      el.style.left = '';
      el.style.top = '';
      el.style.bottom = '';
      el.style.transform = '';
    }, duration);
  }

  function showOverlay(msg, duration = 3200, variant = '') {
    return new Promise((resolve) => {
      const overlay = $('#announcement-overlay');
      const text = $('#announcement-text');
      overlay.className = 'announcement-overlay' + (variant ? ` ${variant}` : '');
      text.textContent = msg;
      overlay.removeAttribute('hidden');
      clearTimeout(showOverlay._t);
      showOverlay._t = setTimeout(() => {
        overlay.setAttribute('hidden', '');
        text.textContent = '';
        overlay.className = 'announcement-overlay';
        resolve();
      }, duration);
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function sortHand(cards) {
    return [...(cards || [])].sort((a, b) => {
      const ta = HAND_TYPE_ORDER[a.type] ?? 9;
      const tb = HAND_TYPE_ORDER[b.type] ?? 9;
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    });
  }

  function rectOf(target) {
    if (target && typeof target === 'object' && typeof target.getBoundingClientRect !== 'function' && 'left' in target) {
      return {
        left: target.left,
        top: target.top,
        width: target.width || 0,
        height: target.height || 0,
      };
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      return {
        left: window.innerWidth / 2 - 60,
        top: window.innerHeight / 2 - 40,
        width: 120,
        height: 80,
      };
    }
    return el.getBoundingClientRect();
  }

  /** Stable on-screen target for court play reveals — centered, near defense height. */
  function courtRevealCenterRect(size = 96) {
    const defense = $('#court-defense-art');
    const zone = $('#court-zone') || $('#court-stage') || document.body;
    const zr = zone.getBoundingClientRect();
    const dr = speechAnchorRect(defense);
    const cx = zr.width > 40 ? zr.left + zr.width / 2 : window.innerWidth / 2;
    const cy = dr
      ? dr.top + dr.height * 0.15
      : zr.top + zr.height * 0.62;
    return {
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
    };
  }

  function playerScoreEl(playerId) {
    return document.querySelector(`.score-card[data-player-id="${playerId}"]`);
  }

  function playerByName(game, name) {
    return game?.players?.find((p) => p.name === name);
  }

  function cardTypeFromName(name, game, playerId) {
    const self = game.players.find((p) => p.id === playerId);
    const handCard = self?.hand?.find((c) => c.name === name);
    if (handCard) return handCard.type;
    if (self?.recipes?.some((r) => r.name === name)) return 'recipe';
    if (self?.foodTokens?.some((t) => t.name === name)) return 'food';
    if (/omelette|taters|sammich|alfredo|stew|pie|quiche|roast|mousse|triumph|gravy|bisque|salad|meatpie|soufflé|souffle/i.test(name)) {
      return 'food';
    }
    if (/objection|defense|criminal|profiled|chewbacca|hearsay|technicality|footnote|continuance|exhibit|nuh-uh|plead|recess|jury|sob story|circumstantial|grandmother|kitchen sink|quiche|lunch break|precedent|pro bono|character witness|sidebar|flambé|flambe|mistrial/i.test(name)) {
      return 'argument';
    }
    return 'ingredient';
  }

  function ingredientImage(id) {
    return `/assets/ingredients/${id}.png`;
  }

  function recipeImage(id) {
    return `/assets/food/${id}.png`;
  }

  function resolveFoodTokenImage(token, recipe) {
    const recipeId = token?.recipeId || recipe?.id;
    return token?.image || (recipeId ? recipeImage(recipeId) : '/assets/food-token.svg');
  }

  function ingredientNeededForRecipes(ingredientId, recipes) {
    return (recipes || []).some((r) => r.ingredients?.includes(ingredientId));
  }

  function ingredientStockCount(g) {
    return (g.ingredientDeckCount ?? 0) + (g.ingredientDiscardCount ?? 0);
  }

  function recipeStockCount(g) {
    return (g.recipeDeckCount ?? 0) + (g.recipeDiscardCount ?? 0);
  }

  function argumentStockCount(g) {
    return (g.argumentDeckCount ?? 0) + (g.argumentDiscardCount ?? 0);
  }

  function deckStockCount(g, source) {
    if (source === 'ingredient_deck') return ingredientStockCount(g);
    if (source === 'recipe') return recipeStockCount(g);
    if (source === 'argument') return argumentStockCount(g);
    return 0;
  }

  function deckBuyCostFor(g, source) {
    if (source === 'ingredient_deck') return g.ingredientDeckBuyCost != null ? g.ingredientDeckBuyCost : 2;
    if (source === 'recipe') return g.recipeDeckBuyCost != null ? g.recipeDeckBuyCost : 1;
    if (source === 'argument') return g.argumentDeckBuyCost != null ? g.argumentDeckBuyCost : 4;
    return g.deckBuyCost != null ? g.deckBuyCost : 2;
  }

  function canPurchaseFromDeck(g, source) {
    const cost = deckBuyCostFor(g, source);
    const self = me(g);
    if (g.phase !== 'day_market') return { ok: false, reason: 'Market is closed' };
    if (!isMyTurnMarket(g)) return { ok: false, reason: 'Not your market turn' };
    if (!self) return { ok: false, reason: 'Not in game' };
    if (self.gold < cost) return { ok: false, reason: 'Not enough gold' };
    if (deckStockCount(g, source) <= 0) return { ok: false, reason: 'Deck is empty' };
    return { ok: true, cost };
  }

  function makeFaceDownDeckPile({ pileEl, backUrl, source, label, tooltip }) {
    pileEl.innerHTML = '';
    const g = state.game;
    if (!g) return;

    const stock = deckStockCount(g, source);
    if (stock <= 0) {
      pileEl.innerHTML = '<p class="hint">Empty</p>';
      return;
    }

    const purchase = canPurchaseFromDeck(g, source);
    const cost = deckBuyCostFor(g, source);

    const card = document.createElement('div');
    card.className = `card playing-card card-face-down landscape${purchase.ok ? ' interactive deck-buyable' : ' deck-locked'}`;
    card.setAttribute('role', 'button');
    card.tabIndex = purchase.ok ? 0 : -1;
    card.style.backgroundImage = `url('${backUrl}')`;
    card.setAttribute('aria-label', `${label} — ${stock} cards, buy top for ${cost} GP`);

    const tryBuy = () => {
      const check = canPurchaseFromDeck(state.game, source);
      if (!check.ok) {
        toast(check.reason);
        return;
      }
      dismissMarketGirlHelp();
      sendAction({ type: 'buy', source });
    };

    card.addEventListener('click', tryBuy);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tryBuy();
      }
    });

    const costEl = document.createElement('span');
    costEl.className = 'deck-cost';
    const coin = document.createElement('img');
    coin.src = '/assets/coin.svg';
    coin.alt = '';
    costEl.appendChild(coin);
    costEl.appendChild(document.createTextNode(String(cost)));
    card.appendChild(costEl);
    if (tooltip) bindIngredientTooltip(card, tooltip);
    pileEl.appendChild(card);
  }

  function playerById(g, id) {
    return g?.players?.find((p) => p.id === id);
  }

  function isAIPlayer(g, id) {
    return !!playerById(g, id)?.isAI;
  }

  function playerGoldDisplay(p) {
    if (state.pendingGpReward && p.id === state.pendingGpReward.playerId) {
      return state.pendingGpReward.displayGold;
    }
    if (state.pendingSalaryHold) {
      return Math.max(0, (p.gold || 0) - state.pendingSalaryHold.amount);
    }
    return p.gold;
  }

  function playerPrestigeDisplay(p) {
    if (state.pendingPrestigeReward && p.id === state.pendingPrestigeReward.playerId) {
      return state.pendingPrestigeReward.displayPrestige;
    }
    return p.prestige || 0;
  }

  function beginGpRewardHold(summary, game) {
    const gp = summary?.gp || 0;
    const playerId = summary?.winnerId || summary?.defenseId;
    if (!gp || !playerId || !game) return;
    const player = playerById(game, playerId);
    if (!player) return;
    state.pendingGpReward = {
      playerId,
      displayGold: player.gold - gp,
    };
    if (summary.prestige) {
      state.pendingPrestigeReward = {
        playerId,
        displayPrestige: (player.prestige || 0) - summary.prestige,
      };
    }
  }

  function appendCardBanner(container, name) {
    if (!name) return;
    const banner = document.createElement('div');
    banner.className = 'card-banner';
    banner.textContent = name;
    container.appendChild(banner);
  }

  function animateCoinFly(playerId, gp) {
    window.GameAudio?.playCoin?.();
    return new Promise((resolve) => {
      const from = rectOf('#court-zone');
      const to = rectOf(playerScoreEl(playerId));
      const layer = $('#card-fly-layer');
      const count = Math.min(6, Math.max(2, Math.ceil(gp / 2)));
      let finished = 0;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const coin = document.createElement('img');
          coin.src = '/assets/coin.svg';
          coin.className = 'fly-coin';
          coin.alt = '';
          coin.style.left = `${from.left + from.width / 2 - 14}px`;
          coin.style.top = `${from.top + from.height / 2 - 14}px`;
          layer.appendChild(coin);
          requestAnimationFrame(() => {
            const dx = to.left + to.width / 2 - (from.left + from.width / 2);
            const dy = to.top + to.height / 2 - (from.top + from.height / 2);
            coin.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
            coin.style.opacity = '0.2';
          });
          setTimeout(() => {
            coin.remove();
            finished += 1;
            if (finished >= count) resolve();
          }, 680);
        }, i * 110);
      }
    });
  }

  function destinationForPurchase(game, playerId, cardName, isRecipe = false) {
    if (playerId !== state.myId) return playerScoreEl(playerId);
    if (isRecipe) return '#recipe-cards';
    const type = cardTypeFromName(cardName, game, playerId);
    if (type === 'recipe') return '#recipe-cards';
    return '#hand-cards';
  }

  function animateCardFly(fromTarget, toTarget, card = {}) {
    if (card.sfx === 'deal') window.GameAudio?.playCardDeal?.();
    return new Promise((resolve) => {
      const duration = card.durationMs ?? CARD_FLY_MS;
      const from = rectOf(fromTarget);
      const to = rectOf(toTarget);
      const layer = $('#card-fly-layer');
      const ghost = document.createElement('div');
      const isLandscape = card.type === 'argument' || card.type === 'recipe' || card.landscape;
      ghost.className = `card card-fly ${card.type || ''}${isLandscape ? ' landscape' : ''}${card.faceDown ? ' card-face-down' : ''}`;

      if (card.faceDown) {
        ghost.style.backgroundImage = `url('${card.backImage || deckBackForType(card.type)}')`;
        ghost.style.backgroundSize = 'cover';
        ghost.style.backgroundPosition = 'center';
      } else {
        const artSrc = card.image || (card.type === 'argument' ? '/assets/arguments/scales.svg' : null);
        const art = artSrc ? `<img class="card-art" src="${escapeHtml(artSrc)}" alt="" />` : '';
        ghost.innerHTML = `${card.name ? `<div class="card-banner">${escapeHtml(card.name)}</div>` : ''}${art}`;
      }

      const w = isLandscape ? 160 : Math.max(Math.min(from.width || 100, 120), 72);
      ghost.style.width = `${w}px`;
      if (isLandscape) ghost.style.aspectRatio = '7 / 5';
      ghost.style.position = 'fixed';
      ghost.style.left = '0';
      ghost.style.top = '0';
      ghost.style.margin = '0';
      ghost.style.transitionDuration = `${duration}ms`;

      const fromX = from.left + from.width / 2;
      const fromY = from.top + from.height / 2;
      const toX = to.left + to.width / 2;
      const toY = to.top + to.height / 2;

      ghost.style.transform = `translate(${fromX}px, ${fromY}px) translate(-50%, -50%)`;
      layer.appendChild(ghost);

      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${toX}px, ${toY}px) translate(-50%, -50%) scale(0.85)`;
        ghost.style.opacity = '0.4';
      });

      setTimeout(() => {
        ghost.remove();
        resolve();
      }, duration);
    });
  }

  function deckBackForType(type) {
    if (type === 'recipe') return '/assets/backs/recipe-back.png';
    if (type === 'argument') return '/assets/backs/argument-back.png';
    return '/assets/backs/ingredient-back.png';
  }

  function animateTokenFly(fromTarget, toTarget, image, opts = {}) {
    if (opts.sfx === 'create') window.GameAudio?.playFoodCreate?.();
    else if (opts.sfx === 'play') window.GameAudio?.playFoodPlay?.();
    return new Promise((resolve) => {
      const from = rectOf(fromTarget);
      const to = rectOf(toTarget);
      const layer = $('#card-fly-layer');
      const ghost = document.createElement('div');
      const size = opts.size || 72;
      const landScale = opts.landScale != null ? opts.landScale : 0.85;
      const landOpacity = opts.landOpacity != null ? opts.landOpacity : 0.45;
      const duration = opts.durationMs || 700;
      ghost.className = 'food-token fly-token';
      ghost.innerHTML = `<img class="food-token-face" src="/assets/food-token.svg" alt="" /><img class="food-token-dish" src="${escapeHtml(image || '/assets/food-token.svg')}" alt="" />`;
      ghost.style.position = 'fixed';
      ghost.style.left = '0';
      ghost.style.top = '0';
      ghost.style.width = `${size}px`;
      ghost.style.height = `${size}px`;
      ghost.style.zIndex = '210';
      ghost.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.85, 0.28, 1), opacity ${duration}ms ease`;

      const fromX = from.left + from.width / 2;
      const fromY = from.top + from.height / 2;
      const toX = to.left + to.width / 2;
      const toY = to.top + to.height / 2;
      ghost.style.transform = `translate(${fromX}px, ${fromY}px) translate(-50%, -50%)`;
      layer.appendChild(ghost);

      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${toX}px, ${toY}px) translate(-50%, -50%) scale(${landScale})`;
        ghost.style.opacity = String(landOpacity);
      });

      setTimeout(() => {
        ghost.remove();
        resolve();
      }, duration + 20);
    });
  }

  function gpAmountHtml(amount) {
    return `<span class="gp-inline"><img src="/assets/coin.svg" alt="" class="gp-coin" aria-hidden="true" /><strong>${amount}</strong></span>`;
  }

  function prestigeAmountHtml(amount) {
    return `<span class="prestige-inline"><img src="/assets/prestige-icon.svg" alt="" class="prestige-icon" aria-hidden="true" /><strong>${amount}</strong></span>`;
  }

  function displayCaseName(name) {
    const s = String(name || '').trim();
    if (!s) return s;
    return s.replace(/^the\b/, 'The');
  }

  function caseDifficultyExpression(n, round) {
    const base = Number(n?.caseBaseDifficulty ?? n?.activeCase?.difficulty ?? 1) || 1;
    const roll = Number(n?.prosecutorRoll) || 0;
    const total = Number(n?.caseDifficulty);
    const evaluated = Number.isFinite(total) ? total : base + roll;
    if (!prosecutorRollRevealed(n, round)) {
      const mod = evaluated - base - roll;
      let expr = `${base} + 1D6`;
      if (mod > 0) expr += ` + ${mod}`;
      else if (mod < 0) expr += ` − ${Math.abs(mod)}`;
      return expr;
    }
    return String(evaluated);
  }

  function caseOpenKey(n, round) {
    if (!n?.activeCase || !n?.prosecutorRoll) return null;
    return `${round ?? 0}-${n.currentIndex}-${n.activeCase.id}-${n.prosecutorRoll}`;
  }

  function crownHasRested(n, round) {
    const key = caseOpenKey(n, round);
    return !!(key && state.crownRestedKey === key);
  }

  /** Crown d6 reveal finished — never revert to "base + 1D6" after this. */
  function prosecutorRollRevealed(n, round) {
    const key = caseOpenKey(n, round);
    if (!key) return true;
    if (state.prosecutorRollRevealedKey === key) return true;
    if (crownHasRested(n, round)) {
      state.prosecutorRollRevealedKey = key;
      return true;
    }
    return false;
  }

  function canDefenseRest(g) {
    const n = g?.night;
    if (g?.phase !== 'night_case' || !n?.activeCase) return false;
    if (n.awaitingDice || n.awaitingAdvance) return false;
    if (state.suppressPhaseUi || state.caseOpeningInProgress || state.revealingCourtPlay) return false;
    if (state.myId !== n.defenseId || !isMyCourtTurn(g)) return false;
    return crownHasRested(n, g.round);
  }

  /** Must stay in sync with shared/turnTimer.js */
  function turnTimerKeyFor(g, playerId) {
    if (!g || !playerId) return null;
    if (g.phase === 'day_market') {
      const p = (g.players || []).find((x) => x.id === playerId);
      if (!p || g.day?.turnSeat !== p.seat) return null;
      if ((g.day?.passed || []).includes(playerId)) return null;
      return `market-r${g.round}-s${g.day.turnSeat}`;
    }
    if (g.phase === 'day_cook') {
      if ((g.cook?.done || []).includes(playerId)) return null;
      return `cook-r${g.round}-${playerId}`;
    }
    if (g.phase === 'night_case') {
      const n = g.night;
      if (!n || n.awaitingDice || n.awaitingAdvance || !n.activeCase) return null;
      if (n.currentActorId !== playerId) return null;
      return `court-r${g.round}-i${n.currentIndex}-a${playerId}-d${n.defenseScore}-c${n.caseDifficulty}`;
    }
    return null;
  }

  function canActOnTurn(g) {
    if (!g || g.phase === 'game_over' || !state.myId) return false;
    const self = me(g);
    if (!self?.id || self.isAI) return false;

    if (g.phase === 'day_market') {
      return (
        isMyTurnMarket(g) &&
        !state.marketAwaitingDeal &&
        !state.suppressPhaseUi &&
        !(g.day?.passed || []).includes(state.myId)
      );
    }
    if (g.phase === 'day_cook') {
      return !state.suppressPhaseUi && !(g.cook?.done || []).includes(state.myId);
    }
    if (g.phase === 'night_case') {
      return canDefenseRest(g);
    }
    return false;
  }

  function maybeEmitTurnReady() {
    const g = state.game;
    if (!g || state.screen !== 'game') return;

    const key = turnTimerKeyFor(g, state.myId);
    if (!key || !canActOnTurn(g)) {
      if (!canActOnTurn(g)) state.lastTurnReadyKey = null;
      return;
    }
    if (key === state.lastTurnReadyKey) return;

    state.lastTurnReadyKey = key;
    socket.emit('game:turnReady', { key });
  }

  function beginCaseOpening(n, round) {
    state.crownRestedKey = null;
    state.prosecutorRollRevealedKey = null;
    state.lastShownDiceKey = null;
    state.verdictSpokenForDiceKey = null;
    state.caseOpeningInProgress = true;
  }

  function finishCaseOpening(n, round) {
    const key = caseOpenKey(n, round);
    if (key) {
      state.crownRestedKey = key;
      state.prosecutorRollRevealedKey = key;
    }
    state.caseOpeningInProgress = false;
  }

  function crownDifficultyHtml(n, fallbackTotal, round) {
    if (!prosecutorRollRevealed(n, round)) {
      const base = Number(n.caseBaseDifficulty ?? n.activeCase?.difficulty ?? 1) || 1;
      return `${base} <span class="score-die-hint">+ 1D6</span>`;
    }
    return String(fallbackTotal ?? n?.caseDifficulty ?? 0);
  }

  /** Defense score before the judgement die: "N + 1D6". */
  function defenseScorePendingHtml(score) {
    const s = Number(score) || 0;
    return `${s} <span class="score-die-hint">+ 1D6</span>`;
  }

  function caseStakesHtml(gp, prestige, difficultyExpr) {
    return `
      <p class="case-stake-line">${gpAmountHtml(gp)}</p>
      <p class="case-stake-line">${prestigeAmountHtml(prestige)}</p>
      <p class="case-stake-line">Difficulty ${difficultyExpr}</p>
    `;
  }

  function slotForPurchasedIngredient(prev, next, playerId, ingredientName) {
    const prevPlayer = prev?.players?.find((p) => p.id === playerId);
    const nextPlayer = next?.players?.find((p) => p.id === playerId);
    const newCard = (nextPlayer?.hand || []).find(
      (c) =>
        c.type === 'ingredient' &&
        c.name === ingredientName &&
        !(prevPlayer?.hand || []).some((pc) => pc.instanceId === c.instanceId)
    );
    if (!newCard?.instanceId) return -1;

    const prevMarket = prev?.ingredientMarket || [];
    for (const c of prevMarket) {
      if (c && !c.empty && c.instanceId === newCard.instanceId) {
        return typeof c.slot === 'number' ? c.slot : prevMarket.indexOf(c);
      }
    }
    return -1;
  }

  function isMarketEmptySlot(c) {
    return !c || c.empty === true || c.slotEmpty === true;
  }

  function marketSlotCount(g) {
    return Math.max(MARKET_INGREDIENT_SLOTS, g?.config?.marketIngredientSlots || 0, g?.ingredientMarket?.length || 0);
  }

  /** Keep purchased seats vacant — never pack remaining cards left. */
  function normalizeIngredientMarket(g) {
    const incoming = g?.ingredientMarket || [];
    const expected = marketSlotCount(g);

    if (incoming.some((c) => c && typeof c.slot === 'number')) {
      const slots = Array.from({ length: expected }, () => null);
      for (const c of incoming) {
        if (typeof c?.slot !== 'number') continue;
        slots[c.slot] = isMarketEmptySlot(c) ? null : c;
      }
      state.marketSlotCards = slots;
      return slots;
    }

    if (incoming.some((c) => isMarketEmptySlot(c))) {
      const slots = incoming.map((c) => (isMarketEmptySlot(c) ? null : c));
      while (slots.length < expected) slots.push(null);
      state.marketSlotCards = slots.slice(0, expected);
      return state.marketSlotCards;
    }

    // Compacted payload: map by instanceId onto the previous seat layout.
    const prev = state.marketSlotCards;
    if (prev && prev.length) {
      const remaining = incoming.filter((c) => c && !isMarketEmptySlot(c));
      const next = Array.from({ length: expected }, (_, i) => {
        const prevCard = prev[i];
        if (!prevCard) return null;
        const idx = remaining.findIndex((c) => c.instanceId === prevCard.instanceId);
        if (idx < 0) return null;
        return remaining.splice(idx, 1)[0];
      });
      state.marketSlotCards = next;
      return next;
    }

    const fresh = incoming.map((c) => (isMarketEmptySlot(c) ? null : c));
    while (fresh.length < expected) fresh.push(null);
    state.marketSlotCards = fresh.slice(0, expected);
    return state.marketSlotCards;
  }

  function resetMarketSlots(game) {
    const incoming = game?.ingredientMarket || [];
    const expected = marketSlotCount(game);
    const slots = Array.from({ length: expected }, (_, i) => {
      const c = incoming.find((x) => x && x.slot === i) || incoming[i];
      return isMarketEmptySlot(c) ? null : c;
    });
    state.marketSlotCards = slots;
    return slots;
  }

  function placeMarketSlotEl(slot, index) {
    slot.style.gridColumn = String((index % 6) + 1);
    slot.style.gridRow = String(Math.floor(index / 6) + 1);
  }

  function prepareMarketForDeal(game) {
    hideIngredientTooltip();
    const row = $('#ingredient-market');
    if (!row) return;
    row.innerHTML = '';
    const slots = resetMarketSlots(game);
    for (let i = 0; i < slots.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'market-slot empty';
      slot.dataset.slot = String(i);
      placeMarketSlotEl(slot, i);
      row.appendChild(slot);
    }
  }

  async function animateMarketDeal(game) {
    const cards = normalizeIngredientMarket(game);
    if (!cards.length) return;
    prepareMarketForDeal(game);
    const row = $('#ingredient-market');
    if (!row) return;
    const els = [...row.querySelectorAll('.market-slot')];
    const myTurn = isMyTurnMarket(game);
    const self = me(game);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const target = els[i] || row;
      if (!card) continue;
      await animateCardFly('#ingredient-deck-pile', target, {
        name: card.name,
        type: 'ingredient',
        image: card.image || ingredientImage(card.id),
        faceDown: true,
        backImage: '/assets/backs/ingredient-back.png',
        durationMs: MARKET_DEAL_FLY_MS,
        sfx: 'deal',
      });
      if (els[i]) {
        els[i].classList.remove('empty');
        els[i].innerHTML = '';
        const canBuy = myTurn && self && self.gold >= card.cost;
        const needed = self && ingredientNeededForRecipes(card.id, self.recipes);
        els[i].appendChild(
          makeCardEl(card, {
            interactive: canBuy,
            recipeNeeded: needed,
            ingredientTooltip: ingredientFlavorText(card),
            onClick: canBuy
              ? () => sendAction({ type: 'buy', source: 'ingredient', instanceId: card.instanceId })
              : null,
          })
        );
      }
      await sleep(12);
    }
  }

  function getNewLogs(prev, next) {
    const seen = new Set((prev?.log || []).map((entry) => entry.msg));
    return (next?.log || []).filter((entry) => !seen.has(entry.msg));
  }

  function computeTurnDelay(prev, next) {
    if (!prev) return 0;
    if (next.phase === 'game_over') return 700;

    if (prev.phase === 'night_case' && next.phase === 'night_case') {
      const pn = prev.night;
      const nn = next.night;
      if (!pn || !nn) return 0;
      if (pn.activeCase?.instanceId !== nn.activeCase?.instanceId) return isAIPlayer(next, nn.currentActorId) ? 450 : 1000;
      if (pn.currentActorId !== nn.currentActorId) {
        if (isAIPlayer(next, nn.currentActorId) || isAIPlayer(prev, pn.currentActorId)) return 300;
        return 1200;
      }
      if (pn.defenseScore !== nn.defenseScore || pn.caseDifficulty !== nn.caseDifficulty) {
        if (isAIPlayer(next, nn.defenseId)) return 300;
        return 1200;
      }
      return 0;
    }

    if (prev.phase === 'day_market' && next.phase === 'day_market') {
      if (prev.day?.turnSeat !== next.day?.turnSeat) return 1000;
      return 500;
    }

    if (prev.phase !== next.phase) return 900;
    return 0;
  }

  async function handleLogEvent(msg, prev, next) {
    const buyDeckIng = msg.match(/^(.+?) bought a pantry staple from the deck for (\d+)g\.$/);
    const buyRecipe =
      msg.match(/^(.+?) bought a recipe for (\d+)g\.$/) ||
      msg.match(/^(.+?) bought recipe (.+?) for (\d+)g\.$/);
    const buyArg =
      msg.match(/^(.+?) bought a legal argument for (\d+)g\.$/) ||
      msg.match(/^(.+?) bought argument (.+?) for (\d+)g\.$/);
    const buyIng = msg.match(/^(.+?) bought (.+?) for (\d+)g\.$/);

    if (buyDeckIng) {
      const player = playerByName(next, buyDeckIng[1]);
      if (player) {
        const hand = next.players.find((p) => p.id === player.id)?.hand || [];
        const handCard = hand[hand.length - 1];
        await animateCardFly('#ingredient-deck-pile', destinationForPurchase(next, player.id, handCard?.name || 'Ingredient', false), {
          name: handCard?.name || 'Pantry staple',
          type: 'ingredient',
          image: handCard?.image || (handCard?.id ? ingredientImage(handCard.id) : null),
          faceDown: true,
          backImage: '/assets/backs/ingredient-back.png',
          sfx: 'deal',
        });
      }
      return;
    }

    if (buyRecipe) {
      const player = playerByName(next, buyRecipe[1]);
      if (player) {
        const prevIds = new Set((prev?.players?.find((p) => p.id === player.id)?.recipes || []).map((r) => r.id));
        const recipe =
          (next.players.find((p) => p.id === player.id)?.recipes || []).find((r) => !prevIds.has(r.id)) ||
          (buyRecipe[3] &&
            (next.players.find((p) => p.id === player.id)?.recipes || []).find((r) => r.name === buyRecipe[2]));
        await animateCardFly('#recipe-deck-pile', destinationForPurchase(next, player.id, recipe?.name || 'Recipe', true), {
          name: 'Recipe',
          type: 'recipe',
          image: recipe?.image || (recipe?.id ? recipeImage(recipe.id) : null),
          faceDown: true,
          backImage: '/assets/backs/recipe-back.png',
          landscape: true,
          sfx: 'deal',
        });
      }
      return;
    }

    if (buyArg) {
      const player = playerByName(next, buyArg[1]);
      if (player) {
        await animateCardFly('#argument-deck-pile', destinationForPurchase(next, player.id, 'Argument', false), {
          name: 'Legal Argument',
          type: 'argument',
          image: '/assets/arguments/scales.svg',
          faceDown: true,
          backImage: '/assets/backs/argument-back.png',
          landscape: true,
          sfx: 'deal',
        });
      }
      return;
    }

    if (buyIng && !buyDeckIng) {
      const player = playerByName(next, buyIng[1]);
      if (player) {
        const handCard = (next.players.find((p) => p.id === player.id)?.hand || []).find(
          (c) =>
            c.type === 'ingredient' &&
            c.name === buyIng[2] &&
            !(prev?.players?.find((p) => p.id === player.id)?.hand || []).some((pc) => pc.instanceId === c.instanceId)
        );
        const prevSlot = slotForPurchasedIngredient(prev, next, player.id, buyIng[2]);
        const fromEl =
          prevSlot >= 0 ? document.querySelector(`#ingredient-market .market-slot[data-slot="${prevSlot}"]`) : null;
        const fly = animateCardFly(fromEl || '#ingredient-market', destinationForPurchase(next, player.id, buyIng[2], false), {
          name: buyIng[2],
          type: 'ingredient',
          image: handCard?.image || (handCard?.id ? ingredientImage(handCard.id) : null),
          sfx: 'deal',
        });
        if (fromEl) {
          fromEl.classList.add('empty');
          fromEl.innerHTML = '';
        }
        await fly;
      }
      return;
    }

    const playMatch = msg.match(/^(.+?) plays (.+?): /);
    if (playMatch && next.phase === 'night_case') {
      // Play reveal is handled via night.lastPlay in handleStateTransition.
      return;
    }

    const cookMatch = msg.match(/^(.+?) cooked (.+?)!$/);
    if (cookMatch) {
      const player = playerByName(next, cookMatch[1]);
      if (player) {
        const token = (next.players.find((p) => p.id === player.id)?.foodTokens || []).find((t) => t.name === cookMatch[2]);
        const foodImg = resolveFoodTokenImage(token);
        const cookBtn =
          (token?.recipeId && document.querySelector(`#cook-panel [data-recipe-id="${token.recipeId}"] .cook-btn`)) ||
          document.querySelector('#cook-panel .cook-btn') ||
          '#cook-zone';
        const to =
          player.id === state.myId
            ? (token?.recipeId && document.querySelector(`#recipe-cards [data-recipe-id="${token.recipeId}"]`)) ||
              '#recipe-cards'
            : playerScoreEl(player.id);
        await animateTokenFly(cookBtn, to, foodImg, { sfx: 'create' });
      }
    }
  }

  function verdictLineFromDice(dice) {
    if (!dice) return null;
    if (dice.defenseScore >= dice.caseDifficulty) return 'Not guilty!';
    return 'Guilty!';
  }

  function verdictLineFromSummary(summary) {
    if (!summary) return null;
    if (summary.type === 'win' || summary.type === 'dismissed') return 'Not guilty!';
    if (summary.type === 'loss') return 'Guilty!';
    if (summary.type === 'tie') return 'The court is undecided!';
    return null;
  }

  async function playFateDiceOnTable(dice) {
    if (!dice) return;
    const key = `${dice.defenseRoll}-${dice.defenseScore}-${dice.caseDifficulty}`;
    if (key === state.lastShownDiceKey) return;
    state.lastShownDiceKey = key;

    const table = $('#fate-dice-table');
    const dieD = $('#die-defense');
    const scoreD = $('#court-score-d');
    const reveal = $('#court-play-reveal');
    if (!table || !dieD) return;

    if (reveal) reveal.innerHTML = '';

    await showDefenseRestsSpeech();

    const beforeD = dice.scoreBefore?.d ?? dice.defenseScore - dice.defenseRoll;

    table.classList.remove('idle');
    table.classList.add('active');
    if (scoreD) {
      scoreD.innerHTML = `${beforeD} <span class="score-die-hint">+ 1D6</span>`;
    }

    const setFace = (el, n) => {
      el.dataset.face = String(Math.max(1, Math.min(6, n | 0)));
    };

    dieD.classList.remove('die-travel-done');
    dieD.classList.add('rolling', 'die-travel');
    setFace(dieD, 1);

    const tumbleMs = 900;
    window.GameAudio?.playRollingDice?.();
    const bailiffPromise = showBailiffSpeech('The court finds the defendant...', tumbleMs + 600);
    await sleep(tumbleMs);

    dieD.classList.remove('rolling');
    setFace(dieD, dice.defenseRoll);
    dieD.classList.add('die-travel-done');

    if (scoreD) {
      scoreD.innerHTML = `${beforeD} <span class="score-die-hint">+ ${dice.defenseRoll}</span>`;
      scoreD.classList.remove('score-bump');
      void scoreD.offsetWidth;
      scoreD.classList.add('score-bump');
    }
    await sleep(500);

    if (scoreD) {
      scoreD.textContent = String(dice.defenseScore);
      scoreD.classList.remove('score-bump');
      void scoreD.offsetWidth;
      scoreD.classList.add('score-bump');
    }
    await bailiffPromise.catch(() => {});
    await sleep(350);

    const verdictLine = verdictLineFromDice(dice);
    if (verdictLine) {
      await showJudgeSpeech(verdictLine, 2800);
      window.GameAudio?.playGavelTriple?.();
      state.verdictSpokenForDiceKey = key;
    }

    await sleep(400);

    table.classList.remove('active');
    table.classList.add('idle');
    dieD.classList.remove('die-travel', 'die-travel-done');
  }

  function courtScoresForDisplay(g) {
    const n = g?.night;
    if (!n) return { d: 0, difficulty: 0 };
    if (state.revealingCourtPlay && n.lastPlay?.playId === state.revealingCourtPlay.playId) {
      return state.revealingCourtPlay.scoresBefore;
    }
    return { d: n.defenseScore, difficulty: n.caseDifficulty };
  }

  async function animateCourtScoreReveal(scoresAfter) {
    if (!scoresAfter) return;
    const scoreD = $('#court-score-d');
    const scoreDiff = $('#court-score-diff');
    if (scoreD && scoresAfter.d != null && String(scoreD.textContent) !== String(scoresAfter.d)) {
      scoreD.textContent = String(scoresAfter.d);
      scoreD.classList.remove('score-bump');
      void scoreD.offsetWidth;
      scoreD.classList.add('score-bump');
    }
    if (scoreDiff && scoresAfter.difficulty != null && String(scoreDiff.textContent) !== String(scoresAfter.difficulty)) {
      scoreDiff.textContent = String(scoresAfter.difficulty);
      scoreDiff.classList.remove('score-bump');
      void scoreDiff.offsetWidth;
      scoreDiff.classList.add('score-bump');
    }
    await sleep(650);
  }

  function clearCourtSpeeches() {
    document.querySelectorAll('.court-speech').forEach((el) => el.remove());
  }

  function speechAnchorRect(el) {
    if (!el || el.hidden) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return null;
    return rect;
  }

  async function showAnchoredSpeech({ host, text, className = '', ms = 3200, style = null }) {
    if (!host || !text) return;
    const bubble = document.createElement('div');
    bubble.className = `court-speech ${className}`.trim();
    bubble.textContent = text;
    if (style) Object.assign(bubble.style, style);
    host.appendChild(bubble);
    void bubble.offsetWidth;
    bubble.classList.add('show');
    await sleep(ms);
    bubble.classList.remove('show');
    await sleep(220);
    bubble.remove();
  }

  /** Pin a bubble above a speaker using viewport coordinates (avoids stage % misplacement). */
  async function showSpeechNear(el, text, { side = 'left', ms = 3000, className = '' } = {}) {
    if (!text) return;
    let rect = speechAnchorRect(el);
    if (!rect) {
      const stage = $('#court-stage');
      const sr = stage?.getBoundingClientRect();
      if (!sr) return;
      rect =
        side === 'right'
          ? { left: sr.right - 110, right: sr.right - 24, top: sr.top + sr.height * 0.28, width: 86, height: 80 }
          : { left: sr.left + 24, right: sr.left + 110, top: sr.top + sr.height * 0.28, width: 86, height: 80 };
    }

    const style =
      side === 'right'
        ? {
            left: 'auto',
            right: `${Math.max(8, window.innerWidth - rect.right + rect.width * 0.05)}px`,
            top: `${Math.max(8, rect.top - 6)}px`,
          }
        : {
            left: `${Math.max(8, rect.left + rect.width * 0.05)}px`,
            right: 'auto',
            top: `${Math.max(8, rect.top - 6)}px`,
          };

    await showAnchoredSpeech({
      host: document.body,
      text,
      className: `from-anchor from-anchor-${side} ${className}`.trim(),
      ms,
      style,
    });
  }

  async function showProsecutorAccusation(n) {
    const line = prosecutorAccusationText(n);
    if (!line) return;
    await showProsecutorSpeech(line, 3400);
  }

  async function showBailiffSpeech(text, ms = 2800) {
    if (!text) return;
    await showSpeechNear($('.court-bailiff'), text, { side: 'left', ms, className: 'speaker-bailiff' });
  }

  async function showJudgeSpeech(text, ms = 2800) {
    if (!text) return;
    const judge =
      $('.court-judge-char') || $('.court-judge-stack') || $('.court-judge') || $('.court-bailiff');
    await showSpeechNear(judge, text, { side: 'left', ms, className: 'speaker-judge' });
  }

  async function showProsecutorSpeech(text, ms = 2800) {
    if (!text) return;
    await showSpeechNear($('.court-prosecutor'), text, { side: 'right', ms, className: 'speaker-prosecutor' });
  }

  async function showDefenseRestsSpeech() {
    const defenseArt = $('#court-defense-art');
    const defenseId = state.game?.night?.defenseId;
    const portrait = defenseId
      ? playerScoreEl(defenseId)?.querySelector('.score-portrait')
      : null;
    const anchor = speechAnchorRect(defenseArt)
      ? defenseArt
      : portrait || defenseArt || $('.court-defense');
    await showSpeechNear(anchor, 'The defense rests.', {
      side: 'left',
      ms: 2600,
      className: 'speaker-defense',
    });
  }

  async function showCaseOpeningSpeeches(n, round) {
    clearCourtSpeeches();
    beginCaseOpening(n, round);
    await showBailiffSpeech('Hear ye, hear ye...', 2200);
    const caseName = n?.activeCase?.name;
    if (caseName) {
      await showBailiffSpeech(`In the matter of ${caseName}...`, 3000);
    }
    await Promise.all([animateProsecutorDifficulty(n), showProsecutorAccusation(n)]);
    await showProsecutorSpeech('The crown rests.', 2400);
    finishCaseOpening(n, round);
  }

  async function showJudgeVerdict(summary) {
    const line = verdictLineFromSummary(summary);
    if (!line) return;
    await showJudgeSpeech(line, 2800);
  }

  async function showPlayerCourtSpeech(play) {
    if (!play?.playerId) return;
    const line =
      play.kind === 'food'
        ? 'I present this evidence, Your Honor...'
        : argumentDialogueText(play);

    const defenseArt = $('#court-defense-art');
    const portrait = playerScoreEl(play.playerId)?.querySelector('.score-portrait');
    const anchor = speechAnchorRect(defenseArt)
      ? defenseArt
      : portrait || playerScoreEl(play.playerId) || defenseArt;
    await showSpeechNear(anchor, line, { side: 'left', ms: 3200, className: 'speaker-defense' });
  }

  async function animateProsecutorDifficulty(n) {
    const scoreDiff = $('#court-score-diff');
    if (!scoreDiff || !n) return;
    const base = n.caseBaseDifficulty ?? Math.max(1, (n.caseDifficulty || 0) - (n.prosecutorRoll || 0));
    const roll = n.prosecutorRoll || 0;
    const total = n.caseDifficulty ?? base + roll;
    scoreDiff.innerHTML = `${base} <span class="score-die-hint">+ 1D6</span>`;
    await sleep(450);
    scoreDiff.innerHTML = `${base} <span class="score-die-hint">+ ${roll}</span>`;
    scoreDiff.classList.remove('score-bump');
    void scoreDiff.offsetWidth;
    scoreDiff.classList.add('score-bump');
    await sleep(500);
    scoreDiff.textContent = String(total);
    scoreDiff.classList.remove('score-bump');
    void scoreDiff.offsetWidth;
    scoreDiff.classList.add('score-bump');
    const key = caseOpenKey(n, state.game?.round);
    if (key) state.prosecutorRollRevealedKey = key;
    await sleep(350);
  }

  function findCourtPlaySource(play) {
    if (!play) return null;
    if (play.playerId === state.myId) {
      if (play.kind === 'argument' && play.instanceId) {
        return document.querySelector(`#hand-cards [data-instance-id="${play.instanceId}"]`);
      }
      if (play.kind === 'food' && play.tokenId) {
        return document.querySelector(`#recipe-cards [data-token-id="${play.tokenId}"]`);
      }
      return play.kind === 'food' ? $('#recipe-cards') : $('#hand-cards');
    }
    return playerScoreEl(play.playerId);
  }

  function buildCourtRevealEl(play) {
    const wrap = document.createElement('div');
    wrap.className = 'reveal-card-wrap';
    const by = document.createElement('div');
    by.className = 'reveal-by';
    by.textContent = `${play.playerName} plays`;
    wrap.appendChild(by);

    const card = play.card || {};
    if (play.kind === 'food') {
      wrap.classList.add('food-reveal');
      const tok = document.createElement('div');
      tok.className = 'food-token';
      const face = document.createElement('img');
      face.className = 'food-token-face';
      face.src = '/assets/food-token.svg';
      face.alt = '';
      const dish = document.createElement('img');
      dish.className = 'food-token-dish';
      dish.src = resolveFoodTokenImage(card, { id: card.recipeId });
      dish.alt = card.name || 'Food';
      tok.appendChild(face);
      tok.appendChild(dish);
      wrap.appendChild(tok);
      const name = document.createElement('div');
      name.className = 'reveal-by reveal-name';
      name.textContent = card.name || 'Food';
      wrap.appendChild(name);
      const effectText = card.effectText || describeEffect(card.effect);
      const effect = document.createElement('div');
      effect.className = 'reveal-effect';
      effect.innerHTML = highlightEffectHtml(effectText) || 'Special food effect';
      wrap.appendChild(effect);
    } else {
      wrap.appendChild(
        makeCardEl(
          {
            name: card.name,
            type: 'argument',
            effect: card.effect,
            flavor: card.flavor,
            image: card.image,
          },
          { showEffect: true, landscape: true }
        )
      );
    }
    return wrap;
  }

  function scrollCourtUiToTop() {
    const targets = [window, $('#screen-game'), document.querySelector('.game-board'), document.querySelector('.hand-rail')];
    for (const t of targets) {
      if (!t) continue;
      try {
        if (t === window) window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        else if (typeof t.scrollTo === 'function') t.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        else {
          t.scrollTop = 0;
          t.scrollLeft = 0;
        }
      } catch (_) {
        /* ignore */
      }
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  async function showJudgeFoodComment(play) {
    if (play?.kind !== 'food') return;
    await showJudgeSpeech(judgeFoodDialogueText(play), 2800);
  }

  async function showCourtPlayReveal(play, fromEl) {
    if (!play?.card && play?.kind !== 'food') return;
    if (play.playId != null && play.playId === state.lastShownPlayId) return;

    const reveal = $('#court-play-reveal');
    const from = fromEl || findCourtPlaySource(play) || playerScoreEl(play.playerId);
    const center = courtRevealCenterRect(play.kind === 'food' ? 96 : 160);

    if (play.kind === 'food' && play.playerId === state.myId) {
      scrollCourtUiToTop();
      await sleep(280);
    }

    const defenseSpeechPromise = (async () => {
      await sleep(40);
      await showPlayerCourtSpeech(play);
    })();

    try {
      if (play.kind === 'food') {
        await animateTokenFly(
          from,
          center,
          play.card?.image || resolveFoodTokenImage(play.card || {}, { id: play.card?.recipeId }),
          { size: 88, landScale: 1.15, landOpacity: 1, durationMs: 720, sfx: 'play' }
        );
      } else {
        await animateCardFly(from, center, {
          name: play.card?.name,
          type: 'argument',
          image: play.card?.image || '/assets/arguments/scales.svg',
          landscape: true,
          durationMs: 420,
        });
      }

      if (reveal) {
        reveal.innerHTML = '';
        reveal.appendChild(buildCourtRevealEl(play));
      }
      await Promise.all([sleep(play.kind === 'food' ? 3400 : 2800), defenseSpeechPromise]);
      if (reveal) reveal.innerHTML = '';

      if (play.kind === 'food') {
        await sleep(200);
        await showJudgeFoodComment(play);
      }

      await animateCourtScoreReveal(play.scoresAfter);
    } catch (err) {
      console.error('Court play reveal failed', err);
      if (reveal) {
        try {
          reveal.innerHTML = '';
          reveal.appendChild(buildCourtRevealEl(play));
          await sleep(2800);
          reveal.innerHTML = '';
          if (play.kind === 'food') await showJudgeFoodComment(play);
          await animateCourtScoreReveal(play.scoresAfter);
        } catch (_) {
          /* ignore */
        }
      }
    }
  }

  async function showCaseResultFlow(summary, game) {
    if (!summary) return;
    if (summary.resultId != null && summary.resultId === state.lastShownCaseResultId) return;
    if (summary.resultId != null) state.lastShownCaseResultId = summary.resultId;

    const verdictAlreadySpoken = state.verdictSpokenForDiceKey === state.lastShownDiceKey && !!state.lastShownDiceKey;
    if (!verdictAlreadySpoken) {
      await showBailiffSpeech('The court finds the defendant...', 2400);
      await showJudgeVerdict(summary);
      window.GameAudio?.playGavelTriple?.();
    }

    if (summary.gp) {
      beginGpRewardHold(summary, game || state.game);
      if (state.game) renderScores(state.game);
      await animateCoinFly(summary.winnerId || summary.defenseId, summary.gp);
      state.pendingGpReward = null;
      state.pendingPrestigeReward = null;
      if (state.game) renderScores(state.game);
      await sleep(300);
    } else {
      await sleep(400);
    }
  }

  async function handleStateTransition(prev, next) {
    if (!prev) {
      if (next.phase === 'day_market') {
        state.game = next;
        state.marketAwaitingDeal = true;
        renderGame();
        await setMealtimeVisual(next.phase, { animate: false });
        prepareMarketForDeal(next);
        window.GameAudio?.playOpeningBell?.();
        await showOverlay('Breakfasttime!\nThe market opens.', 2400, 'phase');
        await animateMarketDeal(next);
        state.marketAwaitingDeal = false;
        renderMarket(next);
        return true;
      }
      state.game = next;
      renderGame();
      await setMealtimeVisual(next.phase, { animate: false });
      return true;
    }

    if (prev.phase === 'night_case' && next.phase !== 'night_case') {
      state.crownRestedKey = null;
      state.prosecutorRollRevealedKey = null;
      state.lastShownCaseOpenKey = null;
      state.caseOpeningInProgress = false;
    }

    if (prev.phase !== next.phase) {
      if (prev.phase === 'night_case' && (next.phase === 'day_market' || next.phase === 'game_over')) {
        const summary = next.pendingNightSummary;
        if (summary && summary.resultId !== state.lastShownCaseResultId) {
          beginGpRewardHold(summary, next);
          await showCaseResultFlow(summary, next);
        }

        // Pay wages while court is still on screen (before breakfast / victory UI).
        const wages = next.pendingDailyWages;
        if (wages && wages.wagesId !== state.lastShownWagesId) {
          state.lastShownWagesId = wages.wagesId;
          state.pendingSalaryHold = { amount: wages.amount || 1 };
          state.game = {
            ...prev,
            players: next.players,
            pendingDailyWages: next.pendingDailyWages,
          };
          renderScores(state.game);
          window.GameAudio?.playCoin?.();
          await showOverlay(`Daily Wages\n+${wages.amount || 1} GP each`, 2800, 'phase');
          state.pendingSalaryHold = null;
          renderScores(state.game);
          await sleep(200);
        }
      }

      state.game = next;
      if (next.phase === 'day_market') state.marketAwaitingDeal = true;
      state.suppressPhaseUi = next.phase === 'day_cook' || next.phase === 'night_case';
      renderGame();
      await runPhaseTransition(prev.phase, next.phase, next);
      state.suppressPhaseUi = false;
      if (next.phase === 'day_market') state.marketAwaitingDeal = false;
      let pendingCaseOpeningKey = null;
      if (next.phase === 'night_case' && next.night?.activeCase && next.night?.prosecutorRoll) {
        pendingCaseOpeningKey = caseOpenKey(next.night, next.round);
        if (pendingCaseOpeningKey && pendingCaseOpeningKey !== state.lastShownCaseOpenKey) {
          beginCaseOpening(next.night, next.round);
        }
      }
      renderGame();
      if (pendingCaseOpeningKey && pendingCaseOpeningKey !== state.lastShownCaseOpenKey) {
        state.lastShownCaseOpenKey = pendingCaseOpeningKey;
        await showCaseOpeningSpeeches(next.night, next.round);
        renderGame();
      }
      if (prev.phase === 'day_market' && next.phase === 'day_cook') await sleep(200);
      return true;
    }

    if (prev.phase === 'night_case' && next.phase === 'night_case') {
      const caseKey = caseOpenKey(next.night, next.round);
      const caseOpened =
        caseKey &&
        caseKey !== state.lastShownCaseOpenKey &&
        (!prev.night?.activeCase ||
          prev.night.activeCase.id !== next.night.activeCase.id ||
          prev.night.currentIndex !== next.night.currentIndex ||
          prev.night.prosecutorRoll !== next.night.prosecutorRoll);

      if (caseOpened) {
        state.lastShownCaseOpenKey = caseKey;
        beginCaseOpening(next.night, next.round);
        state.game = next;
        renderGame();
        await showCaseOpeningSpeeches(next.night, next.round);
        renderGame();
        return true;
      }

      const dice = next.night?.pendingDice;
      const prevDice = prev.night?.pendingDice;
      const play = next.night?.lastPlay;
      const prevPlayId = prev.night?.lastPlay?.playId;
      const missedPrevPlay =
        prev.night?.lastPlay &&
        prev.night.lastPlay.playId != null &&
        prev.night.lastPlay.playId !== state.lastShownPlayId
          ? prev.night.lastPlay
          : null;
      const isNewPlay =
        play &&
        play.playId != null &&
        play.playId !== prevPlayId &&
        play.playId !== state.lastShownPlayId;

      // Always show an unrevealed play before dice / other court updates.
      const playToShow = isNewPlay ? play : missedPrevPlay;
      if (playToShow) {
        const scoresBefore = playToShow.scoresBefore || {
          d: prev.night?.defenseScore ?? 0,
          difficulty: prev.night?.caseDifficulty ?? 0,
        };
        const scoresAfter = playToShow.scoresAfter || {
          d: (isNewPlay ? next.night : prev.night)?.defenseScore,
          difficulty: (isNewPlay ? next.night : prev.night)?.caseDifficulty,
        };
        state.revealingCourtPlay = { playId: playToShow.playId, scoresBefore, scoresAfter };
        state.game = next;
        renderGame();
        const fromEl = findCourtPlaySource(playToShow);
        await showCourtPlayReveal(playToShow, fromEl);
        state.revealingCourtPlay = null;
        state.lastShownPlayId = playToShow.playId;

        if (isNewPlay) {
          const summaryAfterPlay = next.pendingNightSummary;
          if (summaryAfterPlay && summaryAfterPlay.resultId !== state.lastShownCaseResultId) {
            beginGpRewardHold(summaryAfterPlay, next);
            renderGame();
            await showCaseResultFlow(summaryAfterPlay, next);
          } else {
            renderGame();
          }
          return true;
        }
      }

      if (dice && (!prevDice || prevDice.defenseRoll !== dice.defenseRoll || prevDice.defenseScore !== dice.defenseScore)) {
        state.game = next;
        renderGame();
        await playFateDiceOnTable(dice);
        return true;
      }

      const summary = next.pendingNightSummary;
      if (summary && summary.resultId !== state.lastShownCaseResultId) {
        beginGpRewardHold(summary, next);
        state.game = next;
        renderGame();
        await showCaseResultFlow(summary, next);
        return true;
      }
    }

    const newLogs = getNewLogs(prev, next);
    for (const entry of newLogs) {
      await handleLogEvent(entry.msg, prev, next);
    }

    // Apply the new state as soon as fly animations finish — don't wait on turn delay.
    state.game = next;
    renderGame();

    const delay = computeTurnDelay(prev, next);
    if (delay > 0) await sleep(delay);
    return true;
  }

  async function drainStateQueue() {
    if (state.draining) return;
    state.draining = true;
    try {
      while (state.pendingStates.length) {
        const next = state.pendingStates.shift();
        const prev = state.game;
        let preRendered = false;
        if (prev) {
          preRendered = await handleStateTransition(prev, next);
        } else {
          preRendered = await handleStateTransition(null, next);
        }
        state.game = next;
        if (!preRendered) renderGame();
        maybeEmitTurnReady();
      }
    } catch (err) {
      console.error('State queue drain failed', err);
      state.revealingCourtPlay = null;
    } finally {
      state.draining = false;
      if (state.pendingStates.length) drainStateQueue();
      else maybeEmitTurnReady();
    }
  }

  function showError(el, msg) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function describeEffect(effect) {
    if (!effect) return '';
    const n = (v) => `<strong>${v}</strong>`;
    switch (effect.kind) {
      case 'self':
        return `${n(`+${effect.amount}`)} to your score`;
      case 'self_and_opp':
        return `${n(`+${effect.self}`)} to you; difficulty ${n(`${effect.opp >= 0 ? '+' : ''}${effect.opp}`)}`;
      case 'nullify_last_food':
        return `<strong>Nullify</strong> the last Food effect`;
      case 'nullify_last_argument':
        return `<strong>Nullify</strong> the last Legal Argument`;
      case 'force_pass':
        return `<strong>Lower</strong> case difficulty by ${n('2')}`;
      case 'swap_scores':
        return `<strong>Swap</strong> your score with the case difficulty`;
      case 'end_case_no_score':
        return `<strong>End</strong> case; nobody scores`;
      case 'self_if_food':
        return `${n(`+${effect.withFood}`)} if you have food, else ${n(`+${effect.withoutFood}`)}`;
      case 'self_and_force_pass':
        return `${n(`+${effect.amount}`)} and <strong>lower</strong> difficulty by ${n('1')}`;
      case 'spend_prestige':
        return `<strong>Spend</strong> ${n(String(effect.prestigeCost))} Prestige; ${n(`+${effect.amount}`)} to your score`;
      case 'raise_stakes': {
        const bits = [];
        if (effect.difficulty) bits.push(`difficulty ${n(`+${effect.difficulty}`)}`);
        if (effect.prestige) bits.push(`case Prestige ${n(`+${effect.prestige}`)}`);
        if (effect.gp) bits.push(`case GP ${n(`+${effect.gp}`)}`);
        return bits.join('; ') || '<strong>Raise</strong> the stakes';
      }
      case 'ease_case': {
        const bits = [`difficulty ${n(`−${effect.difficulty || 0}`)}`];
        if (effect.gp) bits.push(`case GP ${n(`−${effect.gp}`)}`);
        if (effect.prestige) bits.push(`case Prestige ${n(`−${effect.prestige}`)}`);
        return bits.join('; ');
      }
      case 'self_and_raise_stakes': {
        const bits = [`${n(`+${effect.amount}`)} to your score`];
        if (effect.difficulty) bits.push(`difficulty ${n(`+${effect.difficulty}`)}`);
        if (effect.prestige) bits.push(`case Prestige ${n(`+${effect.prestige}`)}`);
        if (effect.gp) bits.push(`case GP ${n(`+${effect.gp}`)}`);
        return bits.join('; ');
      }
      default:
        return '';
    }
  }

  /** Bold numbers / key verbs in a plain effect string (e.g. from the server). */
  function highlightEffectHtml(text) {
    if (!text) return '';
    if (text.includes('<strong>')) return text;
    return escapeHtml(text)
      .replace(/([+−\-]\d+)/g, '<strong>$1</strong>')
      .replace(/\b(Spend|Swap|Nullify|Lower|End|Raise)\b/gi, '<strong>$1</strong>');
  }

  function ingredientLabel(id) {
    const map = {
      brockolli: 'Brockolli',
      carroot: 'Carroot',
      potatoe: 'Potatoe',
      termater: 'Termater',
      hweetgrains: 'Hweetgrains',
      dillyweed: 'Dillyweed',
      rosemarie: 'Rosemarie',
      gahlic: 'Gahlic',
      punkin: 'Punkin',
      cheez: 'Cheez',
      milk: 'Milk',
      eggz: "B'cock Eggz",
      hoark: 'Hoark Chop',
      mutton: 'Mutton',
      tofurkey: 'Tofurkey',
      bcock: "B'cock Meat",
      grouncow: "Groun'cow",
    };
    return map[id] || id;
  }

  function me(game) {
    return game?.players?.find((p) => p.id === state.myId);
  }

  function isMyTurnMarket(game) {
    const p = me(game);
    return game.phase === 'day_market' && p && game.day?.turnSeat === p.seat;
  }

  function isMyCourtTurn(game) {
    return game.phase === 'night_case' && game.night?.currentActorId === state.myId;
  }

  function canCook(player, recipe, round) {
    if (!player?.hand) return false;
    if (player.foodTokens?.some((t) => t.recipeId === recipe.id && t.cookedRound === round)) return false;
    const counts = {};
    for (const c of player.hand) {
      if (c.type === 'ingredient') counts[c.id] = (counts[c.id] || 0) + 1;
    }
    const need = {};
    for (const id of recipe.ingredients) need[id] = (need[id] || 0) + 1;
    return Object.entries(need).every(([id, n]) => (counts[id] || 0) >= n);
  }

  function sendAction(action) {
    return new Promise((resolve) => {
      socket.emit('game:action', action, (res) => {
        if (!res?.ok) toast(res?.error || 'Action failed');
        resolve(res);
      });
    });
  }

  // ——— Screens: title ———
  async function startTitleMusic() {
    if (state.screen !== 'title') return;
    await window.GameAudio?.unlock?.();
    window.GameAudio?.setMusicVolumeScale?.(0.5);
    window.GameAudio?.startMusic?.();
  }

  $('#screen-title')?.addEventListener('pointerdown', () => startTitleMusic());
  $('#username')?.addEventListener('focus', () => startTitleMusic());
  $('#username')?.addEventListener('input', () => startTitleMusic());

  $('#signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#username').value.trim();
    if (!name) return;
    state.username = name;
    state.myId = socket.id;
    $('#lobby-username').textContent = name;
    await window.GameAudio?.unlock?.();
    window.GameAudio?.startMusic?.();
    showScreen('lobby');
  });

  $('#btn-back-title').addEventListener('click', () => showScreen('title'));

  // ——— Lobby create/join ———
  function closeCreateGameDialog() {
    const dialog = $('#create-game-dialog');
    if (dialog) dialog.hidden = true;
  }

  function openCreateGameDialog() {
    showError($('#create-error'));
    const dialog = $('#create-game-dialog');
    if (!dialog) return;
    dialog.hidden = false;
    $('#create-gp')?.focus();
  }

  $('#btn-new-game')?.addEventListener('click', () => openCreateGameDialog());
  $('#btn-cancel-create')?.addEventListener('click', () => closeCreateGameDialog());
  $('#create-game-dialog')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCreateGameDialog();
  });

  $('#create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    showError($('#create-error'));
    const partnershipPrestige = Number($('#create-gp').value) || 10;
    socket.emit('lobby:create', { username: state.username, partnershipPrestige }, (res) => {
      if (!res?.ok) return showError($('#create-error'), res?.error || 'Could not create');
      closeCreateGameDialog();
      state.myId = socket.id;
      applyLobbyRoom(res.room);
      renderRoom();
      showScreen('room');
    });
  });

  $('#btn-refresh-games')?.addEventListener('click', () => {
    requestServerRoomList();
  });

  $('#market-girl-art')?.addEventListener('click', () => pokeMarketGirl());

  socket.on('lobby:list', (payload) => {
    state.serverRooms = payload?.rooms || [];
    if (state.screen === 'lobby') renderServerGames();
  });

  socket.on('lobby:update', (room) => {
    applyLobbyRoom(room);
    if (state.screen === 'room') renderRoom();
  });

  socket.on('room:closed', (payload) => {
    toast(payload?.reason || 'Room closed');
    state.lobby = null;
    state.game = null;
    state.lastTurnReadyKey = null;
    stopTurnTimerTick();
    showScreen('lobby');
  });

  function normalizeLobbyRoom(room) {
    if (!room) return room;
    const players = [...(room.players || [])];
    // Prefer host first, then others in original order
    players.sort((a, b) => {
      if (a.id === room.hostId) return -1;
      if (b.id === room.hostId) return 1;
      return 0;
    });

    let seats = Array.isArray(room.seats) ? room.seats.map((s) => ({ ...s })) : null;
    const needsSeats =
      !seats ||
      seats.length < 6 ||
      (players.length > 0 && !seats.some((s) => s.playerId || s.characterId || s.kind === 'human' || s.kind === 'ai'));

    if (needsSeats) {
      seats = Array.from({ length: 6 }, (_, index) => ({
        index,
        kind: 'open',
        playerId: null,
        name: null,
        displayName: null,
        characterId: null,
        isAI: false,
        isHost: false,
        front: null,
      }));
      let slot = 0;
      for (const p of players) {
        while (slot < 6 && seats[slot].kind === 'closed') slot += 1;
        if (slot >= 6) break;
        const idx = p.seatIndex != null && p.seatIndex >= 0 && p.seatIndex < 6 ? p.seatIndex : slot;
        seats[idx] = {
          index: idx,
          kind: p.isAI ? 'ai' : 'human',
          playerId: p.id,
          name: p.name || null,
          displayName: p.displayName || null,
          characterId: p.characterId || null,
          isAI: !!p.isAI,
          isHost: !!p.isHost || p.id === room.hostId,
          front: p.front || (p.characterId ? characterArtUrl(p.characterId, 'front') : null),
        };
        if (idx === slot) slot += 1;
      }
    }

    // Ensure every seated player has portrait/name filled from players list
    for (const seat of seats) {
      if (!seat.playerId) continue;
      const p = players.find((x) => x.id === seat.playerId);
      if (!p) continue;
      if (!seat.characterId && p.characterId) seat.characterId = p.characterId;
      if (!seat.name && (p.displayName || p.name)) seat.name = p.displayName || p.name;
      if (!seat.displayName && (p.displayName || p.name)) seat.displayName = p.displayName || p.name;
      if (!seat.front) {
        seat.front = p.front || (seat.characterId ? characterArtUrl(seat.characterId, 'front') : null);
      }
      seat.isHost = seat.isHost || p.id === room.hostId || !!p.isHost;
      seat.kind = p.isAI ? 'ai' : 'human';
    }

    return { ...room, seats, players };
  }

  function applyLobbyRoom(room) {
    state.lobby = normalizeLobbyRoom(room);
    setCharacterRoster(room?.characters);
    return state.lobby;
  }

  function closeCounselDialog() {
    const dlg = $('#counsel-dialog');
    if (dlg) dlg.hidden = true;
  }

  function fillCounselPicker() {
    const room = state.lobby;
    const picker = $('#character-picker');
    if (!picker || !room) return;
    picker.innerHTML = '';
    const taken = new Set((room.players || []).map((p) => p.characterId).filter(Boolean));
    const me = (room.players || []).find((p) => p.id === state.myId);
    const roster = counselRoster(room);
    if (!roster.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'Loading counsel portraits…';
      picker.appendChild(empty);
      return;
    }
    for (const c of roster) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'character-pick';
      btn.setAttribute('role', 'option');
      const isMine = me?.characterId === c.id;
      const isTaken = taken.has(c.id) && !isMine;
      if (isMine) btn.classList.add('selected');
      if (isTaken) btn.classList.add('taken');
      btn.disabled = isTaken || !me;
      btn.title = c.name;
      const img = document.createElement('img');
      img.src = c.front || characterArtUrl(c.id, 'front');
      img.alt = '';
      const span = document.createElement('span');
      span.textContent = c.name;
      btn.appendChild(img);
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        if (isTaken || !me) return;
        socket.emit('lobby:selectCharacter', { characterId: c.id }, (res) => {
          if (!res?.ok) {
            showError($('#room-error'), res?.error || 'Could not select');
            return;
          }
          showError($('#room-error'));
          if (res.room) applyLobbyRoom(res.room);
          closeCounselDialog();
          renderRoom();
        });
      });
      picker.appendChild(btn);
    }
  }

  function openCounselDialog() {
    const dlg = $('#counsel-dialog');
    if (!dlg) return;
    fillCounselPicker();
    dlg.hidden = false;
  }

  function seatArtUrl(seat, room) {
    if (seat?.front) return seat.front;
    if (seat?.characterId) return characterArtUrl(seat.characterId, 'front');
    const p =
      (seat?.playerId && room.players?.find((x) => x.id === seat.playerId)) ||
      room.players?.find((x) => x.seatIndex === seat?.index);
    if (p?.front) return p.front;
    if (p?.characterId) return characterArtUrl(p.characterId, 'front');
    return '';
  }

  function renderRoom() {
    const room = state.lobby;
    if (!room) return;
    state.myId = socket.id;
    const host = room.players?.find((p) => p.id === room.hostId) || room.players?.[0];
    const titleEl = $('#room-title');
    if (titleEl) titleEl.textContent = host ? `${host.name}'s table` : 'Waiting room';

    const isHost = room.hostId === state.myId;
    const seatsEl = $('#room-seats');
    if (seatsEl) {
      seatsEl.innerHTML = '';
      const seats = room.seats || [];

      for (let i = 0; i < 6; i++) {
        const seat = seats[i] || { index: i, kind: 'open' };
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seat-tile';
        btn.dataset.seatIndex = String(i);

        const isMine = !!(seat.playerId && seat.playerId === state.myId);
        const isHostSeat = !!(seat.playerId && (seat.playerId === room.hostId || seat.isHost));
        const filled = seat.kind === 'human' || seat.kind === 'ai' || !!seat.playerId;
        if (filled) btn.classList.add('is-filled');
        if (seat.kind === 'open' && !seat.playerId) btn.classList.add('is-open');
        if (seat.kind === 'closed') btn.classList.add('is-closed');
        if (isMine) btn.classList.add('is-you');
        if (isHostSeat) btn.classList.add('is-host-seat');

        const canPickCounsel = isMine;
        const canCycle = isHost && !isMine && !isHostSeat;
        if (canPickCounsel) btn.dataset.seatAction = 'counsel';
        else if (canCycle) btn.dataset.seatAction = 'cycle';
        if (canPickCounsel || canCycle) btn.classList.add('is-clickable');

        const badge = document.createElement('span');
        badge.className = 'seat-badge';
        if (isMine) badge.textContent = 'You';
        else if (isHostSeat) badge.textContent = 'Host';
        else if (seat.kind === 'ai' || seat.isAI) {
          badge.classList.add('ai');
          badge.textContent = 'AI';
        } else if (seat.kind === 'closed') {
          badge.classList.add('closed');
          badge.textContent = 'Closed';
        } else if (!seat.playerId) {
          badge.classList.add('open');
          badge.textContent = 'Open';
        } else {
          badge.textContent = 'Human';
        }
        btn.appendChild(badge);

        const art = seatArtUrl(seat, room);
        if (art) {
          const img = document.createElement('img');
          img.className = 'seat-art';
          img.src = art;
          img.alt = '';
          img.onerror = () => {
            img.remove();
            if (!btn.querySelector('.seat-placeholder')) {
              const ph = document.createElement('div');
              ph.className = 'seat-placeholder';
              ph.textContent = seat.name || 'Portrait missing';
              btn.insertBefore(ph, btn.querySelector('.seat-label'));
            }
          };
          btn.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'seat-placeholder';
          ph.textContent = seat.kind === 'closed' ? '—' : filled ? seat.name || 'Seated' : 'Empty';
          btn.appendChild(ph);
        }

        const label = document.createElement('div');
        label.className = 'seat-label';
        const seatName = seat.displayName || seat.name;
        label.textContent =
          seatName ||
          (seat.kind === 'closed' ? 'Closed' : !seat.playerId ? 'Open seat' : 'Seat');
        btn.appendChild(label);

        seatsEl.appendChild(btn);
      }
    }

    $('#host-controls').hidden = !isHost;
    $('#guest-wait').hidden = isHost;
    if (isHost) {
      $('#room-gp').value = room.config.partnershipPrestige ?? room.config.partnershipGp;
    } else {
      $('#guest-gp').textContent = `(Goal: ${room.config.partnershipPrestige ?? room.config.partnershipGp} Prestige)`;
    }
  }

  // One delegated handler so seat clicks always work after re-renders.
  $('#room-seats')?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.seat-tile');
    if (!btn || !btn.dataset.seatAction) return;
    ev.preventDefault();
    const seatIndex = Number(btn.dataset.seatIndex);
    if (btn.dataset.seatAction === 'counsel') {
      openCounselDialog();
      return;
    }
    if (btn.dataset.seatAction === 'cycle') {
      socket.emit('lobby:cycleSeat', { seatIndex }, (res) => {
        if (!res?.ok) {
          const err = res?.error || 'Could not change seat — is the server up to date?';
          showError($('#room-error'), err);
          toast(err);
          return;
        }
        showError($('#room-error'));
        if (res.room) {
          applyLobbyRoom(res.room);
          renderRoom();
        }
      });
    }
  });

  $('#counsel-dialog-close')?.addEventListener('click', () => closeCounselDialog());
  $('#counsel-dialog')?.addEventListener('click', (ev) => {
    if (ev.target === $('#counsel-dialog')) closeCounselDialog();
  });

  $('#room-gp')?.addEventListener('change', () => {
    socket.emit('lobby:setPartnership', { value: $('#room-gp').value }, (res) => {
      if (!res?.ok) toast(res?.error || 'Could not update');
    });
  });

  $('#btn-start').addEventListener('click', () => {
    socket.emit('lobby:start', {}, (res) => {
      if (!res?.ok) showError($('#room-error'), res?.error);
      else showError($('#room-error'));
    });
  });

  $('#btn-leave-room').addEventListener('click', () => {
    closeCounselDialog();
    socket.emit('lobby:leave', {}, () => {
      state.lobby = null;
      showScreen('lobby');
    });
  });

  // ——— Game ———
  socket.on('game:state', (game) => {
    state.myId = socket.id;
    state.pendingStates.push(game);
    drainStateQueue();
    if (state.screen !== 'game') showScreen('game');
  });

  function showGameDialog(payload) {
    const dialog = $('#afk-dialog');
    const text = $('#afk-dialog-text');
    const title = $('#afk-dialog-title');
    if (!dialog || !text) return;
    if (title) title.textContent = payload?.title || 'Player replaced';
    text.textContent = payload?.text || 'A player was replaced by an AI.';
    dialog.hidden = false;
  }

  function hideGameDialog() {
    const dialog = $('#afk-dialog');
    if (dialog) dialog.hidden = true;
  }

  $('#afk-dialog-ok')?.addEventListener('click', () => hideGameDialog());
  $('#afk-dialog')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideGameDialog();
  });

  socket.on('game:dialog', (payload) => {
    showGameDialog(payload);
  });

  socket.on('game:afk', (payload) => {
    showGameDialog(payload || {
      title: 'You were replaced',
      text: 'You took more than two minutes and were replaced by an AI.',
    });
    state.lobby = null;
    state.game = null;
    state.lastTurnReadyKey = null;
    stopTurnTimerTick();
    document.body.classList.remove('night-mode', 'game-scene-market', 'game-scene-cook', 'game-scene-court', 'game-scene-victory');
    showScreen('lobby');
  });

  function stashTurnTimer() {
    const el = $('#turn-timer');
    const host = $('#screen-game');
    if (el && host && el.parentElement !== host) host.appendChild(el);
  }

  function mountTurnTimerOnPlayer(playerId) {
    const el = $('#turn-timer');
    const card = playerScoreEl(playerId);
    if (!el || !card) return false;

    $$('.score-card.has-turn-timer').forEach((node) => node.classList.remove('has-turn-timer'));
    const anchor = card.querySelector('.score-portrait-wrap') || card;
    if (el.parentElement !== anchor) anchor.appendChild(el);
    card.classList.add('has-turn-timer');
    return true;
  }

  function clearTurnTimerMount() {
    $$('.score-card.has-turn-timer').forEach((node) => node.classList.remove('has-turn-timer'));
    stashTurnTimer();
  }

  function stopTurnTimerTick() {
    if (state.turnTimerTick) {
      clearInterval(state.turnTimerTick);
      state.turnTimerTick = null;
    }
  }

  function formatTimer(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  function renderTurnTimer(g) {
    const el = $('#turn-timer');
    const label = $('#turn-timer-label');
    const arc = el?.querySelector('.turn-timer-arc');
    if (!el || !label || !arc) return;

    const timer = g?.turnTimer;
    if (!timer?.deadline || g?.phase === 'game_over') {
      el.hidden = true;
      clearTurnTimerMount();
      stopTurnTimerTick();
      return;
    }

    if (!mountTurnTimerOnPlayer(timer.playerId)) {
      el.hidden = true;
      clearTurnTimerMount();
      stopTurnTimerTick();
      return;
    }

    el.hidden = false;
    const circumference = 2 * Math.PI * 15.5;
    arc.style.strokeDasharray = String(circumference);

    const paint = () => {
      const duration = Number(timer.durationMs) || 120000;
      const remaining = Math.max(0, timer.deadline - Date.now());
      const ratio = Math.min(1, remaining / duration);
      arc.style.strokeDashoffset = String(circumference * (1 - ratio));
      label.textContent = formatTimer(remaining);
      el.classList.toggle('urgent', remaining <= 30000);
      if (remaining <= 0) stopTurnTimerTick();
    };

    paint();
    stopTurnTimerTick();
    state.turnTimerTick = setInterval(paint, 250);
  }

  function renderGame() {
    const g = state.game;
    if (!g) return;

    const night = g.phase === 'night_case' || g.phase === 'game_over';
    document.body.classList.toggle('night-mode', g.phase === 'night_case');
    document.body.classList.remove('game-scene-market', 'game-scene-cook', 'game-scene-court', 'game-scene-victory');
    if (g.phase === 'day_market') document.body.classList.add('game-scene-market');
    else if (g.phase === 'day_cook') document.body.classList.add('game-scene-cook');
    else if (g.phase === 'night_case') document.body.classList.add('game-scene-court');
    else if (g.phase === 'game_over') document.body.classList.add('game-scene-victory');
    setMealtimeVisual(g.phase, { animate: false });
    $('#round-num').textContent = g.round;
    $('#goal-gp').textContent = g.config.partnershipPrestige ?? g.config.partnershipGp;

    renderScores(g);
    renderTurnTimer(g);
    renderHand(g);
    renderLog(g);

    if (g.phase !== 'day_market') {
      hideIngredientTooltip();
      state.marketGirlPokeCount = 0;
    }
    $('#market-zone').hidden = g.phase !== 'day_market';
    $('#cook-zone').hidden = g.phase !== 'day_cook';
    $('#court-zone').hidden = g.phase !== 'night_case';
    $('#gameover-zone').hidden = g.phase !== 'game_over';

    if (g.phase === 'day_market') renderMarket(g);
    if (g.phase === 'day_cook') renderCook(g);
    if (g.phase === 'night_case') renderCourt(g);
    if (g.phase === 'game_over') {
      setInstruction('');
      renderGameOver(g);
    }
  }

  function setInstruction(text, { waiting = false } = {}) {
    const el = $('#instruction-pill');
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('waiting');
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle('waiting', waiting);
  }

  function playerDisplayName(p) {
    if (p?.characterId) {
      const c =
        counselRoster(state.lobby)?.find((x) => x.id === p.characterId) ||
        state.characterRoster?.find((x) => x.id === p.characterId);
      if (c?.name) return c.name;
    }
    return p.name;
  }

  function renderScores(g) {
    stashTurnTimer();
    const rail = $('#scores-rail');
    rail.innerHTML = '';
    const firstId = g.firstPlayerId || g.judgeId;
    const ordered = [...(g.players || [])].sort((a, b) => a.seat - b.seat);

    for (const p of ordered) {
      const div = document.createElement('div');
      div.className = 'score-card';
      div.dataset.playerId = p.id;
      if (p.id === state.myId) div.classList.add('you');
      if (p.id === firstId) div.classList.add('first-player');
      if (p.isAI) div.classList.add('ai-player');

      if (g.phase === 'day_market' && p.seat === g.day?.turnSeat) {
        div.classList.add('market-turn');
      }
      if (g.phase === 'night_case' && g.night) {
        if (p.id === g.night.defenseId) div.classList.add('defense-litigant');
        if (p.id === g.night.currentActorId && p.id === g.night.defenseId) {
          div.classList.add('court-active');
        }
      }

      if (p.isAI) {
        const ai = document.createElement('span');
        ai.className = 'ai-corner-badge';
        ai.textContent = 'AI';
        div.appendChild(ai);
      }

      if (p.id === firstId) {
        const flag = document.createElement('span');
        flag.className = 'first-player-flag';
        flag.title = 'First Player Token';
        flag.textContent = '1st';
        div.appendChild(flag);
      }

      const title = document.createElement('h3');
      title.className = 'score-name';
      title.textContent = playerDisplayName(p);
      div.appendChild(title);

      const body = document.createElement('div');
      body.className = 'score-body';

      if (p.characterId) {
        const wrap = document.createElement('div');
        wrap.className = 'score-portrait-wrap';
        const portrait = document.createElement('img');
        portrait.className = 'score-portrait';
        portrait.src = characterArtUrl(p.characterId, 'front');
        portrait.alt = '';
        wrap.appendChild(portrait);
        body.appendChild(wrap);
      }

      const stats = document.createElement('div');
      stats.className = 'score-stats';

      const ingCount = p.ingredientCount ?? (p.hand || []).filter((c) => c.type === 'ingredient').length;
      const recipeCount = p.recipeCount ?? p.recipes?.length ?? 0;
      const argCount = p.argumentCount ?? (p.hand || []).filter((c) => c.type === 'argument').length;
      const foodCount = p.foodTokenCount ?? p.foodTokens?.length ?? 0;

      const grid = document.createElement('div');
      grid.className = 'player-token-grid';
      grid.innerHTML = `
        <span class="inv-stat" title="Gold pieces"><img src="/assets/coin.svg" alt="" class="gp-coin" /><strong>${playerGoldDisplay(p)}</strong></span>
        <span class="inv-stat" title="Prestige"><img src="/assets/prestige-icon.svg" alt="" class="prestige-icon" /><strong>${playerPrestigeDisplay(p)}</strong></span>
        <span class="inv-stat" title="Ingredients"><img src="/assets/ingredient-icon.svg" alt="" /><span>×${ingCount}</span></span>
        <span class="inv-stat" title="Food tokens"><img src="/assets/food-token.svg" alt="" /><span>×${foodCount}</span></span>
        <span class="inv-stat" title="Recipes"><img src="/assets/recipe-icon.svg" alt="" /><span>×${recipeCount}</span></span>
        <span class="inv-stat" title="Legal arguments"><img src="/assets/argument-icon.svg" alt="" /><span>×${argCount}</span></span>
      `;
      stats.appendChild(grid);
      body.appendChild(stats);
      div.appendChild(body);

      let activity = null;
      let activityClass = 'activity-bubble';
      if (g.phase === 'day_market') {
        if ((g.day?.passed || []).includes(p.id)) {
          activity = 'Done';
          activityClass += ' done';
        } else if (p.seat === g.day?.turnSeat) {
          activity = 'Buying…';
        }
      } else if (g.phase === 'day_cook') {
        if ((g.cook?.done || []).includes(p.id)) {
          activity = 'Done';
          activityClass += ' done';
        } else {
          activity = 'Cooking…';
        }
      } else if (g.phase === 'night_case' && g.night) {
        if (p.id === g.night.defenseId) {
          activity = p.id === g.night.currentActorId ? 'Defense · arguing' : 'Defense';
          activityClass += ' defense';
        }
      }
      if (activity) {
        const bubble = document.createElement('div');
        bubble.className = activityClass;
        bubble.textContent = activity;
        div.appendChild(bubble);
      }

      rail.appendChild(div);
    }
  }

  function animatePanelResize(el, rebuild) {
    if (!el) {
      rebuild();
      return;
    }
    const from = el.getBoundingClientRect().height;
    el.style.height = `${from}px`;
    el.style.overflow = 'hidden';
    el.style.transition = 'none';
    rebuild();
    const to = el.scrollHeight;
    if (Math.abs(to - from) < 1) {
      el.style.height = '';
      el.style.overflow = '';
      el.style.transition = '';
      return;
    }
    // Force layout, then animate to new height.
    void el.offsetHeight;
    el.style.transition = 'height 0.35s ease';
    el.style.height = `${to}px`;
    const clear = (ev) => {
      if (ev && ev.propertyName && ev.propertyName !== 'height') return;
      el.style.height = '';
      el.style.overflow = '';
      el.style.transition = '';
      el.removeEventListener('transitionend', clear);
    };
    el.addEventListener('transitionend', clear);
    window.setTimeout(() => clear({ propertyName: 'height' }), 400);
  }

  function courtUsables(g) {
    const canPlay = canDefenseRest(g);
    return { canPlay };
  }

  function renderHand(g) {
    const self = me(g);
    const handEl = $('#hand-cards');
    const recipeEl = $('#recipe-cards');
    const { canPlay } = courtUsables(g);
    const canSellArg = g.phase === 'day_market' && isMyTurnMarket(g);

    animatePanelResize(handEl, () => {
      handEl.innerHTML = '';
      if (!self) {
        handEl.textContent = 'Spectating…';
        return;
      }

      const ingredients = sortHand((self.hand || []).filter((c) => c.type === 'ingredient'));
      const argumentsCards = sortHand((self.hand || []).filter((c) => c.type === 'argument'));

      if (ingredients.length) {
        const grid = document.createElement('div');
        grid.className = 'ingredient-icon-grid';
        for (const c of ingredients) {
          const wrap = document.createElement('div');
          wrap.className = 'hand-ingredient';
          const fresh = c.freshness != null ? c.freshness : 3;
          wrap.title = `${c.name} · ${fresh} day${fresh === 1 ? '' : 's'} left`;
          const btn = document.createElement('img');
          btn.className = 'hand-ingredient-icon';
          btn.src = c.image || ingredientImage(c.id);
          btn.alt = c.name;
          wrap.appendChild(btn);
          const dots = document.createElement('div');
          dots.className = 'freshness-dots';
          dots.setAttribute('aria-label', `${fresh} freshness`);
          for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = `freshness-dot${i < fresh ? ' filled' : ''}`;
            dots.appendChild(dot);
          }
          wrap.appendChild(dots);
          grid.appendChild(wrap);
        }
        handEl.appendChild(grid);
      }

      if (argumentsCards.length) {
        const argWrap = document.createElement('div');
        argWrap.className = 'hand-arguments';
        for (const c of argumentsCards) {
          argWrap.appendChild(
            makeCardEl(c, {
              showEffect: true,
              landscape: true,
              interactive: canPlay || canSellArg,
              usable: canPlay,
              marketSell: canSellArg ? g.config?.argumentSellValue ?? 2 : null,
              onClick: canPlay
                ? () => sendAction({ type: 'court', payload: { type: 'argument', instanceId: c.instanceId } })
                : canSellArg
                  ? () => sendAction({ type: 'sell_argument', instanceId: c.instanceId })
                  : null,
            })
          );
        }
        handEl.appendChild(argWrap);
      }

      if (!ingredients.length && !argumentsCards.length) {
        handEl.innerHTML = '<p class="hint">Empty hand</p>';
      }
    });

    animatePanelResize(recipeEl, () => {
      recipeEl.innerHTML = '';
      if (!self) return;
      for (const r of self.recipes || []) {
        const tokens = (self.foodTokens || []).filter((t) => t.recipeId === r.id);
        recipeEl.appendChild(
          makeRecipeCardWithTokens(r, tokens, {
            ownedCounts: handIngredientCounts(self),
            usableFood: canPlay,
            onFoodClick: canPlay
              ? (token) => {
                  scrollCourtUiToTop();
                  sendAction({ type: 'court', payload: { type: 'food', tokenId: token.tokenId } });
                }
              : null,
          })
        );
      }
      if (!(self.recipes || []).length) recipeEl.innerHTML = '<p class="hint">No recipes yet</p>';
    });
  }

  function handIngredientCounts(player) {
    const counts = {};
    for (const c of player?.hand || []) {
      if (c.type === 'ingredient') counts[c.id] = (counts[c.id] || 0) + 1;
    }
    return counts;
  }

  function makeRecipeCardWithTokens(recipe, tokens = [], opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'recipe-with-tokens';
    wrap.dataset.recipeId = recipe.id || '';
    if (opts.dimmed) wrap.classList.add('dimmed');
    if (opts.interactive) wrap.classList.add('interactive');

    const owned = { ...(opts.ownedCounts || {}) };
    const need = {};
    for (const id of recipe.ingredients || []) need[id] = (need[id] || 0) + 1;
    const haveAll = Object.entries(need).every(([id, n]) => (owned[id] || 0) >= n);

    const card = document.createElement('div');
    card.className = 'card playing-card recipe recipe-card landscape';
    appendCardBanner(card, recipe.name);

    const body = document.createElement('div');
    body.className = 'recipe-body';

    const topRow = document.createElement('div');
    topRow.className = 'recipe-top-row';

    const foodWrap = document.createElement('div');
    foodWrap.className = `recipe-food-art-wrap${haveAll ? ' have-all' : ''}`;
    const img = document.createElement('img');
    img.className = 'card-art recipe-food-art';
    img.src = recipe.image || recipeImage(recipe.id);
    img.alt = recipe.name;
    foodWrap.appendChild(img);
    if (haveAll) {
      const check = document.createElement('span');
      check.className = 'recipe-have-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      foodWrap.appendChild(check);
    }
    topRow.appendChild(foodWrap);

    if (recipe.ingredients?.length) {
      const ings = document.createElement('div');
      ings.className = 'recipe-ingredients side two-row';
      ings.setAttribute('aria-label', 'Required ingredients');
      const remaining = { ...owned };
      for (const id of recipe.ingredients) {
        const have = (remaining[id] || 0) > 0;
        if (have) remaining[id] -= 1;
        const slot = document.createElement('span');
        slot.className = `recipe-ingredient-slot${have ? ' have' : ''}`;
        const icon = document.createElement('img');
        icon.className = 'recipe-ingredient-icon';
        icon.src = ingredientImage(id);
        icon.alt = ingredientLabel(id);
        icon.title = ingredientLabel(id);
        slot.appendChild(icon);
        if (have) {
          const check = document.createElement('span');
          check.className = 'recipe-have-check';
          check.setAttribute('aria-hidden', 'true');
          check.textContent = '✓';
          slot.appendChild(check);
        }
        ings.appendChild(slot);
      }
      topRow.appendChild(ings);
    }

    body.appendChild(topRow);

    if (opts.showEffect !== false && recipe.effect) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = describeEffect(recipe.effect);
      body.appendChild(meta);
    }

    if (opts.statusText) {
      const status = document.createElement('div');
      status.className = 'meta recipe-status';
      status.textContent = opts.statusText;
      body.appendChild(status);
    }

    card.appendChild(body);
    wrap.appendChild(card);

    if (tokens.length) {
      const tokenStack = document.createElement('div');
      tokenStack.className = 'food-token-stack';
      tokens.forEach((t, i) => {
        const tok = document.createElement('div');
        tok.className = 'food-token';
        if (t.tokenId) tok.dataset.tokenId = t.tokenId;
        if (opts.usableFood) tok.classList.add('usable-glow');
        tok.style.setProperty('--token-i', String(i));
        tok.title = t.name;
        const face = document.createElement('img');
        face.className = 'food-token-face';
        face.src = '/assets/food-token.svg';
        face.alt = 'Food token';
        const dish = document.createElement('img');
        dish.className = 'food-token-dish';
        dish.src = resolveFoodTokenImage(t, recipe);
        dish.alt = t.name;
        tok.appendChild(face);
        tok.appendChild(dish);
        if (opts.onFoodClick) {
          tok.addEventListener('click', (e) => {
            e.stopPropagation();
            opts.onFoodClick(t);
          });
        }
        tokenStack.appendChild(tok);
      });
      wrap.appendChild(tokenStack);
    }

    if (opts.showCookButton) {
      const cookBtn = document.createElement('button');
      cookBtn.type = 'button';
      cookBtn.className = 'btn primary cook-btn';
      cookBtn.textContent = 'Cook';
      cookBtn.disabled = !opts.canCook;
      cookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opts.onCook) opts.onCook(cookBtn);
      });
      wrap.appendChild(cookBtn);
    }

    if (opts.onClick) wrap.addEventListener('click', opts.onClick);
    return wrap;
  }

  function appendRecipeIngredientIcons(container, ingredientIds) {
    const row = document.createElement('div');
    row.className = 'recipe-ingredients';
    row.setAttribute('aria-label', 'Required ingredients');
    for (const id of ingredientIds || []) {
      const icon = document.createElement('img');
      icon.className = 'recipe-ingredient-icon';
      icon.src = ingredientImage(id);
      icon.alt = ingredientLabel(id);
      icon.title = ingredientLabel(id);
      row.appendChild(icon);
    }
    container.appendChild(row);
  }

  function makeCardEl(card, opts = {}) {
    if (card.type === 'recipe') {
      return makeRecipeCardWithTokens(card, opts.tokens || [], opts);
    }

    if (card.type === 'argument') {
      const div = document.createElement('div');
      div.className = 'card playing-card argument landscape argument-card';
      if (card.instanceId) div.dataset.instanceId = card.instanceId;
      if (opts.dimmed) div.classList.add('dimmed');
      if (opts.interactive) div.classList.add('interactive');
      if (opts.usable) div.classList.add('usable-glow');
      appendCardBanner(div, card.name);

      if (opts.marketSell != null) {
        div.classList.add('market-sellable');
        const overlay = document.createElement('div');
        overlay.className = 'sell-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'sell-label';
        label.textContent = 'SELL';
        overlay.appendChild(label);
        const price = document.createElement('span');
        price.className = 'sell-price';
        const coin = document.createElement('img');
        coin.src = '/assets/coin.svg';
        coin.alt = '';
        price.appendChild(coin);
        price.appendChild(document.createTextNode(String(opts.marketSell)));
        overlay.appendChild(price);
        div.appendChild(overlay);
      }

      const body = document.createElement('div');
      body.className = 'argument-body';

      const img = document.createElement('img');
      img.className = 'card-art argument-art';
      img.src = '/assets/arguments/scales.svg';
      img.alt = 'Legal argument';
      body.appendChild(img);

      const textCol = document.createElement('div');
      textCol.className = 'argument-text';
      if (opts.showEffect && card.effect) {
        const effect = document.createElement('div');
        effect.className = 'meta effect';
        effect.innerHTML = describeEffect(card.effect);
        textCol.appendChild(effect);
      }
      if (card.flavor) {
        const flavor = document.createElement('div');
        flavor.className = 'meta flavor';
        flavor.textContent = card.flavor;
        textCol.appendChild(flavor);
      }
      body.appendChild(textCol);
      div.appendChild(body);

      if (card.cost != null) {
        const cost = document.createElement('div');
        cost.className = 'cost';
        const coin = document.createElement('img');
        coin.src = '/assets/coin.svg';
        coin.alt = '';
        cost.appendChild(coin);
        cost.appendChild(document.createTextNode(String(card.cost)));
        div.appendChild(cost);
      }

      if (opts.onClick) div.addEventListener('click', opts.onClick);
      return div;
    }

    const div = document.createElement('div');
    div.className = `card playing-card ${card.type || ''}`;
    if (opts.dimmed) div.classList.add('dimmed');
    if (opts.interactive) div.classList.add('interactive');
    if (opts.landscape) div.classList.add('landscape');

    appendCardBanner(div, card.name);

    if (card.type === 'ingredient') {
      const img = document.createElement('img');
      img.className = 'card-art';
      img.src = card.image || ingredientImage(card.id);
      img.alt = card.name;
      div.appendChild(img);
      if (opts.ingredientTooltip) bindIngredientTooltip(div, opts.ingredientTooltip);
    }

    if (card.type === 'food') {
      const img = document.createElement('img');
      img.className = 'card-art';
      img.src = card.image || recipeImage(card.id || card.recipeId);
      img.alt = card.name;
      div.appendChild(img);
    }

    if (opts.recipeNeeded) {
      const badge = document.createElement('img');
      badge.className = 'recipe-need-badge';
      badge.src = '/assets/recipe-icon.svg';
      badge.alt = 'Needed for a recipe you hold';
      badge.title = 'Needed for a recipe you hold';
      div.appendChild(badge);
    }

    if (card.cost != null) {
      const cost = document.createElement('div');
      cost.className = 'cost';
      const coin = document.createElement('img');
      coin.src = '/assets/coin.svg';
      coin.alt = '';
      cost.appendChild(coin);
      cost.appendChild(document.createTextNode(String(card.cost)));
      div.appendChild(cost);
    }

    const metaBits = [];
    if (card.type !== 'ingredient' && card.flavor) metaBits.push(escapeHtml(card.flavor));
    if (opts.showEffect && card.effect) metaBits.push(describeEffect(card.effect));
    if (metaBits.length) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = metaBits.join(' · ');
      div.appendChild(meta);
    }

    if (opts.onClick) div.addEventListener('click', opts.onClick);
    return div;
  }

  function pokeMarketGirl() {
    const bubble = $('#market-girl-speech');
    if (!bubble) return;
    window.GameAudio?.playButton?.();
    state.marketGirlPokeCount += 1;
    bubble.textContent = state.marketGirlPokeCount > 5 ? 'Hey, watch it, bub!' : 'Tee hee!';
    bubble.hidden = false;
    bubble.classList.add('show');
  }

  function dismissMarketGirlHelp() {
    state.marketHelpDismissed = true;
    const bubble = $('#market-girl-speech');
    if (bubble) bubble.hidden = true;
  }

  function updateMarketGirlHelp(g) {
    const bubble = $('#market-girl-speech');
    if (!bubble) return;
    const turnKey = `${g?.round ?? 0}-${g?.day?.turnSeat ?? 'x'}`;
    if (turnKey !== state.marketHelpTurnKey) {
      state.marketHelpTurnKey = turnKey;
      state.marketHelpDismissed = false;
      bubble.textContent = 'Can I help you?';
    }
    const show = isMyTurnMarket(g) && !state.marketHelpDismissed;
    bubble.hidden = !show;
    if (show) bubble.classList.add('show');
  }

  function renderMarket(g) {
    hideIngredientTooltip();
    const row = $('#ingredient-market');
    const ingPile = $('#ingredient-deck-pile');
    const recipePile = $('#recipe-deck-pile');
    const argPile = $('#argument-deck-pile');
    const actions = $('#market-actions');
    row.innerHTML = '';
    actions.innerHTML = '';

    const myTurn = isMyTurnMarket(g);
    const self = me(g);
    updateMarketGirlHelp(g);

    if (myTurn) {
      setInstruction('Your turn — buy from market or decks, then leave');
    } else {
      const current = g.players.find((p) => p.seat === g.day?.turnSeat);
      setInstruction(`Waiting for ${current?.name || 'another player'}…`, { waiting: true });
    }

    const market = state.marketAwaitingDeal
      ? Array.from({ length: marketSlotCount(g) }, () => null)
      : normalizeIngredientMarket(g);
    for (let i = 0; i < market.length; i++) {
      const c = market[i];
      const slot = document.createElement('div');
      slot.className = 'market-slot';
      slot.dataset.slot = String(i);
      placeMarketSlotEl(slot, i);
      if (!c) {
        slot.classList.add('empty');
        slot.setAttribute('aria-label', 'Empty market slot');
        row.appendChild(slot);
        continue;
      }
      const canAfford = self && self.gold >= c.cost;
      const canBuy = myTurn && canAfford;
      const needed = self && ingredientNeededForRecipes(c.id, self.recipes);
      slot.appendChild(
        makeCardEl(c, {
          interactive: canBuy,
          dimmed: !canAfford,
          recipeNeeded: needed,
          ingredientTooltip: ingredientFlavorText(c),
          onClick: canBuy
            ? () => {
                dismissMarketGirlHelp();
                sendAction({ type: 'buy', source: 'ingredient', instanceId: c.instanceId });
              }
            : null,
        })
      );
      row.appendChild(slot);
    }
    if (!market.length) {
      row.innerHTML = '<p class="hint">No ingredients left this round</p>';
    }

    makeFaceDownDeckPile({
      pileEl: ingPile,
      backUrl: '/assets/backs/ingredient-back.png',
      source: 'ingredient_deck',
      label: 'Pantry',
      tooltip: 'Buy a Random Ingredient',
    });

    makeFaceDownDeckPile({
      pileEl: recipePile,
      backUrl: '/assets/backs/recipe-back.png',
      source: 'recipe',
      label: 'Recipes',
      tooltip: 'Buy a New Recipe',
    });

    makeFaceDownDeckPile({
      pileEl: argPile,
      backUrl: '/assets/backs/argument-back.png',
      source: 'argument',
      label: 'Arguments',
      tooltip: 'Buy a Legal Argument',
    });

    const pass = document.createElement('button');
    pass.type = 'button';
    pass.className = 'btn secondary';
    pass.textContent = 'Leave Market';
    pass.disabled = !myTurn;
    pass.classList.toggle('faded', !myTurn);
    pass.addEventListener('click', () => {
      if (!isMyTurnMarket(state.game)) return;
      dismissMarketGirlHelp();
      sendAction({ type: 'pass_market' });
    });
    actions.appendChild(pass);
  }

  function renderCook(g) {
    const panel = $('#cook-panel');
    panel.innerHTML = '';
    const self = me(g);
    if (!self) return;

    if (state.suppressPhaseUi) {
      setInstruction('');
      return;
    }

    const done = g.cook?.done?.includes(state.myId);
    if (done) {
      setInstruction('You finished cooking. Waiting for others…', { waiting: true });
      panel.innerHTML = '<p class="hint">You finished cooking. Waiting for others…</p>';
      return;
    }

    setInstruction('Cook any recipes you can, then finish.');

    const row = document.createElement('div');
    row.className = 'card-row cook-recipe-row';
    for (const r of self.recipes || []) {
      const ok = canCook(self, r, g.round);
      const alreadyCooked = self.foodTokens?.some((t) => t.recipeId === r.id && t.cookedRound === g.round);
      const tokens = (self.foodTokens || []).filter((t) => t.recipeId === r.id);
      const el = makeRecipeCardWithTokens(r, tokens, {
        dimmed: !ok || alreadyCooked,
        ownedCounts: handIngredientCounts(self),
        showCookButton: true,
        canCook: ok && !alreadyCooked,
        onCook: () => sendAction({ type: 'cook', recipeId: r.id }),
      });
      row.appendChild(el);
    }
    if (!(self.recipes || []).length) {
      row.innerHTML = '<p class="hint">No recipes — nothing to cook.</p>';
    }
    panel.appendChild(row);

    const finish = document.createElement('button');
    finish.type = 'button';
    finish.className = 'btn primary cook-done-btn';
    finish.textContent = 'Done cooking';
    finish.addEventListener('click', async () => {
      const res = await sendAction({ type: 'finish_cook' });
      if (res?.ok && res.spoiled > 0) toastOverHand('Discarded spoilt ingredients.');
    });
    panel.appendChild(finish);
  }

  function renderCourt(g) {
    const n = g.night;
    const banner = $('#case-banner');
    const scoresEl = $('#court-scores');
    const actions = $('#court-actions');
    const diceTable = $('#fate-dice-table');
    const reveal = $('#court-play-reveal');
    const defenseArt = $('#court-defense-art');
    banner.innerHTML = '';
    scoresEl.innerHTML = '';
    actions.innerHTML = '';
    if (reveal && !n?.lastPlay) reveal.innerHTML = '';
    if (diceTable && !n?.awaitingDice) {
      // Roll visibility is owned by playFateDiceOnTable — keep hidden until then.
      diceTable.classList.remove('active');
      diceTable.classList.add('idle');
    }

    const defensePlayer = n?.defenseId ? g.players.find((p) => p.id === n.defenseId) : null;
    if (defenseArt) {
      if (defensePlayer?.characterId) {
        defenseArt.hidden = false;
        defenseArt.src = characterArtUrl(defensePlayer.characterId, 'rear');
      } else {
        defenseArt.hidden = true;
        defenseArt.removeAttribute('src');
      }
    }

    if (state.suppressPhaseUi) {
      setInstruction('');
      return;
    }

    if (!n?.activeCase && !n?.awaitingDice && !n?.awaitingAdvance) {
      banner.innerHTML = '<p>Preparing the next case…</p>';
      setInstruction('Preparing the next case…', { waiting: true });
      return;
    }

    if (n.awaitingDice && n.pendingDice) {
      const d = n.pendingDice;
      const beforeD = d.scoreBefore?.d ?? d.defenseScore - d.defenseRoll;
      const difficulty = d.scoreBefore?.difficulty ?? d.caseDifficulty;
      const stakeGp = n.caseGpReward ?? n.activeCase?.gp ?? 0;
      const stakePrestige = n.casePrestigeReward ?? 1;
      if (n.activeCase) {
        banner.innerHTML = `
          <h3>${escapeHtml(displayCaseName(n.activeCase.name))}</h3>
          <p class="case-complaint">${escapeHtml(caseFlavorText(n.activeCase))}</p>
          ${caseStakesHtml(stakeGp, stakePrestige, caseDifficultyExpression(n, g.round))}
        `;
      } else {
        banner.innerHTML = `<h3>Judgement Die!</h3><p>Defense rests — rolling against the case.</p>`;
      }
      scoresEl.innerHTML = `
        <div class="side-score defense">
          <div>Defense</div>
          <strong>${escapeHtml(d.defenseName)}</strong>
          <div class="big" id="court-score-d">${defenseScorePendingHtml(beforeD)}</div>
        </div>
        <div class="side-score difficulty">
          <div>The Crown</div>
          <strong>Difficulty</strong>
          <div class="big" id="court-score-diff">${crownDifficultyHtml(n, difficulty, g.round)}</div>
        </div>
      `;
      if (reveal) reveal.innerHTML = '';
      actions.innerHTML = '';
      setInstruction('Rolling the judgement die…', { waiting: true });
      return;
    }

    if (n.awaitingAdvance) {
      // Keep case banner/scores visible while the verdict is announced.
      const def = g.players.find((p) => p.id === n.defenseId);
      const displayScores = courtScoresForDisplay(g);
      const currentDiff = displayScores.difficulty ?? n.caseDifficulty ?? 1;
      const stakeGp = n.caseGpReward ?? n.activeCase?.gp ?? 0;
      const stakePrestige = n.casePrestigeReward ?? 1;
      if (n.activeCase) {
        banner.innerHTML = `
          <h3>${escapeHtml(displayCaseName(n.activeCase.name))}</h3>
          <p class="case-complaint">${escapeHtml(caseFlavorText(n.activeCase))}</p>
          ${caseStakesHtml(stakeGp, stakePrestige, caseDifficultyExpression(n, g.round))}
        `;
      }
      scoresEl.innerHTML = `
        <div class="side-score defense">
          <div>Defense</div>
          <strong>${escapeHtml(def?.name || '')}</strong>
          <div class="big" id="court-score-d">${displayScores.d ?? n.defenseScore ?? 0}</div>
        </div>
        <div class="side-score difficulty">
          <div>The Crown</div>
          <strong>Difficulty</strong>
          <div class="big" id="court-score-diff">${crownDifficultyHtml(n, currentDiff, g.round)}</div>
        </div>
      `;
      actions.innerHTML = '';
      setInstruction('The court is delivering its verdict…', { waiting: true });
      return;
    }

    if (!n.activeCase) {
      banner.innerHTML = '<p>Preparing the next case…</p>';
      setInstruction('Preparing the next case…', { waiting: true });
      return;
    }

    const def = g.players.find((p) => p.id === n.defenseId);
    const displayScores = courtScoresForDisplay(g);
    const baseDiff = n.caseBaseDifficulty ?? n.activeCase.difficulty ?? 1;
    const currentDiff = displayScores.difficulty ?? n.caseDifficulty ?? baseDiff;
    const stakeGp = n.caseGpReward ?? n.activeCase.gp ?? 0;
    const stakePrestige = n.casePrestigeReward ?? 1;

    banner.innerHTML = `
      <h3>${escapeHtml(displayCaseName(n.activeCase.name))}</h3>
      <p class="case-complaint">${escapeHtml(caseFlavorText(n.activeCase))}</p>
      ${caseStakesHtml(stakeGp, stakePrestige, caseDifficultyExpression(n, g.round))}
    `;

    scoresEl.innerHTML = `
      <div class="side-score defense ${n.currentActorId === n.defenseId ? 'active-turn' : ''}">
        <div>Defense</div>
        <strong>${escapeHtml(def?.name || '')}</strong>
        <div class="big" id="court-score-d">${defenseScorePendingHtml(displayScores.d ?? 0)}</div>
      </div>
      <div class="side-score difficulty">
        <div>The Crown</div>
        <strong>Difficulty</strong>
        <div class="big" id="court-score-diff">${crownDifficultyHtml(n, currentDiff, g.round)}</div>
      </div>
    `;

    const myTurn = isMyCourtTurn(g);
    const amDefense = state.myId === n.defenseId;

    if (!amDefense) {
      const actor = g.players.find((p) => p.id === n.currentActorId);
      setInstruction(`Watching — ${actor?.name || '…'} is arguing for the defense`, { waiting: true });
      return;
    }

    if (!myTurn) {
      setInstruction('Waiting…', { waiting: true });
      return;
    }

    const canRest = canDefenseRest(g);
    setInstruction(
      canRest
        ? 'Treat the judge, make your case, then Defense Rests to roll'
        : 'The Crown is presenting its case…'
    );

    const pass = document.createElement('button');
    pass.type = 'button';
    pass.className = 'btn secondary';
    pass.textContent = 'Defense Rests';
    pass.disabled = !canRest;
    pass.classList.toggle('faded', !canRest);
    pass.setAttribute('aria-disabled', String(!canRest));
    if (canRest) {
      pass.addEventListener('click', () => sendAction({ type: 'court', payload: { type: 'pass' } }));
    }
    actions.appendChild(pass);
  }

  function renderGameOver(g) {
    const winner = g.players.find((p) => p.id === g.winnerId);
    $('#winner-title').textContent = winner ? `${winner.name} makes Partner!` : 'Game over';
    $('#winner-sub').textContent = g.tieBreakNote
      ? g.tieBreakNote
      : winner
        ? `${winner.prestige || 0} Prestige · ${winner.gold} GP · ${winner.casesWon} cases won`
        : '';
  }

  $('#btn-play-again').addEventListener('click', () => {
    socket.emit('lobby:leave', {}, () => {
      state.lobby = null;
      state.game = null;
      stopTurnTimerTick();
      document.body.classList.remove('night-mode');
      showScreen('lobby');
    });
  });

  function displayLogMsg(msg) {
    return String(msg || '')
      .replace(/\bJudge [Tt]oken\b/g, 'First Player Token')
      .replace(/\bjudge token\b/gi, 'First Player Token');
  }

  function renderLog(g) {
    const ul = $('#game-log');
    const entries = (g.log || [])
      .map((e) => ({ ...e, msg: displayLogMsg(e.msg) }))
      .filter((e) => !/^Tonight's docket:/.test(e.msg) && !/ passes\.?$/.test(e.msg) && !/ is forced to pass\./.test(e.msg));
    const existing = [...ul.querySelectorAll('li')];
    let samePrefix = existing.length <= entries.length;
    for (let i = 0; i < existing.length && samePrefix; i++) {
      if (existing[i].textContent !== entries[i].msg) samePrefix = false;
    }

    if (!samePrefix) {
      ul.innerHTML = '';
      for (const entry of entries) {
        const li = document.createElement('li');
        li.textContent = entry.msg;
        ul.appendChild(li);
      }
    } else {
      for (let i = existing.length; i < entries.length; i++) {
        const li = document.createElement('li');
        li.className = 'log-new';
        li.textContent = entries[i].msg;
        ul.appendChild(li);
      }
    }

    requestAnimationFrame(() => {
      ul.scrollTo({ top: ul.scrollHeight, behavior: 'smooth' });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('#btn-mute')) return;
      if (e.target.closest('.server-game.is-clickable')) return;
      const btn = e.target.closest('.btn:not(:disabled)');
      if (btn) window.GameAudio?.playButton?.();
    },
    true
  );

  socket.on('connect', () => {
    state.myId = socket.id;
  });
})();
