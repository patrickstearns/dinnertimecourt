const { customAlphabet } = require('nanoid');
const { GameEngine } = require('./GameEngine');
const { pickMarketAction, pickCookActions, pickCourtAction } = require('./AIPlayer');
const defaultConfig = require('../shared/config');
const { turnTimerKey } = require('../shared/turnTimer');
const { pickRandomAiName, shuffleAiNames } = require('../shared/aiNames');
const { PLAYABLE_CHARACTERS, playableById } = require('../shared/characters');

const codeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
const SEAT_COUNT = 6;

function takenCharacterIds(players) {
  return new Set(players.map((p) => p.characterId).filter(Boolean));
}

function pickUnusedCharacter(players, bag = null) {
  const taken = takenCharacterIds(players);
  if (Array.isArray(bag) && bag.length) {
    while (bag.length) {
      const name = bag.shift();
      const c = PLAYABLE_CHARACTERS.find((x) => x.name === name);
      if (c && !taken.has(c.id)) return c;
    }
  }
  const pool = PLAYABLE_CHARACTERS.filter((c) => !taken.has(c.id));
  if (!pool.length) return null;
  const name = pickRandomAiName(
    players.map((p) => p.name),
    null
  );
  return PLAYABLE_CHARACTERS.find((c) => c.name === name && !taken.has(c.id)) || pool[0];
}

function characterRoster() {
  return PLAYABLE_CHARACTERS.map((c) => ({
    id: c.id,
    name: c.name,
    front: c.front,
    rear: c.rear,
  }));
}

class Room {
  constructor(hostSocketId, hostName, config = {}) {
    this.code = codeGen();
    const merged = { ...defaultConfig, ...config };
    const prestigeGoal =
      merged.partnershipPrestige ?? merged.partnershipGp ?? defaultConfig.partnershipPrestige ?? 10;
    this.config = {
      ...merged,
      partnershipPrestige: prestigeGoal,
      partnershipGp: prestigeGoal,
      maxPlayers: SEAT_COUNT,
    };
    this.hostId = hostSocketId;
    this.aiNameBag = shuffleAiNames();
    this.players = [];
    this.seats = Array.from({ length: SEAT_COUNT }, (_, index) => ({
      index,
      kind: 'open', // open | closed | human | ai
      playerId: null,
    }));
    this.status = 'lobby';
    this.game = null;
    this.aiCounter = 0;
    this._aiTimer = null;
    this._caseAdvanceTimer = null;
    this._diceTimer = null;

    const character = pickUnusedCharacter([], this.aiNameBag);
    if (!character) {
      const fallback = PLAYABLE_CHARACTERS[0];
      this._seatPlayer(0, {
        id: hostSocketId,
        name: hostName,
        displayName: hostName,
        characterId: fallback?.id || null,
        isAI: false,
        isHost: true,
        connected: true,
      });
    } else {
      this._seatPlayer(0, {
        id: hostSocketId,
        name: hostName,
        displayName: hostName,
        characterId: character.id,
        isAI: false,
        isHost: true,
        connected: true,
      });
    }
  }

  _seatPlayer(seatIndex, player) {
    const seat = this.seats[seatIndex];
    if (!seat) return null;
    player.seatIndex = seatIndex;
    player.isHost = player.id === this.hostId;
    this.players.push(player);
    seat.playerId = player.id;
    seat.kind = player.isAI ? 'ai' : 'human';
    return player;
  }

  _removePlayerAtSeat(seatIndex, { closed = false } = {}) {
    const seat = this.seats[seatIndex];
    if (!seat?.playerId) {
      seat.kind = closed ? 'closed' : 'open';
      seat.playerId = null;
      return;
    }
    this.players = this.players.filter((p) => p.id !== seat.playerId);
    seat.playerId = null;
    seat.kind = closed ? 'closed' : 'open';
  }

  firstOpenSeatIndex() {
    return this.seats.findIndex((s) => s.kind === 'open' && !s.playerId);
  }

  openSeatCount() {
    return this.seats.filter((s) => s.kind === 'open' && !s.playerId).length;
  }

