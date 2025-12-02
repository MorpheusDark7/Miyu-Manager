const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');
const { BOT_CONFIG } = require('../../config/constants');
const EMOJIS = require('../../config/emojis');
const { createErrorResponse, createSuccessResponse, isBot, getCurrentTimestamp } = require('../../utils');
const logger = require('../../utils/logger');

module.exports = {
  name: 'add',
  aliases: ['a'],
  description: 'Track a new bot. Mention a bot or provide a bot ID to add it to the tracking list.',
  emoji: EMOJIS.ADD,
  group: 'tracker',
  guildOnly: true,
  userPermissions: PermissionsBitField.Flags.ManageGuild,
  ownerOverride: false,
  async run(message) {
    try {
      const args = message.content.split(/\s+/).slice(1);
      let member = message.mentions.members.first();

     
      if (!member && args.length > 0) {
        const botId = args[0].replace(/\D/g, '');
        if (botId) {
          try {
            member = await message.guild.members.fetch(botId).catch(() => null);
          } catch (e) {
           
          }
        }
      }

      const storedGuild = message.client.mongo ? await message.client.mongo.getGuild(message.guild) : null;

      if (!message.client.mongo) {
        return message.channel.send({ content: `${EMOJIS.WARNING} Database is not configured. Set the MONGO_URI environment variable to enable tracking.` });
      }
      const botPfp = message.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(botPfp)
            .setDescription('Miyu Manager Icon')
        );

      let response;

      if (!storedGuild || !storedGuild.broadcastChannel) {
        response = {
          title: 'Add Bot • Broadcast Channel Not Set',
          message: `${EMOJIS.NO_ENTRY} A broadcast channel is not defined.\nRun \`${message.client.config.prefix}channel #channel\` to set one.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      } else if (!member) {
        response = {
          title: 'Add Bot • No Bot Provided',
          message: `${EMOJIS.WARNING} Mention a bot or provide a bot ID to add it to the tracking list.\nUsage: \`${message.client.config.prefix}add @bot\` or \`${message.client.config.prefix}add <bot_id>\``,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      } else if (!isBot(member)) {
        response = {
          title: 'Add Bot • Invalid User',
          message: `${EMOJIS.ERROR} The user ${member} is not a bot. Only bots can be tracked.`,
          color: BOT_CONFIG.EMBED_COLORS.ERROR
        };
      } else {
        const isBotAlreadyTracked = storedGuild.trackedBots.some(b => b.id === member.id);
        if (isBotAlreadyTracked) {
          response = {
            title: 'Add Bot • Already Tracked',
            message: `${EMOJIS.INFO} The bot ${member} is already being tracked.`,
            color: BOT_CONFIG.EMBED_COLORS.PRIMARY
          };
        } else {
          await message.client.mongo.addTrackedBot(member);
          response = createSuccessResponse('Add Bot', `Successfully added ${member} to the tracking list.`);
        }
      }

      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${response.title}`),
        new TextDisplayBuilder().setContent(response.message)
      );

      container.addSectionComponents(section)
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Reported by **Miyu Manager** • <t:${getCurrentTimestamp()}:R>`)
        );

      return message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error('Failed to execute add command:', error);
      const errorResponse = createErrorResponse('Add Bot', 'Failed to add bot. Please try again later.');
      
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