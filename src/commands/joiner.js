const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinServer } = require('../utils/joiner');

function extractInviteCode(input) {
  const match = input.match(/(?:discord\.gg\/|discordapp\.com\/invite\/)([a-zA-Z0-9-]+)|^([a-zA-Z0-9-]+)$/);
  return match ? match[1] || match[2] : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emorce')
    .setDescription('Emorce commands')
    .addSubcommand(sub =>
      sub
        .setName('joiner')
        .setDescription('Mass join tokens to server')
        .addStringOption(opt => opt.setName('invite').setDescription('Invite URL or code').setRequired(true))
        .addIntegerOption(opt => opt.setName('limit').setDescription('Max tokens to use').setRequired(false))
        .addIntegerOption(opt => opt.setName('delay').setDescription('Delay ms between joins').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Alias for joiner')
        .addStringOption(opt => opt.setName('invite').setDescription('Invite URL or code').setRequired(true))
        .addIntegerOption(opt => opt.setName('limit').setDescription('Max tokens to use').setRequired(false))
        .addIntegerOption(opt => opt.setName('delay').setDescription('Delay ms between joins').setRequired(false))
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'joiner' || subcommand === 'start') {
      await interaction.deferReply();

      const inviteInput = interaction.options.getString('invite');
      const limit = interaction.options.getInteger('limit') || 50000;
      const delayMs = interaction.options.getInteger('delay') || parseInt(process.env.JOIN_DELAY_MS || '800');

      const inviteCode = extractInviteCode(inviteInput);
      if (!inviteCode) {
        return interaction.editReply('❌ Invalid invite URL or code');
      }

      const tokens = client.tokenManager.getAll().slice(0, limit);
      if (tokens.length === 0) {
        return interaction.editReply('❌ No tokens stored');
      }

      const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOINS || '5');
      let joined = 0;
      let failed = 0;

      const progressEmbed = () =>
        new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle('🔄 Joiner Progress')
          .addFields(
            { name: 'Joined', value: `${joined}`, inline: true },
            { name: 'Failed', value: `${failed}`, inline: true },
            { name: 'Total', value: `${tokens.length}`, inline: true },
            { name: 'Invite', value: `discord.gg/${inviteCode}`, inline: false }
          );

      await interaction.editReply({ embeds: [progressEmbed()] });

      let lastUpdate = Date.now();

      for (let i = 0; i < tokens.length; i += maxConcurrent) {
        const batch = tokens.slice(i, i + maxConcurrent);
        const promises = batch.map(token => joinServer(token, inviteCode));

        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result.success) joined++;
          else failed++;
        });

        if (Date.now() - lastUpdate > 5000) {
          await interaction.editReply({ embeds: [progressEmbed()] });
          lastUpdate = Date.now();
        }

        if (i + maxConcurrent < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      const finalEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('✓ Joiner Complete')
        .addFields(
          { name: 'Joined', value: `${joined}`, inline: true },
          { name: 'Failed', value: `${failed}`, inline: true },
          { name: 'Success Rate', value: `${Math.round((joined / tokens.length) * 100)}%`, inline: true }
        );

      await interaction.editReply({ embeds: [finalEmbed] });
    }
  },
};