  toLobbyState() {
    return {
      code: this.code,
      status: this.status,
      hostId: this.hostId,
      config: this.config,
      characters: characterRoster(),
      seats: this.seats.map((s) => {
        const p = s.playerId ? this.players.find((x) => x.id === s.playerId) : null;
        return {
          index: s.index,
          kind: s.kind,
          playerId: s.playerId,
          name: p?.displayName || p?.name || null,
          displayName: p?.displayName || p?.name || null,
          characterId: p?.characterId || null,
          isAI: !!p?.isAI,
          isHost: !!p?.isHost,
          front: p?.characterId ? `/assets/characters/${p.characterId}-front.png` : null,
        };
      }),
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName || p.name,
        characterId: p.characterId || null,
        seatIndex: p.seatIndex,
        isAI: p.isAI,
        isHost: p.isHost,
        connected: p.connected,
        front: p.characterId ? `/assets/characters/${p.characterId}-front.png` : null,
      })),
    };
  }

  toBrowserEntry() {
    const maxPlayers = SEAT_COUNT;
    const playerCount = this.players.length;
    const host = this.players.find((p) => p.id === this.hostId) || this.players[0];
    const openSeats = this.openSeatCount();
    const joinable = this.status === 'lobby' && openSeats > 0;
    return {
      code: this.code,
      status: this.status,
      hostName: host?.name || 'Unknown',
      playerCount,
      maxPlayers,
      openSeats,
      partnershipGp: this.config.partnershipPrestige ?? this.config.partnershipGp,
      partnershipPrestige: this.config.partnershipPrestige ?? this.config.partnershipGp,
      joinable,
      playerNames: this.players.map((p) => p.name),
    };
  }
}

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.socketRoom = new Map();
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase());
  }

  createRoom(socket, username, config) {
    if (this.socketRoom.has(socket.id)) {
      return { ok: false, error: 'Already in a room' };
    }
    const room = new Room(socket.id, username, config);
    this.rooms.set(room.code, room);
    this.socketRoom.set(socket.id, room.code);
    socket.join(room.code);
    this.broadcastRoomList();
    return { ok: true, room: room.toLobbyState() };
  }

  joinRoom(socket, code, username) {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: 'Room not found' };
    if (this.socketRoom.has(socket.id)) return { ok: false, error: 'Already in a room' };

    const existing = room.players.find(
      (p) => !p.isAI && (p.displayName || p.name).toLowerCase() === username.toLowerCase()
    );
    if (existing) {
      if (existing.connected) {
        return { ok: false, error: 'Name taken in this room' };
      }
      return this._reconnectPlayer(room, socket, username, existing);
    }

    if (room.status !== 'lobby') {
      return { ok: false, error: 'Game already started — rejoin with the same name you used before' };
    }
    const seatIndex = room.firstOpenSeatIndex();
    if (seatIndex < 0) return { ok: false, error: 'Room is full' };

    if (!room.aiNameBag?.length) room.aiNameBag = shuffleAiNames();
    const character = pickUnusedCharacter(room.players, room.aiNameBag);
    room._seatPlayer(seatIndex, {
      id: socket.id,
      name: username,
      displayName: username,
      characterId: character?.id || null,
      isAI: false,
      isHost: false,
      connected: true,
    });
    this.socketRoom.set(socket.id, room.code);
    socket.join(room.code);
    this.broadcastLobby(room);
    this.broadcastRoomList();
    return { ok: true, room: room.toLobbyState() };
  }

  _reconnectPlayer(room, socket, username, existing) {
    const oldId = existing.id;
    existing.id = socket.id;
    existing.connected = true;
    existing.name = username;
    if (!existing.displayName) existing.displayName = username;

    if (existing.isHost) {
      room.hostId = socket.id;
      room.players.forEach((x) => {
        x.isHost = x.id === socket.id;
      });
    }

    const seat = room.seats[existing.seatIndex];
    if (seat) seat.playerId = socket.id;

    if (room.game) {
      room.game.reconnectPlayer(oldId, socket.id);
      if (room.turnDeadlines?.[oldId] != null) {
        room.turnDeadlines[socket.id] = room.turnDeadlines[oldId];
        delete room.turnDeadlines[oldId];
      }
      if (room.turnReadyKeys) {
        delete room.turnReadyKeys[oldId];
        delete room.turnReadyKeys[socket.id];
      }
    }

    this.socketRoom.set(socket.id, room.code);
    socket.join(room.code);

    if (room.status === 'playing') {
      this.syncTurnDeadlines(room);
      this.broadcastGame(room);
      this.scheduleAI(room);
    } else {
      this.broadcastLobby(room);
    }
    this.broadcastRoomList();
    return { ok: true, room: room.toLobbyState(), rejoined: true, playing: room.status === 'playing' };
  }

  selectCharacter(socket, characterId) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.status !== 'lobby') return { ok: false, error: 'Game already started' };
    const character = playableById(characterId);
    if (!character) return { ok: false, error: 'Unknown character' };
    const taken = room.players.find((p) => p.characterId === character.id && p.id !== socket.id);
    if (taken) return { ok: false, error: 'That counsel is already seated' };
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || me.isAI) return { ok: false, error: 'Cannot select' };
    // Art only — keep the username the player joined/created with
    me.characterId = character.id;
    if (!me.displayName) me.displayName = me.name;
    this.broadcastLobby(room);
    this.broadcastRoomList();
    return { ok: true, room: room.toLobbyState() };
  }

  /** Host cycles seat: open → AI → closed → open. Occupied guest seat → kick to closed. */
  cycleSeat(socket, seatIndex) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.hostId !== socket.id) return { ok: false, error: 'Only host can change seats' };
    if (room.status !== 'lobby') return { ok: false, error: 'Game already started' };
    const idx = Number(seatIndex);
    const seat = room.seats[idx];
    if (!seat) return { ok: false, error: 'Invalid seat' };
    if (seat.playerId === room.hostId) {
      return { ok: false, error: 'Cannot change the host seat' };
    }

    if (seat.kind === 'human' && seat.playerId) {
      const guest = room.players.find((p) => p.id === seat.playerId);
      if (guest && !guest.isAI) {
        this.socketRoom.delete(guest.id);
        const guestSocket = this.io.sockets.sockets.get(guest.id);
        if (guestSocket) {
          guestSocket.leave(room.code);
          guestSocket.emit('room:closed', { reason: 'Host closed your seat' });
        }
      }
      room._removePlayerAtSeat(idx, { closed: true });
    } else if (seat.kind === 'open') {
      if (!room.aiNameBag?.length) room.aiNameBag = shuffleAiNames();
      const character = pickUnusedCharacter(room.players, room.aiNameBag);
      if (!character) return { ok: false, error: 'No characters left' };
      room.aiCounter += 1;
      room._seatPlayer(idx, {
        id: `ai_${room.code}_${room.aiCounter}`,
        name: character.name,
        displayName: character.name,
        characterId: character.id,
        isAI: true,
        isHost: false,
        connected: true,
      });
    } else if (seat.kind === 'ai') {
      room._removePlayerAtSeat(idx, { closed: true });
    } else if (seat.kind === 'closed') {
      seat.kind = 'open';
      seat.playerId = null;
    }

    this.broadcastLobby(room);
    this.broadcastRoomList();
    return { ok: true, room: room.toLobbyState() };
  }

  addAI(socket) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.hostId !== socket.id) return { ok: false, error: 'Only host can add AI' };
    const seatIndex = room.firstOpenSeatIndex();
    if (seatIndex < 0) return { ok: false, error: 'No open seats' };
    return this.cycleSeat(socket, seatIndex);
  }

  removeAI(socket, aiId) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.hostId !== socket.id) return { ok: false, error: 'Only host' };
    if (room.status !== 'lobby') return { ok: false, error: 'Already started' };
    const p = room.players.find((x) => x.id === aiId && x.isAI);
    if (!p) return { ok: false, error: 'AI not found' };
    room._removePlayerAtSeat(p.seatIndex, { closed: false });
    this.broadcastLobby(room);
    this.broadcastRoomList();
    return { ok: true };
  }

  setPartnership(socket, value) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.hostId !== socket.id) return { ok: false, error: 'Only host' };
    if (room.status !== 'lobby') return { ok: false, error: 'Already started' };
    const n = Number(value);
    if (!Number.isFinite(n) || n < 5 || n > 99) return { ok: false, error: 'Prestige goal must be 5–99' };
    const goal = Math.round(n);
    room.config.partnershipPrestige = goal;
    room.config.partnershipGp = goal;
    this.broadcastLobby(room);
    this.broadcastRoomList();
    return { ok: true };
  }

  leave(socket) {
    const code = this.socketRoom.get(socket.id);
    if (!code) return;
    const room = this.rooms.get(code);
    this.socketRoom.delete(socket.id);
    if (!room) return;

    if (room.status === 'lobby') {
      const p = room.players.find((x) => x.id === socket.id);
      if (p) p.connected = false;
      if (room.hostId === socket.id) {
        const next = room.players.find((x) => !x.isAI && x.connected && x.id !== socket.id);
        if (next) {
          room.hostId = next.id;
          room.players.forEach((x) => {
            x.isHost = x.id === next.id;
          });
        }
      }
      if (!room.players.some((x) => !x.isAI && x.connected)) {
        this._destroy(room);
        return;
      }
      this.broadcastLobby(room);
      this.broadcastRoomList();
      return;
    }

    const p = room.players.find((x) => x.id === socket.id);
    if (p) p.connected = false;
    if (room.game) {
      const gp = room.game.playerById(socket.id);
      if (gp) gp.connected = false;
    }
    const humansLeft = room.players.some((x) => !x.isAI && x.connected);
    if (!humansLeft) {
      this._destroy(room);
      return;
    }
    this.broadcastGame(room);
    this.broadcastRoomList();
  }

  startGame(socket) {
    const room = this.roomFor(socket.id);
    if (!room) return { ok: false, error: 'Not in a room' };
    if (room.hostId !== socket.id) return { ok: false, error: 'Only host can start' };
    if (room.status !== 'lobby') return { ok: false, error: 'Already started' };
    if (room.players.length < room.config.minPlayers) {
      return { ok: false, error: `Need at least ${room.config.minPlayers} players` };
    }

    for (const p of room.players) {
      if (p.characterId) continue;
      const c = pickUnusedCharacter(room.players, room.aiNameBag);
      if (!c) return { ok: false, error: 'Not enough characters' };
      p.characterId = c.id;
      if (p.isAI) p.name = c.name;
    }

    // Order players by seat index for consistent seating
    room.players.sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0));

    room.status = 'playing';
    room.game = new GameEngine(room.players, room.config);
    room.turnDeadlines = {};
    room.turnReadyKeys = {};
    room.turnTimerPublic = null;
    this.broadcastGame(room);
    this.broadcastRoomList();
    this.scheduleAI(room);
    return { ok: true };
  }

  roomFor(socketId) {
    const code = this.socketRoom.get(socketId);
    return code ? this.rooms.get(code) : null;
  }

  broadcastLobby(room) {
    this.io.to(room.code).emit('lobby:update', room.toLobbyState());
  }

  listRooms() {
    return [...this.rooms.values()]
      .map((room) => room.toBrowserEntry())
      .sort((a, b) => {
        if (a.joinable !== b.joinable) return a.joinable ? -1 : 1;
        if (a.status !== b.status) return a.status === 'lobby' ? -1 : 1;
        return a.hostName.localeCompare(b.hostName);
      });
  }

  broadcastRoomList() {
    this.io.emit('lobby:list', { rooms: this.listRooms() });
  }

  broadcastGame(room) {
    if (!room.game) return;
    this.syncTurnDeadlines(room);
    for (const p of room.players) {
      if (p.isAI) continue;
      if (!p.connected) continue;
      const state = room.game.publicState(p.id);
      state.turnTimer = room.turnTimerPublic || null;
      this.io.to(p.id).emit('game:state', state);
    }
  }

  /** Humans who must act right now (market/court turn, or unfinished cook). */
  timedHumanActors(g) {
    if (!g || g.phase === 'game_over') return [];
    if (g.phase === 'day_market') {
      const current = g.playerBySeat(g.day?.turnSeat);
      if (current && !current.isAI && !(g.day.passed || []).includes(current.id)) return [current];
      return [];
    }
    if (g.phase === 'day_cook') {
      return g.players.filter((p) => !p.isAI && !(g.cook?.done || []).includes(p.id));
    }
    if (g.phase === 'night_case') {
      const n = g.night;
      if (!n || n.awaitingDice || n.awaitingAdvance || !n.activeCase) return [];
      const actor = n.currentActorId ? g.playerById(n.currentActorId) : null;
      if (actor && !actor.isAI) return [actor];
      return [];
    }
    return [];
  }

  syncTurnDeadlines(room) {
    const g = room.game;
    if (!g || room.status !== 'playing') {
      room.turnDeadlines = {};
      room.turnTimerPublic = null;
      if (room._turnTimer) {
        clearTimeout(room._turnTimer);
        room._turnTimer = null;
      }
      return;
    }

    const duration = Number(room.config?.turnTimeoutMs ?? defaultConfig.turnTimeoutMs) || 120000;
    const actors = this.timedHumanActors(g);
    const actorIds = new Set(actors.map((a) => a.id));
    room.turnDeadlines = room.turnDeadlines || {};

    for (const id of Object.keys(room.turnDeadlines)) {
      if (!actorIds.has(id)) delete room.turnDeadlines[id];
    }
    const now = Date.now();
    room.turnReadyKeys = room.turnReadyKeys || {};
    for (const a of actors) {
      const key = turnTimerKey(g, a.id);
      const ready = a.isAI || (key && room.turnReadyKeys[a.id] === key);
      if (!ready) {
        delete room.turnDeadlines[a.id];
        continue;
      }
      if (room.turnDeadlines[a.id] == null) room.turnDeadlines[a.id] = now + duration;
    }

    const entries = Object.entries(room.turnDeadlines).sort((x, y) => x[1] - y[1]);
    if (!entries.length) {
      room.turnTimerPublic = null;
      if (room._turnTimer) {
        clearTimeout(room._turnTimer);
        room._turnTimer = null;
      }
      return;
    }

    const [playerId, deadline] = entries[0];
    room.turnTimerPublic = { playerId, deadline, durationMs: duration };

    if (room._turnTimer) clearTimeout(room._turnTimer);
    const delay = Math.max(0, deadline - Date.now());
    room._turnTimer = setTimeout(() => {
      room._turnTimer = null;
      this._onTurnTimeout(room, playerId);
    }, delay);
  }

  signalTurnReady(socket, clientKey) {
    const room = this.roomFor(socket.id);
    if (!room?.game || room.status !== 'playing') return { ok: false, error: 'No active game' };
    const expected = turnTimerKey(room.game, socket.id);
    if (!expected || clientKey !== expected) return { ok: false, error: 'Not actionable yet' };
    room.turnReadyKeys = room.turnReadyKeys || {};
    room.turnReadyKeys[socket.id] = expected;
    this.syncTurnDeadlines(room);
    this.broadcastGame(room);
    return { ok: true };
  }

  _onTurnTimeout(room, playerId) {
    if (!room?.game || room.status !== 'playing') return;
    const still = this.timedHumanActors(room.game).some((p) => p.id === playerId);
    if (!still) {
      this.syncTurnDeadlines(room);
      this.broadcastGame(room);
      return;
    }
    this.replaceHumanWithAI(room, playerId, 'timeout');
  }

  replaceHumanWithAI(room, playerId, reason = 'timeout') {
    const rp = room.players.find((p) => p.id === playerId);
    const gp = room.game?.playerById(playerId);
    if (!rp || rp.isAI) return { ok: false };
    const name = rp.name || 'A player';

    rp.isAI = true;
    rp.connected = false;
    if (gp) {
      gp.isAI = true;
      gp.connected = false;
    }
    if (room.turnDeadlines) delete room.turnDeadlines[playerId];
    if (room.turnReadyKeys) delete room.turnReadyKeys[playerId];

    room.game?.addLog(`${name} took too long and was replaced by an AI.`);

    const payload = {
      title: 'Player replaced',
      text: `${name} took more than two minutes and was replaced by an AI.`,
      playerId,
      playerName: name,
      reason,
    };
    this.io.to(room.code).emit('game:dialog', payload);

    const sock = this.io.sockets.sockets.get(playerId);
    if (sock) {
      sock.emit('game:afk', payload);
      // Mark AI before disconnect so leave() does not treat them as a lingering human.
      sock.disconnect(true);
    }

    const humansLeft = room.players.some((x) => !x.isAI && x.connected);
    if (!humansLeft) {
      this._destroy(room);
      return { ok: true };
    }

    this._afterGameUpdate(room);
    this.broadcastRoomList();
    return { ok: true };
  }

  _afterGameUpdate(room) {
    this.broadcastGame(room);
    const n = room.game?.night;
    if (n?.awaitingDice) {
      this.scheduleDiceResolve(room);
    } else if (n?.awaitingAdvance) {
      this.scheduleCaseAdvance(room);
    } else {
      this.scheduleAI(room);
    }
  }

  scheduleDiceResolve(room) {
    if (room._diceTimer) clearTimeout(room._diceTimer);
    if (room._caseAdvanceTimer) clearTimeout(room._caseAdvanceTimer);
    if (!room.game?.night?.awaitingDice) return;
    room._diceTimer = setTimeout(() => {
      room._diceTimer = null;
      if (!room.game?.night?.awaitingDice) return;
      room.game.finalizeDiceAndResolve();
      this._afterGameUpdate(room);
    }, 2600);
  }

  scheduleCaseAdvance(room) {
    if (room._caseAdvanceTimer) clearTimeout(room._caseAdvanceTimer);
    if (room._diceTimer) clearTimeout(room._diceTimer);
    if (!room.game?.night?.awaitingAdvance) return;
    room._caseAdvanceTimer = setTimeout(() => {
      room._caseAdvanceTimer = null;
      if (!room.game?.night?.awaitingAdvance) return;
      room.game.advanceNightAfterSummary();
      this._afterGameUpdate(room);
    }, 5000);
  }

  _destroy(room) {
    if (room._aiTimer) clearTimeout(room._aiTimer);
    if (room._caseAdvanceTimer) clearTimeout(room._caseAdvanceTimer);
    if (room._diceTimer) clearTimeout(room._diceTimer);
    if (room._turnTimer) clearTimeout(room._turnTimer);
    this.io.to(room.code).emit('room:closed', { reason: 'Room closed' });
    this.rooms.delete(room.code);
    for (const [sid, code] of this.socketRoom.entries()) {
      if (code === room.code) this.socketRoom.delete(sid);
    }
    this.broadcastRoomList();
  }

  // ——— Player actions ———
  handleAction(socket, action) {
    const room = this.roomFor(socket.id);
    if (!room || !room.game) return { ok: false, error: 'No active game' };
    const result = this._applyAction(room, socket.id, action || {});
    if (result?.ok) this._afterGameUpdate(room);
    return result;
  }

  _applyAction(room, playerId, action) {
    const g = room.game;
    switch (action.type) {
      case 'buy':
        return g.buyMarketCard(playerId, action);
      case 'pass_market':
        return g.passMarket(playerId);
      case 'sell_argument':
        return g.sellArgument(playerId, action.instanceId);
      case 'cook':
        return g.cookRecipe(playerId, action.recipeId);
      case 'finish_cook':
        return g.finishCooking(playerId);
      case 'court':
        return g.courtAction(playerId, action.payload || action);
      default:
        return { ok: false, error: 'Unknown action' };
    }
  }

  scheduleAI(room) {
    if (room._aiTimer) clearTimeout(room._aiTimer);
    if (!room.game || room.status !== 'playing') return;
    if (room.game.phase === 'game_over') return;
    if (room.game.night?.awaitingDice || room.game.night?.awaitingAdvance) return;

    room._aiTimer = setTimeout(() => {
      room._aiTimer = null;
      try {
        this._runAI(room);
      } catch (err) {
        console.error('AI error', err);
      }
    }, 700);
  }

  _runAI(room) {
    const g = room.game;
    if (!g || room.status !== 'playing') return;
    if (g.phase === 'game_over') return;
    if (g.night?.awaitingDice || g.night?.awaitingAdvance) return;

    let acted = false;

    if (g.phase === 'day_market') {
      const current = g.playerBySeat(g.day.turnSeat);
      if (current?.isAI) {
        const act = pickMarketAction(g, current.id);
        if (act?.type === 'buy') g.buyMarketCard(current.id, act);
        else g.passMarket(current.id);
        acted = true;
      }
    } else if (g.phase === 'day_cook') {
      for (const p of g.players) {
        if (!p.isAI) continue;
        if (g.cook.done.includes(p.id)) continue;
        const cooks = pickCookActions(g, p.id);
        for (const c of cooks) {
          g.cookRecipe(p.id, c.recipeId);
        }
        g.finishCooking(p.id);
        acted = true;
      }
    } else if (g.phase === 'night_case') {
      const actorId = g.night?.currentActorId;
      const actor = actorId ? g.playerById(actorId) : null;
      if (actor?.isAI) {
        const act = pickCourtAction(g, actor.id);
        if (act) g.courtAction(actor.id, act);
        acted = true;
      }
    }

    if (acted) this._afterGameUpdate(room);
  }
}

module.exports = { RoomManager, Room };
