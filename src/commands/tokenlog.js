const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('token')
    .setDescription('Token management')
    .addSubcommand(sub =>
      sub
        .setName('log')
        .setDescription('Add tokens (paste or upload .txt)')
        .addStringOption(opt => opt.setName('tokens').setDescription('Paste tokens here').setRequired(false))
        .addAttachmentOption(opt => opt.setName('file').setDescription('Upload .txt file').setRequired(false))
    )
    .addSubcommand(sub => sub.setName('count').setDescription('Show token count'))
    .addSubcommand(sub => sub.setName('preview').setDescription('Preview first tokens (masked)'))
    .addSubcommand(sub => sub.setName('clear').setDescription('Clear all tokens (owner only)'))
    .addSubcommand(sub => sub.setName('output').setDescription('Download tokens as .txt')),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'log') {
      const tokensInput = interaction.options.getString('tokens');
      const file = interaction.options.getAttachment('file');

      let tokens = [];

      if (tokensInput) {
        tokens = tokensInput.split('\n');
      } else if (file) {
        if (!file.name.endsWith('.txt')) {
          return interaction.reply({ content: '❌ File must be .txt', ephemeral: true });
        }
        try {
          const response = await fetch(file.url);
          const text = await response.text();
          tokens = text.split('\n');
        } catch (error) {
          return interaction.reply({ content: '❌ Could not read file', ephemeral: true });
        }
      } else {
        return interaction.reply({ content: '❌ Provide tokens or file', ephemeral: true });
      }

      const count = client.tokenManager.add(tokens);
      await interaction.reply({
        content: `✓ Added ${count} tokens\nTotal: ${client.tokenManager.getCount()}`,
        ephemeral: true,
      });
    }

    if (subcommand === 'count') {
      const count = client.tokenManager.getCount();
      await interaction.reply({
        content: `📊 Token count: **${count}**`,
        ephemeral: true,
      });
    }

    if (subcommand === 'preview') {
      const preview = client.tokenManager.getPreview(10);
      const text = preview.join('\n') || '_No tokens_';
      await interaction.reply({
        content: `**Preview (first 10):**\n\`\`\`\n${text}\n\`\`\``,
        ephemeral: true,
      });
    }

    if (subcommand === 'clear') {
      client.tokenManager.clear();
      await interaction.reply({
        content: '✓ All tokens cleared',
        ephemeral: true,
      });
    }

    if (subcommand === 'output') {
      const buffer = client.tokenManager.export();
      const attachment = new AttachmentBuilder(buffer, { name: 'tokens.txt' });
      await interaction.reply({
        files: [attachment],
        ephemeral: true,
      });
    }
  },
};
