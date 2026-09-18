require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
  ActivityType
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const tokenManager = require('./utils/tokenManager');
const { isOwner, checkChannelLock } = require('./utils/permissions');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ========== Load commands ==========
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

const slashCommands = [];

// We carefully merge /token subcommands from tokenlog + output
const tokenCommand = {
  name: 'token',
  description: 'Token management (Emorce)',
  options: []
};

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (!cmd.data) continue;

  const json = cmd.data.toJSON();

  if (json.name === 'token') {
    // merge options
    tokenCommand.options.push(...(json.options || []));
    // store execute by subcommand name
    for (const opt of json.options || []) {
      if (opt.type === 1) { // SUB_COMMAND
        client.commands.set(`token:${opt.name}`, cmd);
      }
    }
  } else {
    client.commands.set(json.name, cmd);
    slashCommands.push(json);
  }
}

if (tokenCommand.options.length > 0) {
  slashCommands.push(tokenCommand);
}

// ========== Ready ==========
client.once(Events.ClientReady, async (c) => {
  console.log(`[Emorce] Logged in as ${c.user.tag}`);
  console.log(`[Emorce] Tokens loaded: ${tokenManager.getTokenCount()}`);
  console.log(`[Emorce] Owners: ${process.env.OWNER_IDS || 'none set'}`);
  console.log(`[Emorce] Locked channel: ${process.env.LOCKED_CHANNEL_ID || 'none (all channels)'}`);

  const statusText = process.env.BOT_STATUS || 'Emorce Tokens';
  const activityType = process.env.BOT_ACTIVITY || 'Watching';
  const typeMap = {
    Playing: ActivityType.Playing,
    Watching: ActivityType.Watching,
    Listening: ActivityType.Listening,
    Competing: ActivityType.Competing
  };
  c.user.setActivity(statusText, { type: typeMap[activityType] || ActivityType.Watching });
});

// ========== Interaction handler ==========
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  let command;

  if (commandName === 'token') {
    const sub = interaction.options.getSubcommand();
    command = client.commands.get(`token:${sub}`);
  } else {
    command = client.commands.get(commandName);
  }

  if (!command) {
    return interaction.reply({ content: 'Command not found.', ephemeral: true }).catch(() => {});
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Emorce] Command error (${commandName}):`, err);
    const msg = { content: `Error: ${err.message}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

// ========== Simple text prefix fallback (optional) ==========
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!emorce')) return;

  // Only owners
  if (!isOwner(message.author.id)) return;

  const args = message.content.slice(7).trim().split(/\s+/);
  const sub = args.shift()?.toLowerCase();

  if (sub === 'count') {
    return message.reply(`Tokens: **${tokenManager.getTokenCount()}**`);
  }
  if (sub === 'ping') {
    return message.reply(`Pong. Latency: ${client.ws.ping}ms`);
  }
});

// ========== Login ==========
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('[Emorce] DISCORD_TOKEN is missing. Set it in Railway Variables or .env');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('[Emorce] Login failed:', err.message);
  process.exit(1);
});

// Keep process alive + basic health
process.on('unhandledRejection', (reason) => {
  console.error('[Emorce] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Emorce] Uncaught exception:', err);
});