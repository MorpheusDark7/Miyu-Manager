const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const { formatTimeDelta, getCurrentTimestamp } = require('../utils');
const { PRESENCE_STATUS, BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');
const logger = require('../utils/logger');

class StatusBroadcaster {
  constructor(client) {
    this.client = client;
  }

  async broadcastStatusChange(storedGuild, botMember, status) {
    const info = this._prepareStatusChange(storedGuild, botMember, status);
    if (!info) return;

    const channel = botMember.guild.channels.cache.get(storedGuild.broadcastChannel);
    if (!channel) return;

    try {
      await this.client.mongo.updateLastOnline(botMember, info.newLastOnline);

      const roleMention = `<@&${this.client.config.notification_role_id || BOT_CONFIG.DEFAULT_NOTIFICATION_ROLE_ID}>`;

      const container = new ContainerBuilder()
        .setAccentColor(info.color)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${botMember.user.username} Status Update`),
              new TextDisplayBuilder().setContent(`${roleMention}\n${info.message}`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(botMember.user.displayAvatarURL({ extension: 'png', size: 128 }))
                .setDescription(`${botMember.user.username} Avatar`)
            )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Reported by **Miyu Manager** • <t:${getCurrentTimestamp()}:R>`)
        );

      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (err) {
      logger.error('Failed to send broadcast message:', err);
      this._handleBroadcastError(err, botMember);
    }
  }

  _prepareStatusChange(storedGuild, botMember, status) {
    if (this._wasBotOnline(status)) {
      return {
        message: `${EMOJIS.OFFLINE} **${botMember} is now offline.**`,
        newLastOnline: new Date(),
        color: BOT_CONFIG.EMBED_COLORS.ERROR
      };
    }

    if (this._wasBotOffline(status)) {
      const storedBot = storedGuild.trackedBots.find(b => b.id === botMember.id);
      if (storedBot?.lastOnline) {
        const offlineTime = Date.now() - storedBot.lastOnline;
        return {
          message: `${EMOJIS.ONLINE} **${botMember} is back online! Offline for ${formatTimeDelta(offlineTime)}**`,
          newLastOnline: null,
          color: BOT_CONFIG.EMBED_COLORS.SUCCESS
        };
      }

      return {
        message: `${EMOJIS.ONLINE} **${botMember} is online!**`,
        newLastOnline: null,
        color: BOT_CONFIG.EMBED_COLORS.SUCCESS
      };
    }

    return null;
  }

  _handleBroadcastError(error, botMember) {
    const guild = botMember.guild;
    const botName = botMember.displayName;
    const errorMsg = `Error broadcasting for ${botName} in ${guild.name}: ${error?.stack || error?.message || error}`;
    this.client.emit('broadcastError', guild, error, errorMsg);
  }

  _wasBotOnline(status) {
    return status.old !== PRESENCE_STATUS.offline && status.new === PRESENCE_STATUS.offline;
  }

  _wasBotOffline(status) {
    return status.old === PRESENCE_STATUS.offline && status.new !== PRESENCE_STATUS.offline;
  }
}

module.exports = StatusBroadcaster;