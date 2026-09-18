# Emorce Token Bot

**Token Live + Mass Joiner** — Railway ready  
Supports **50 000+ tokens**, locked channel, owner + server-owner join permissions.

---

## Features

| Command | Description |
|---------|-------------|
| `/token log` | Add tokens (paste or upload `.txt`) |
| `/token count` | Show stored token count |
| `/token preview` | Masked preview of first tokens |
| `/token clear` | Wipe all tokens (owner) |
| `/token output` | Download current tokens as `.txt` |
| `/emorce joiner` | Mass join tokens to an invite |
| `/emorce start` | Alias for joiner |
| `/bot image` | Change bot avatar |
| `/bot banner` | Change bot banner |
| `/bot status` | Set activity / status |

**Permissions**
- Bot owners (set via `OWNER_IDS`) can do everything.
- **Server owner** of any server the bot is in can run the joiner (so they can fill their own server).
- Optional **LOCKED_CHANNEL_ID** — if set, all slash commands only work in that channel.

---

## Quick Start (Local)

```bash
git clone <your-repo>
cd emorce-token-bot
cp .env.example .env
# edit .env with your values
npm install
node src/register-commands.js   # register slash commands
npm start
```

---

## Railway Deploy (Perfect Setup)

### 1. Create Discord Application
1. Go to https://discord.com/developers/applications
2. **New Application** → name it (e.g. Emorce Token)
3. **Bot** tab → Add Bot → copy the **Token**
4. Enable **Message Content Intent** (optional but useful)
5. **OAuth2 → URL Generator** → scopes: `bot` + `applications.commands`
6. Bot permissions: `Send Messages`, `Attach Files`, `Embed Links`, `Use Slash Commands`
7. Copy the invite URL and invite the bot to your server
8. Copy **Application ID** (Client ID) from General Information

### 2. Prepare the code
- Push this folder to a GitHub repository (private recommended).

### 3. Deploy on Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Railway auto-detects Node. If not, set:
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
4. Open the service → **Variables** tab and add:

```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
OWNER_IDS=your_discord_user_id,another_owner_id
LOCKED_CHANNEL_ID=          # leave empty for all channels, or put a channel ID
JOIN_DELAY_MS=800
MAX_CONCURRENT_JOINS=5
MAX_TOKENS=50000
BOT_STATUS=Emorce Tokens
BOT_ACTIVITY=Watching
```

5. (Optional but recommended) Add a **Volume**:
   - Mount path: `/data`
   - Then also set `DATA_DIR=/data`
   - This keeps `tokens.txt` persistent across redeploys.

6. Deploy. Watch the logs — you should see:
   ```
   [Emorce] Logged in as YourBot#0000
   [Emorce] Tokens loaded: 0
   ```

### 4. Register slash commands
After the first deploy, run the register script once:

**Option A – Railway one-off**
- In Railway → service → Settings → one-off command or use the Railway CLI:
  ```bash
  railway run node src/register-commands.js
  ```

**Option B – Locally**
```bash
# with same .env values
node src/register-commands.js
```

If you set `GUILD_ID` it registers instantly to that server.  
Without it, global commands can take up to 1 hour.

---

## Usage Flow

1. Invite bot to a server you own (or control).
2. Go to the locked channel (if set).
3. `/token log` → paste tokens or upload `tokens.txt`
4. `/token count` → verify
5. `/emorce joiner invite:discord.gg/xxxxx`  
   or `/emorce start invite:xxxxx limit:1000`
6. Watch the progress embed update.
7. `/token output` when you want the current list back as a file.

---

## Rate Limits & Safety Notes (for your fiction / testing)

- Default delay **800 ms** between joins + max **5 concurrent** is conservative.
- Aggressive settings will get tokens locked / banned faster.
- Discord actively detects mass joining. Use only accounts you control and only for testing / roleplay scenarios.
- Never share the bot token or the stored user tokens publicly.

---

## File Structure

```
emorce-token-bot/
├── package.json
├── railway.toml
├── .env.example
├── README.md
├── data/
│   └── tokens.txt          # runtime storage
├── src/
│   ├── index.js            # main entry
│   ├── register-commands.js
│   ├── commands/
│   │   ├── tokenlog.js     # /token log | count | clear | preview
│   │   ├── output.js       # /token output
│   │   ├── joiner.js       # /emorce joiner | start
│   │   └── botimage.js     # /bot image | banner | status
│   └── utils/
│       ├── tokenManager.js
│       ├── joiner.js
│       └── permissions.js
```

---

## Environment Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | Yes | — | Bot token |
| `CLIENT_ID` | Yes (for register) | — | Application ID |
| `OWNER_IDS` | Recommended | — | Comma-separated Discord user IDs |
| `LOCKED_CHANNEL_ID` | No | empty | Restrict all commands to this channel |
| `GUILD_ID` | No | — | Faster command registration |
| `JOIN_DELAY_MS` | No | 800 | Delay between join attempts |
| `MAX_CONCURRENT_JOINS` | No | 5 | Parallel join workers |
| `DATA_DIR` | No | `./data` | Where tokens.txt lives (use `/data` + volume on Railway) |
| `BOT_STATUS` | No | Emorce Tokens | Activity text |
| `BOT_ACTIVITY` | No | Watching | Playing / Watching / Listening / Competing |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Commands don’t appear | Run `register-commands.js`, wait, or set `GUILD_ID` |
| “Only bot owners…” | Add your user ID to `OWNER_IDS` |
| Joiner says no tokens | Use `/token log` first |
| Avatar change fails | Image must be < 10 MB, valid PNG/JPG/GIF |
| Tokens lost on redeploy | Add Railway Volume mounted at `/data` + `DATA_DIR=/data` |
| Rate limited | Increase `JOIN_DELAY_MS` to 1500–3000 |

---

**Emorce** — built for Axion.  
Keep the keys close. Keep the tokens closer.