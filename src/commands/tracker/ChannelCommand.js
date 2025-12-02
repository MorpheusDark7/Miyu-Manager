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
  name: 'channel',
  aliases: ['c'],
  description: 'Define the channel to broadcast downtime messages to. Mention a text channel to set it.',
  emoji: EMOJIS.BROADCAST,
  group: 'tracker',
  guildOnly: true,
  userPermissions: PermissionsBitField.Flags.ManageGuild,
  ownerOverride: false,
  async run(message) {
    try {
      const channel = message.mentions.channels.first();
      const storedGuild = message.client.mongo ? await message.client.mongo.getGuild(message.guild) : null;

      if (!message.client.mongo) {
        return message.channel.send({ content: `${EMOJIS.WARNING} Database is not configured. Set the MONGO_URI environment variable to enable the broadcast channel feature.` });
      }
      const botPfp = message.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      if (!channel) {
        if (!storedGuild || !storedGuild.broadcastChannel) {
          response = {
            title: 'Broadcast Channel Not Set',
            message: `${EMOJIS.NO_ENTRY} No broadcast channel defined.\nRun \`${message.client.config.prefix}channel #channel\` to set one.`,
            color: BOT_CONFIG.EMBED_COLORS.WARNING
          };
        } else {
          const currentChannel = message.guild.channels.cache.get(storedGuild.broadcastChannel);
          if (!currentChannel) {
            response = {
              title: 'Broadcast Channel Missing',
              message: `${EMOJIS.WARNING} The stored broadcast channel no longer exists.\nPlease mention a new channel to set.`,
              color: BOT_CONFIG.EMBED_COLORS.WARNING
            };
          } else {
            response = {
              title: 'Current Broadcast Channel',
              message: `${EMOJIS.BROADCAST} The broadcast channel is currently set to ${currentChannel}.`,
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
        await message.client.mongo.updateBroadcastChannel(channel);
        response = createSuccessResponse('Broadcast Channel Updated', `Successfully set the broadcast channel to ${channel}.`);
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
      logger.error(`Failed to execute channel command: ${error.stack || error.message}`);
      const errorResponse = createErrorResponse('Error', 'Failed to set broadcast channel. Please try again later.');
      
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