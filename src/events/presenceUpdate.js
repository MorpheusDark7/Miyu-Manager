const logger = require('../utils/logger');

module.exports = {
  name: 'presenceUpdate',
  async execute(oldPresence, newPresence, client) {
    if (!newPresence || !newPresence.user || !newPresence.user.bot) return;

    const botMember = newPresence.member;
    let storedGuild = null;
    if (!client.mongo) {
      logger.debug('MongoDB not configured; skipping presence tracking.');
      return;
    }

    try {
      storedGuild = await client.mongo.getGuild(botMember.guild);
    } catch (err) {
      logger.error('Failed to fetch guild from DB during presenceUpdate:', err);
      return;
    }
    
    if (!storedGuild) return;

    const isTracked = storedGuild.trackedBots?.some(b => b.id === botMember.id);
    if (!isTracked) {
      logger.debug(`Untracked bot ${botMember.displayName} in ${botMember.guild.name}, skipping status update.`);
      return;
    }

    const oldStatus = oldPresence?.status || 'offline';
    const newStatus = newPresence.status;

    await client.statusBroadcaster.broadcastStatusChange(storedGuild, botMember, {
      old: oldStatus,
      new: newStatus
    });
  }
};