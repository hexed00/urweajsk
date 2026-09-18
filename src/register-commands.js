require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const commands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

(async () => {
  try {
    console.log(`[Emorce] Registering ${commands.length} commands...`);

    const guildId = process.env.GUILD_ID;
    const clientId = process.env.CLIENT_ID;

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`[Emorce] Registered commands to guild ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('[Emorce] Registered commands globally (can take up to 1 hour)');
    }
  } catch (error) {
    console.error('[Emorce] Registration failed:', error);
  }
})();
