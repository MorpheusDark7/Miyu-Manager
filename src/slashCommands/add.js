const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');

const { BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');
const {
  createErrorResponse,
  createSuccessResponse,
  isBot,
  getCurrentTimestamp
} = require('../utils');

const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Track a new bot.')
    .addUserOption(option =>
      option
        .setName('bot')
        .setDescription('Mention the bot you want to track')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    try {
      const member = interaction.options.getMember('bot');
      const guild = interaction.guild;

      if (!interaction.client.mongo) {
        return interaction.reply({
          content: `${EMOJIS.WARNING} Database is not configured. Set the MONGO_URI to enable tracking.`,
          ephemeral: true
        });
      }

      const storedGuild = await interaction.client.mongo.getGuild(guild);
      const botPfp = interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      
      if (!storedGuild || !storedGuild.broadcastChannel) {
        response = {
          title: 'Add Bot • Broadcast Channel Not Set',
          message: `${EMOJIS.NO_ENTRY} A broadcast channel is not defined.\nRun \`${interaction.client.config.prefix}channel #channel\` to set one.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      }

      
      else if (!isBot(member)) {
        response = {
          title: 'Add Bot • Invalid User',
          message: `${EMOJIS.ERROR} The user ${member} is not a bot. Only bots can be tracked.`,
          color: BOT_CONFIG.EMBED_COLORS.ERROR
        };
      }

      
      else if (storedGuild.trackedBots.some(b => b.id === member.id)) {
        response = {
          title: 'Add Bot • Already Tracked',
          message: `${EMOJIS.INFO} The bot ${member} is already being tracked.`,
          color: BOT_CONFIG.EMBED_COLORS.PRIMARY
        };
      }

    
      else {
        await interaction.client.mongo.addTrackedBot(member);
        response = createSuccessResponse('Add Bot', `Successfully added ${member} to the tracking list.`);
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
          new TextDisplayBuilder().setContent(
            `Reported by **Miyu Manager** • <t:${getCurrentTimestamp()}:R>`
          )
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error('Failed to execute add slash command:', error);

      const errorResponse = createErrorResponse(
        'Add Bot',
        'Failed to add bot. Please try again later.'
      );

      const errorContainer = new ContainerBuilder()
        .setAccentColor(errorResponse.color)
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 }))
                .setDescription('Miyu Manager Icon')
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${errorResponse.title}`),
              new TextDisplayBuilder().setContent(errorResponse.message)
            )
        );

      if (!interaction.replied) {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: false
        });
      }
    }
  }
};
