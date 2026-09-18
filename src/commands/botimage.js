const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, checkChannelLock } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Bot appearance controls')
    .addSubcommand(sub =>
      sub.setName('image')
        .setDescription('Change the bot avatar')
        .addAttachmentOption(opt =>
          opt.setName('image')
            .setDescription('New avatar image (PNG/JPG/GIF)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('banner')
        .setDescription('Change the bot banner (requires Nitro-level bot or boost)')
        .addAttachmentOption(opt =>
          opt.setName('image')
            .setDescription('New banner image')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Set bot status / activity')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Activity type')
            .setRequired(true)
            .addChoices(
              { name: 'Playing', value: 'Playing' },
              { name: 'Watching', value: 'Watching' },
              { name: 'Listening', value: 'Listening' },
              { name: 'Competing', value: 'Competing' },
              { name: 'Custom', value: 'Custom' }
            )
        )
        .addStringOption(opt =>
          opt.setName('text')
            .setDescription('Status text')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const lock = checkChannelLock(interaction);
    if (!lock.allowed) {
      return interaction.reply({ content: lock.message, ephemeral: true });
    }

    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: 'Only bot owners can change appearance.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    try {
      if (sub === 'image') {
        const attachment = interaction.options.getAttachment('image');
        if (!attachment.contentType?.startsWith('image/')) {
          return interaction.editReply('File must be an image.');
        }
        await interaction.client.user.setAvatar(attachment.url);
        return interaction.editReply({ content: 'Bot avatar updated.' });
      }

      if (sub === 'banner') {
        const attachment = interaction.options.getAttachment('image');
        if (!attachment.contentType?.startsWith('image/')) {
          return interaction.editReply('File must be an image.');
        }
        // Banner requires the bot to have the feature (or user has Nitro in some cases)
        await interaction.client.user.setBanner(attachment.url);
        return interaction.editReply({ content: 'Bot banner updated (if supported by Discord for this application).' });
      }

      if (sub === 'status') {
        const type = interaction.options.getString('type');
        const text = interaction.options.getString('text');
        const { ActivityType } = require('discord.js');
        const map = {
          Playing: ActivityType.Playing,
          Watching: ActivityType.Watching,
          Listening: ActivityType.Listening,
          Competing: ActivityType.Competing,
          Custom: ActivityType.Custom
        };
        await interaction.client.user.setActivity(text, { type: map[type] || ActivityType.Watching });
        return interaction.editReply({ content: `Status set to **${type}** \`${text}\`` });
      }
    } catch (err) {
      return interaction.editReply(`Failed: ${err.message}`);
    }
  }
};