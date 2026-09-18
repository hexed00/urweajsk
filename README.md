# Emorce Token Bot

**Token Live + Mass Joiner** — Railway ready. 50k+ tokens capacity.

## Commands

| Command | Description |
|---------|-------------|
| `/token log` | Add tokens (paste or .txt upload) |
| `/token count` | Show token count |
| `/token preview` | Preview first tokens (masked) |
| `/token clear` | Clear all tokens |
| `/token output` | Download as .txt |
| `/emorce joiner` | Mass join to server |
| `/emorce start` | Alias for joiner |
| `/bot image` | Change avatar |
| `/bot banner` | Change banner |
| `/bot status` | Set activity/status |

## Setup (5 minutes)

### Step 1: Discord Developer Portal
1. https://discord.com/developers/applications
2. **New Application** → name it
3. **Bot** → Add Bot → copy **Token** (DISCORD_TOKEN)
4. **OAuth2 → URL Generator**
   - Scopes: `bot` + `applications.commands`
   - Permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`
5. Copy invite URL → invite bot to your server
6. **General Information** → copy **Application ID** (CLIENT_ID)
7. Settings → **Advanced** → enable **Developer Mode**
8. Right-click your name → **Copy User ID** (for OWNER_IDS)

### Step 2: Railway Deploy
1. Push this folder to a private GitHub repo
2. https://railway.app → **New Project** → **Deploy from GitHub**
3. Select repo → Railway auto-detects Node
4. **Variables** tab → add:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_application_id
   OWNER_IDS=your_user_id
   JOIN_DELAY_MS=800
   MAX_CONCURRENT_JOINS=5
   BOT_STATUS=Emorce Tokens
   BOT_ACTIVITY=Watching
   DATA_DIR=/data
   ```
5. **(Optional) Add Volume**:
   - Mount path: `/data`
   - Keeps tokens persistent across redeploys

### Step 3: Register Commands
After first deploy, run once:
```bash
railway run node src/register-commands.js
```

Or set `GUILD_ID` in variables for instant registration.

---

## Usage

1. `/token log` → paste tokens or upload `.txt`
2. `/token count` → verify count
3. `/emorce joiner invite:https://discord.gg/xxxxx limit:5000`
4. Watch progress update live
5. `/token output` → download current list

---

## Permissions
- **Bot owners** (OWNER_IDS) — can use everything
- **Server owner** — can use joiner on their own server
- Optional **LOCKED_CHANNEL_ID** — restrict all commands to one channel

---

## Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DISCORD_TOKEN` | Yes | — | Bot token |
| `CLIENT_ID` | Yes | — | Application ID |
| `OWNER_IDS` | Yes | — | Comma-separated user IDs |
| `LOCKED_CHANNEL_ID` | No | empty | Lock commands to channel |
| `JOIN_DELAY_MS` | No | 800 | Delay between joins |
| `MAX_CONCURRENT_JOINS` | No | 5 | Parallel join workers |
| `BOT_STATUS` | No | Emorce Tokens | Activity text |
| `BOT_ACTIVITY` | No | Watching | Playing/Watching/Listening/Competing |
| `DATA_DIR` | No | ./data | Token storage path |
| `GUILD_ID` | No | — | Fast command registration |

---

## File Structure

```
emorce-bot/
├── package.json
├── railway.toml
├── .env.example
├── README.md
├── data/
│   └── tokens.txt          # token storage
├── src/
│   ├── index.js            # main entry
│   ├── register-commands.js
│   ├── commands/
│   │   ├── tokenlog.js
│   │   ├── joiner.js
│   │   └── botimage.js
│   └── utils/
│       ├── tokenManager.js
│       ├── joiner.js
│       └── permissions.js
```

---

## Local Test (Optional)

```bash
npm install
cp .env.example .env
# edit .env with your values
node src/register-commands.js
npm start
```

---

**Emorce** — built for Axion.
