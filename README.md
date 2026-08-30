# Dinnertime Court

Online multiplayer board game: lawyers cook treats by day and argue silly cases by night. First to make **Partner** wins.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy on Render

1. Push this folder to a GitHub repo.
2. In [Render](https://render.com), create a **Web Service**.
3. Connect the repo.
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
5. Deploy. Render sets `PORT` automatically.

Share the Render URL with friends; each opens it in a browser, picks a name, creates or joins a room with the 4-letter code.

## How to play

1. **Sign in** with a display name (session only; nothing saved).
2. **Lobby:** create a room or join with a code.
3. **Game lobby:** host can add AI lawyers, set Partnership GP (default 30), and start when 2–6 players are ready.
4. **Day — Market:** take turns buying ingredients, recipes, and legal arguments.
5. **Day — Kitchen:** spend ingredients on your recipes to make Food tokens.
6. **Night — Court:** each player gets a case as Prosecutor vs the player to their left as Defense (so everyone is prosecution and defense once). Alternate playing arguments and food until both pass; higher score wins the case GP. The First Player Token marks who starts the round.
7. **Win:** reach the Partnership GP goal before rivals.

## Config (host, in game lobby)

| Setting | Default |
|---------|---------|
| Partnership GP | 30 |
| Starting gold | 10 |
| Market card costs | 1–5 gold |
| Players | 2–6 |

## Stack

- Node.js + Express (static files + API)
- Socket.io (real-time rooms and game sync)
- Vanilla HTML/CSS/JS client
"# dinnertimecourt" 
