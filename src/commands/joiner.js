const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const tokenManager = require('../utils/tokenManager');
const { massJoin } = require('../utils/joiner');
const { canUseJoin, checkChannelLock, isOwner } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emorce')
    .setDescription('Emorce Token Joiner')
    .addSubcommand(sub =>
      sub.setName('joiner')
        .setDescription('Make stored tokens join a server via invite')
        .addStringOption(opt =>
          opt.setName('invite')
            .setDescription('Invite code or full invite URL')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('limit')
            .setDescription('Max tokens to use (default: all, max 50000)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50000)
        )
    )
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Alias for joiner - start mass join')
        .addStringOption(opt =>
          opt.setName('invite')
            .setDescription('Invite code or full invite URL')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('limit')
            .setDescription('Max tokens to use')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50000)
        )
    ),

  async execute(interaction) {
    const lock = checkChannelLock(interaction);
    if (!lock.allowed) {
      return interaction.reply({ content: lock.message, ephemeral: true });
    }

    if (!canUseJoin(interaction)) {
      return interaction.reply({
        content: 'Only the bot owner or the **server owner** of a server the bot is in can run the joiner.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    if (sub !== 'joiner' && sub !== 'start') return;

    let inviteRaw = interaction.options.getString('invite');
    // Extract code from full URL if needed
    const match = inviteRaw.match(/(?:discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)([a-zA-Z0-9-]+)/i);
    const inviteCode = match ? match[1] : inviteRaw.trim();

    if (!inviteCode || inviteCode.length < 3) {
      return interaction.reply({ content: 'Invalid invite code.', ephemeral: true });
    }

    const limit = interaction.options.getInteger('limit') || 50000;
    let tokens = tokenManager.loadTokens();

    if (tokens.length === 0) {
      return interaction.reply({
        content: 'No tokens stored. Use `/token log` first.',
        ephemeral: true
      });
    }

    tokens = tokens.slice(0, Math.min(limit, tokens.length));

    await interaction.deferReply({ ephemeral: false });

    const embedStart = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('Emorce Joiner Started')
      .setDescription(`Joining **${tokens.length}** tokens to invite \`${inviteCode}\`\nDelay: ${process.env.JOIN_DELAY_MS || 800}ms | Concurrency: ${process.env.MAX_CONCURRENT_JOINS || 5}`)
      .setFooter({ text: 'Emorce Token Live • This may take a while' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embedStart] });

    let lastUpdate = Date.now();
    const results = await massJoin(tokens, inviteCode, async (progress) => {
      // Update every ~5 seconds to avoid rate limits on edit
      if (Date.now() - lastUpdate > 5000) {
        lastUpdate = Date.now();
        try {
          const progressEmbed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('Emorce Joiner Running')
            .setDescription(
              `Progress: **${progress.done}/${progress.total}**\n` +
              `Success: **${progress.success}** | Failed: **${progress.failed}**\n` +
              `Invite: \`${inviteCode}\``
            )
            .setTimestamp();
          await interaction.editReply({ embeds: [progressEmbed] });
        } catch (_) {}
      }
    });

    const finalEmbed = new EmbedBuilder()
      .setColor(results.success > 0 ? 0x2ecc71 : 0xe74c3c)
      .setTitle('Emorce Joiner Finished')
      .addFields(
        { name: 'Total Attempted', value: String(results.total), inline: true },
        { name: 'Success', value: String(results.success), inline: true },
        { name: 'Failed', value: String(results.failed), inline: true },
        { name: 'Invite', value: `\`${inviteCode}\``, inline: false }
      )
      .setFooter({ text: 'Emorce Token Live' })
      .setTimestamp();

    if (results.errors.length > 0) {
      finalEmbed.addFields({
        name: 'Sample Errors',
        value: results.errors.slice(0, 5).map(e => `\`${e.error.slice(0, 80)}\``).join('\n') || 'none'
      });
    }

    await interaction.editReply({ embeds: [finalEmbed] });
  }
};