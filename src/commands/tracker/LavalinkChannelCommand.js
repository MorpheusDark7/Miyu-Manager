const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionsBitField,
  ChannelType,
  MessageFlags
} = require('discord.js');
const { BOT_CONFIG } = require('../../config/constants');
const EMOJIS = require('../../config/emojis');
const { createErrorResponse, createSuccessResponse, getCurrentTimestamp } = require('../../utils');
const logger = require('../../utils/logger');

module.exports = {
  name: 'lavalinkChannel',
  aliases: ['lc', 'lavachannel'],
  description: 'Define the channel to broadcast Lavalink node stats to. Mention a text channel to set it.',
  emoji: EMOJIS.BROADCAST,
  group: 'tracker',
  guildOnly: true,
  userPermissions: PermissionsBitField.Flags.ManageGuild,
  ownerOverride: false,
  async run(message) {
    try {
      const channel = message.mentions.channels.first();
      const botPfp = message.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      if (!channel) {
        const currentChannelId = message.client.config.lavalinkbroadcastchannelId;
        if (!currentChannelId) {
          response = {
            title: 'Lavalink Broadcast Channel Not Set',
            message: `${EMOJIS.NO_ENTRY} No Lavalink broadcast channel defined.\nRun \`${message.client.config.prefix}lavalinkChannel #channel\` to set one.`,
            color: BOT_CONFIG.EMBED_COLORS.WARNING
          };
        } else {
          const currentChannel = message.guild.channels.cache.get(currentChannelId);
          if (!currentChannel) {
            response = {
              title: 'Lavalink Broadcast Channel Missing',
              message: `${EMOJIS.WARNING} The stored Lavalink broadcast channel no longer exists.\nPlease mention a new channel to set.`,
              color: BOT_CONFIG.EMBED_COLORS.WARNING
            };
          } else {
            response = {
              title: 'Current Lavalink Broadcast Channel',
              message: `${EMOJIS.BROADCAST} The Lavalink broadcast channel is currently set to ${currentChannel}.`,
              color: BOT_CONFIG.EMBED_COLORS.PRIMARY
            };
          }
        }
      } else if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
        response = createErrorResponse('Invalid Channel Type', 'The specified channel is not a text or news channel.');
      } else if (!channel.viewable) {
        response = {
          title: 'Channel Not Accessible',
          message: `${EMOJIS.WARNING} I cannot see the specified channel. Please check my permissions.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      } else {
        
        message.client.config.lavalinkbroadcastchannelId = channel.id;
        
        
        if (message.client.lavalinkBroadcaster) {
          message.client.lavalinkBroadcaster.stop();
          const LavalinkStatusBroadcaster = require('../../classes/LavalinkStatusBroadcaster');
          const broadcaster = new LavalinkStatusBroadcaster(message.client, {
            channelId: channel.id,
            interval: 60000
          });
          broadcaster.start();
          message.client.lavalinkBroadcaster = broadcaster;
        }

        response = createSuccessResponse('Lavalink Broadcast Channel Updated', `Successfully set the Lavalink broadcast channel to ${channel}.`);
        logger.info(`Lavalink broadcast channel updated to ${channel.id} in guild ${message.guild.id}.`);
      }

      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${response.title}`),
        new TextDisplayBuilder().setContent(response.message)
      );

      container
        .addSectionComponents(section)
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Updated by **Miyu Manager** • <t:${getCurrentTimestamp()}:R>`)
        );

      return message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error(`Failed to execute lavalinkChannel command: ${error.stack || error.message}`);
      const errorResponse = createErrorResponse('Error', 'Failed to set Lavalink broadcast channel. Please try again later.');
      
      const errorContainer = new ContainerBuilder()
        .setAccentColor(errorResponse.color)
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(message.client.user.displayAvatarURL({ extension: 'png', size: 128 }))
                .setDescription('Miyu Manager Icon')
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${errorResponse.title}`),
              new TextDisplayBuilder().setContent(errorResponse.message)
            )
        );

      return message.channel.send({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }
  }
};
