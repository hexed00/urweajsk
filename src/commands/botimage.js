const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Bot customization')
    .addSubcommand(sub =>
      sub
        .setName('image')
        .setDescription('Change bot avatar')
        .addAttachmentOption(opt => opt.setName('image').setDescription('Image file').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('banner')
        .setDescription('Change bot banner')
        .addAttachmentOption(opt => opt.setName('image').setDescription('Image file').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Set bot status/activity')
        .addStringOption(opt =>
          opt
            .setName('type')
            .setDescription('Activity type')
            .setRequired(true)
            .addChoices(
              { name: 'Playing', value: 'PLAYING' },
              { name: 'Watching', value: 'WATCHING' },
              { name: 'Listening', value: 'LISTENING' },
              { name: 'Competing', value: 'COMPETING' }
            )
        )
        .addStringOption(opt => opt.setName('text').setDescription('Activity text').setRequired(true))
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'image') {
      const attachment = interaction.options.getAttachment('image');
      try {
        const response = await fetch(attachment.url);
        const buffer = await response.buffer();
        await client.user.setAvatar(buffer);
        await interaction.reply({ content: '✓ Avatar updated', ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    }

    if (subcommand === 'banner') {
      const attachment = interaction.options.getAttachment('image');
      try {
        const response = await fetch(attachment.url);
        const buffer = await response.buffer();
        await client.user.setBanner(buffer);
        await interaction.reply({ content: '✓ Banner updated', ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    }

    if (subcommand === 'status') {
      const type = interaction.options.getString('type');
      const text = interaction.options.getString('text');
      try {
        client.user.setActivity(text, { type });
        await interaction.reply({ content: `✓ Status set to "${text}"`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    }
  },
};
