require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const TokenManager = require('./utils/tokenManager');
const { checkPermission } = require('./utils/permissions');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
client.tokenManager = new TokenManager();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.on('ready', () => {
  console.log(`[Emorce] Logged in as ${client.user.tag}`);
  console.log(`[Emorce] Tokens loaded: ${client.tokenManager.getCount()}`);
  
  const status = process.env.BOT_STATUS || 'Emorce Tokens';
  const activity = process.env.BOT_ACTIVITY || 'Watching';
  
  client.user.setActivity(status, { type: activity.toUpperCase() });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const lockedChannelId = process.env.LOCKED_CHANNEL_ID;
  if (lockedChannelId && interaction.channelId !== lockedChannelId) {
    return interaction.reply({
      content: `❌ This command only works in <#${lockedChannelId}>`,
      ephemeral: true,
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    const hasPermission = checkPermission(interaction.user.id, interaction.guild?.ownerId);
    if (!hasPermission) {
      return interaction.reply({
        content: '❌ Only bot owners or server owners can use this command.',
        ephemeral: true,
      });
    }

    await command.execute(interaction, client);
  } catch (error) {
    console.error('[Emorce] Error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Error executing command', ephemeral: true });
    } else {
      await interaction.followUp({ content: '❌ Error executing command', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
