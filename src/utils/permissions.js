/**
 * Permission helpers
 * - Owner IDs from env
 * - Locked channel enforcement
 * - Guild owner check for join commands
 */

function getOwnerIds() {
  const raw = process.env.OWNER_IDS || '';
  return raw.split(',').map(id => id.trim()).filter(Boolean);
}

function isOwner(userId) {
  const owners = getOwnerIds();
  if (owners.length === 0) return false;
  return owners.includes(String(userId));
}

function isGuildOwner(interaction) {
  if (!interaction.guild) return false;
  return interaction.guild.ownerId === interaction.user.id;
}

function canUseJoin(interaction) {
  // Owners always can
  if (isOwner(interaction.user.id)) return true;
  // Guild owner of the server the bot is in can use join
  if (isGuildOwner(interaction)) return true;
  return false;
}

function isLockedChannel(channelId) {
  const locked = process.env.LOCKED_CHANNEL_ID;
  if (!locked || locked.trim() === '') return true; // no lock = allowed everywhere
  return String(channelId) === String(locked.trim());
}

function checkChannelLock(interaction) {
  if (!isLockedChannel(interaction.channelId)) {
    return {
      allowed: false,
      message: `This command is locked to a specific channel. Current locked channel ID: \`${process.env.LOCKED_CHANNEL_ID}\``
    };
  }
  return { allowed: true };
}

module.exports = {
  getOwnerIds,
  isOwner,
  isGuildOwner,
  canUseJoin,
  isLockedChannel,
  checkChannelLock
};