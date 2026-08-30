const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { RoomManager } = require('./game/RoomManager');
const config = require('./shared/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: false },
});

const rooms = new RoomManager(io);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/meta', (_req, res) => {
  const { PLAYABLE_CHARACTERS, NPC_CHARACTERS } = require('./shared/characters');
  const { CASES, ARGUMENTS, INGREDIENTS, RECIPES } = require('./shared/cards');
  res.json({
    config,
    describeEffectHint: true,
    cases: CASES.map(({ id, name, flavor, accusations }) => ({ id, name, flavor, accusations })),
    arguments: ARGUMENTS.map(({ id, name, dialogue }) => ({ id, name, dialogue })),
    ingredients: INGREDIENTS.map(({ id, name, flavor }) => ({ id, name, flavor })),
    recipes: RECIPES.map(({ id, name, judgeDialogue }) => ({ id, name, judgeDialogue })),
    characters: PLAYABLE_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      front: c.front,
      rear: c.rear,
    })),
    npcs: NPC_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      front: c.front,
      rear: c.rear,
    })),
  });
});

io.on('connection', (socket) => {
  const { PLAYABLE_CHARACTERS } = require('./shared/characters');
  const { CASES, ARGUMENTS, INGREDIENTS, RECIPES } = require('./shared/cards');
  socket.emit('hello', {
    config,
    cases: CASES.map(({ id, name, flavor, accusations }) => ({ id, name, flavor, accusations })),
    arguments: ARGUMENTS.map(({ id, name, dialogue }) => ({ id, name, dialogue })),
    ingredients: INGREDIENTS.map(({ id, name, flavor }) => ({ id, name, flavor })),
    recipes: RECIPES.map(({ id, name, judgeDialogue }) => ({ id, name, judgeDialogue })),
    characters: PLAYABLE_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      front: c.front,
      rear: c.rear,
    })),
  });
  socket.emit('lobby:list', { rooms: rooms.listRooms() });

  socket.on('lobby:list', (_payload, cb) => {
    const list = rooms.listRooms();
    cb?.({ ok: true, rooms: list });
    socket.emit('lobby:list', { rooms: list });
  });

  socket.on('lobby:create', (payload, cb) => {
    const username = String(payload?.username || '').trim().slice(0, 20);
    if (!username) return cb?.({ ok: false, error: 'Enter a username' });
    const prestige =
      payload?.partnershipPrestige != null
        ? Number(payload.partnershipPrestige)
        : payload?.partnershipGp != null
          ? Number(payload.partnershipGp)
          : null;
    const result = rooms.createRoom(
      socket,
      username,
      prestige ? { partnershipPrestige: prestige } : {}
    );
    cb?.(result);
  });

  socket.on('lobby:join', (payload, cb) => {
    const username = String(payload?.username || '').trim().slice(0, 20);
    const code = String(payload?.code || '').trim().toUpperCase();
    if (!username) return cb?.({ ok: false, error: 'Enter a username' });
    if (!code) return cb?.({ ok: false, error: 'Pick a game to join' });
    const result = rooms.joinRoom(socket, code, username);
    cb?.(result);
  });

  socket.on('lobby:addAI', (_payload, cb) => {
    cb?.(rooms.addAI(socket));
  });

  socket.on('lobby:removeAI', (payload, cb) => {
    cb?.(rooms.removeAI(socket, payload?.aiId));
  });

  socket.on('lobby:setPartnership', (payload, cb) => {
    cb?.(rooms.setPartnership(socket, payload?.value));
  });

  socket.on('lobby:selectCharacter', (payload, cb) => {
    cb?.(rooms.selectCharacter(socket, payload?.characterId));
  });

  socket.on('lobby:cycleSeat', (payload, cb) => {
    cb?.(rooms.cycleSeat(socket, payload?.seatIndex));
  });

  socket.on('lobby:start', (_payload, cb) => {
    cb?.(rooms.startGame(socket));
  });

  socket.on('lobby:leave', (_payload, cb) => {
    rooms.leave(socket);
    cb?.({ ok: true });
  });

  socket.on('game:action', (action, cb) => {
    const result = rooms.handleAction(socket, action || {});
    cb?.(result);
  });

  socket.on('game:turnReady', (payload, cb) => {
    cb?.(rooms.signalTurnReady(socket, payload?.key));
  });

  socket.on('disconnect', () => {
    rooms.leave(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Dinnertime Court listening on ${PORT}`);
});
