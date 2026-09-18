const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const tokenManager = require('../utils/tokenManager');
const { isOwner, checkChannelLock } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('token')
    .setDescription('Token management (Emorce)')
    .addSubcommand(sub =>
      sub.setName('log')
        .setDescription('Add tokens from text or attachment')
        .addStringOption(opt =>
          opt.setName('tokens')
            .setDescription('Paste tokens (one per line or space/comma separated)')
            .setRequired(false)
        )
        .addAttachmentOption(opt =>
          opt.setName('file')
            .setDescription('Upload a .txt file with tokens')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('count')
        .setDescription('Show how many tokens are stored')
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear all stored tokens (owner only)')
    )
    .addSubcommand(sub =>
      sub.setName('preview')
        .setDescription('Preview first few tokens (masked)')
    )
    .addSubcommand(sub =>
      sub.setName('output')
        .setDescription('Download current tokens as .txt file')
        .addBooleanOption(opt =>
          opt.setName('ephemeral')
            .setDescription('Send file only to you (default true)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const lock = checkChannelLock(interaction);
    if (!lock.allowed) {
      return interaction.reply({ content: lock.message, ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'log') {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: 'Only bot owners can add tokens.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      let raw = interaction.options.getString('tokens') || '';
      const file = interaction.options.getAttachment('file');

      if (file) {
        if (!file.name.endsWith('.txt') && file.contentType && !file.contentType.includes('text')) {
          return interaction.editReply('Please upload a plain .txt file.');
        }
        try {
          const res = await fetch(file.url);
          const text = await res.text();
          raw += '\n' + text;
        } catch (e) {
          return interaction.editReply('Failed to download attachment: ' + e.message);
        }
      }

      if (!raw.trim()) {
        return interaction.editReply('Provide tokens via the `tokens` option or upload a .txt file.');
      }

      // Split by newlines, spaces, commas
      const candidates = raw
        .split(/[\n\r, ]+/)
        .map(t => t.trim())
        .filter(t => t.length > 30);

      if (candidates.length === 0) {
        return interaction.editReply('No valid looking tokens found.');
      }

      const before = tokenManager.getTokenCount();
      const after = tokenManager.addTokens(candidates);
      const added = after - before;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('Emorce Token Log')
        .setDescription(`Added **${added}** new tokens.\nTotal stored: **${after}**`)
        .setFooter({ text: 'Emorce Token Live' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'count') {
      const count = tokenManager.getTokenCount();
      return interaction.reply({
        content: `Currently stored tokens: **${count}**`,
        ephemeral: true
      });
    }

    if (sub === 'clear') {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: 'Only bot owners can clear tokens.', ephemeral: true });
      }
      tokenManager.clearTokens();
      return interaction.reply({ content: 'All tokens cleared.', ephemeral: true });
    }

    if (sub === 'preview') {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: 'Only bot owners can preview tokens.', ephemeral: true });
      }
      const { total, preview } = tokenManager.getTokensPreview(8);
      const list = preview.length ? preview.map((t, i) => `\`${i + 1}. ${t}\``).join('\n') : '_none_';
      return interaction.reply({
        content: `**Total:** ${total}\n**Preview (masked):**\n${list}`,
        ephemeral: true
      });
    }

    if (sub === 'output') {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: 'Only bot owners can export tokens.', ephemeral: true });
      }
      const tokens = tokenManager.loadTokens();
      if (tokens.length === 0) {
        return interaction.reply({ content: 'No tokens stored.', ephemeral: true });
      }
      const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
      const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
      const buffer = Buffer.from(tokens.join('\n'), 'utf8');
      const attachment = new AttachmentBuilder(buffer, { name: `emorce-tokens-${Date.now()}.txt` });
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('Emorce Token Export')
        .setDescription(`Exported **${tokens.length}** tokens.`)
        .setFooter({ text: 'Emorce Token Live' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], files: [attachment], ephemeral });
    }
  }
};