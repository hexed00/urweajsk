# Emorce Token Bot — Full Tutorial

Step-by-step from zero to live on Railway with 50k token capacity.

---

## Part 1 — Discord Developer Portal

1. Open https://discord.com/developers/applications
2. Click **New Application**
3. Name it anything (example: `Emorce Live`)
4. Accept the terms → Create
5. Left sidebar → **Bot**
6. Click **Add Bot** → Yes
7. Under **Token** click **Reset Token** / **Copy**  
   → save this somewhere safe. This is `DISCORD_TOKEN`
8. Scroll down → **Privileged Gateway Intents**
   - Turn **Message Content Intent** ON (optional)
9. Left sidebar → **OAuth2** → **URL Generator**
   - Scopes: check `bot` and `applications.commands`
   - Bot Permissions:  
     `Send Messages`, `Embed Links`, `Attach Files`,  
     `Use Application Commands`, `Read Message History`
10. Copy the generated URL at the bottom
11. Open the URL in a browser → select your server → Authorize
12. Left sidebar → **General Information**
    - Copy **Application ID** → this is `CLIENT_ID`

---

## Part 2 — Get your Discord User ID (for OWNER_IDS)

1. Discord → User Settings → Advanced → enable **Developer Mode**
2. Right-click your own name anywhere → **Copy User ID**
3. That number goes into `OWNER_IDS`

---

## Part 3 — Local test (optional but recommended)

```bash
# 1. Extract / clone the project
cd emorce-token-bot

# 2. Install
npm install

# 3. Create env
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=MTAx....your_bot_token
CLIENT_ID=123456789012345678
OWNER_IDS=987654321098765432
LOCKED_CHANNEL_ID=
JOIN_DELAY_MS=1000
MAX_CONCURRENT_JOINS=3
```

```bash
# 4. Register commands (guild = instant)
# Add GUILD_ID=your_server_id to .env for instant registration
node src/register-commands.js

# 5. Start
npm start
```

You should see:
```
[Emorce] Logged in as EmorceLive#1234
[Emorce] Tokens loaded: 0
```

In Discord type `/` and you should see the commands.

---

## Part 4 — Railway Deploy (Production)

### A. Push to GitHub
1. Create a new **private** repository
2. Upload / push the entire `emorce-token-bot` folder
3. Do **not** commit `.env` or real tokens

### B. Railway project
1. https://railway.app → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select the repository
4. Railway will detect Node.js

### C. Environment Variables
Click the service → **Variables** → add one by one (or Raw Editor):

```
DISCORD_TOKEN=paste_bot_token
CLIENT_ID=paste_application_id
OWNER_IDS=your_user_id
LOCKED_CHANNEL_ID=
JOIN_DELAY_MS=800
MAX_CONCURRENT_JOINS=5
BOT_STATUS=Emorce Tokens
BOT_ACTIVITY=Watching
DATA_DIR=/data
```

### D. Persistent storage (important)
1. In the service click **+ New** → **Volume**
2. Mount path: `/data`
3. This keeps `tokens.txt` alive across restarts and redeploys

### E. Deploy
- Railway auto-deploys on push
- Or click **Deploy**
- Open **Deployments** → **View Logs**
- Wait for `[Emorce] Logged in as ...`

### F. Register commands on Railway
Easiest way: use Railway CLI

```bash
npm i -g @railway/cli
railway login
railway link          # select the project
railway run node src/register-commands.js
```

Or temporarily set `GUILD_ID` in variables, redeploy, then remove it.

---

## Part 5 — Daily Use

### Load tokens
1. Create a text file with one token per line
2. In the locked channel (or any if unlocked):
   `/token log` → attach the file  
   **or** paste them into the `tokens` option

### Check
`/token count`  
`/token preview`

### Join a server
`/emorce joiner invite:https://discord.gg/yourcode`  
or  
`/emorce start invite:yourcode limit:5000`

Only:
- people in `OWNER_IDS`, **or**
- the **owner of the server** the bot is currently in  
can run the joiner.

### Export
`/token output` → downloads current list as `.txt`

### Change look
`/bot image` → upload new avatar  
`/bot banner` → upload banner  
`/bot status type:Watching text:50k tokens online`

---

## Part 6 — Scaling to 50k tokens

- Tokens are stored as plain text lines in `data/tokens.txt` (or `/data/tokens.txt`)
- Memory usage is low (one string array)
- Join speed is controlled by:
  - `JOIN_DELAY_MS` (higher = safer)
  - `MAX_CONCURRENT_JOINS` (higher = faster but riskier)
- Recommended starting values for large lists:
  ```
  JOIN_DELAY_MS=1200
  MAX_CONCURRENT_JOINS=3
  ```
- Progress embed updates every ~5 seconds so you can watch live.

---

## Part 7 — Locking the bot to one channel

1. Right-click the channel you want → **Copy Channel ID**
2. Put it in Railway variable `LOCKED_CHANNEL_ID=123...`
3. Redeploy
4. All slash commands now only work in that channel

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Commands missing | Not registered | Run `register-commands.js` |
| “Only bot owners can…” | Your ID not in OWNER_IDS | Add it and redeploy |
| “No tokens stored” | Empty file | `/token log` first |
| Join fails 400/401 | Dead or invalid token | Clean with `/token preview` + remove |
| Join fails 429 | Rate limited | Raise JOIN_DELAY_MS |
| Avatar error | Bad image / size | Use PNG < 8 MB |
| Tokens disappear | No volume | Add Volume at `/data` + DATA_DIR=/data |

---

## Final Checklist before going live

- [ ] Bot invited with `applications.commands` scope
- [ ] `DISCORD_TOKEN` + `CLIENT_ID` set
- [ ] Your user ID in `OWNER_IDS`
- [ ] Commands registered
- [ ] Volume mounted if you care about persistence
- [ ] Locked channel set (optional)
- [ ] Tested with 2–3 tokens first

You’re done.  
The bot is ready for 50k tokens.

**Emorce** — for Axion.