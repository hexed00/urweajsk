function checkPermission(userId, guildOwnerId) {
  const ownerIds = (process.env.OWNER_IDS || '').split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  return ownerIds.includes(userId) || userId === guildOwnerId;
}

module.exports = { checkPermission };
