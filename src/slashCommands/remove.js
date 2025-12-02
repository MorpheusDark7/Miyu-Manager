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
    .setName('remove')
    .setDescription('Remove a bot from the tracking list.')
    .addUserOption(option =>
      option
        .setName('bot')
        .setDescription('The bot to remove')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    try {
      const member = interaction.options.getMember('bot');
      const guild = interaction.guild;
      const client = interaction.client;

      const storedGuild = client.mongo ? await client.mongo.getGuild(guild) : null;

      if (!client.mongo) {
        return interaction.reply({
          content: `${EMOJIS.WARNING} Database is not configured. Set MONGO_URI to enable tracking.`,
          ephemeral: true
        });
      }

      const botPfp = client.user.displayAvatarURL({ extension: 'png', size: 128 });

      
      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      
      
      
      if (!storedGuild || !storedGuild.broadcastChannel) {
        response = {
          title: 'Remove Bot • Broadcast Channel Not Set',
          message: `${EMOJIS.NO_ENTRY} A broadcast channel is not defined.\nRun \`${client.config.prefix}channel #channel\` to set one.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      }

      
      
      
      else if (!member) {
        response = {
          title: 'Remove Bot • No Bot Provided',
          message:
            `${EMOJIS.WARNING} Mention a bot or provide bot ID to remove it.\n` +
            `Usage: \`${client.config.prefix}remove @bot\` or \`${client.config.prefix}remove <bot_id>\``,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      }

      
      
      
      else if (!isBot(member)) {
        response = createErrorResponse(
          'Remove Bot • Invalid Member',
          `${member} is not a bot. Please mention a valid bot.`
        );
      }

      
      
      
      else {
        const isTracked = storedGuild.trackedBots.some(b => b.id === member.id);

        if (!isTracked) {
          response = {
            title: 'Remove Bot • Not Tracked',
            message: `${EMOJIS.INFO} ${member} is not in the tracking list.`,
            color: BOT_CONFIG.EMBED_COLORS.PRIMARY
          };
        } else {
          
          await client.mongo.removeTrackedBot(member);

          response = createSuccessResponse(
            'Remove Bot',
            `Successfully removed ${member} from the tracking list.`
          );

          logger.info(
            `Removed bot ${member.id} (${member.user.tag}) from guild ${guild.id}.`
          );
        }
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
      logger.error(`Failed to execute remove slash command: ${error.stack || error.message}`);

      const err = createErrorResponse(
        'Remove Bot',
        'Failed to remove bot. Please try again later.'
      );

      const errorContainer = new ContainerBuilder()
        .setAccentColor(err.color)
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 }))
                .setDescription('Miyu Manager Icon')
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${err.title}`),
              new TextDisplayBuilder().setContent(err.message)
            )
        );

      if (!interaction.replied) {
        return interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }
  }
};
