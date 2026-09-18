require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

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
    tokenCommand.options.push(...(json.options || []));
  } else {
    commands.push(json);
  }
}

if (tokenCommand.options.length > 0) {
  commands.push(tokenCommand);
}

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional for faster guild-only register

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and CLIENT_ID are required');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Registering ${commands.length} application commands...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Successfully registered guild commands for ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Successfully registered global commands (can take up to 1 hour to appear)');
    }
  } catch (err) {
    console.error(err);
  }
})();