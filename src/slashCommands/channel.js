const {
  SlashCommandBuilder,
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

const { BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');
const {
  createErrorResponse,
  createSuccessResponse,
  getCurrentTimestamp
} = require('../utils');

const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Define the channel to broadcast downtime messages.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select the broadcast channel')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    try {
      const selectedChannel = interaction.options.getChannel('channel');
      const client = interaction.client;

      if (!client.mongo) {
        return interaction.reply({
          content: `${EMOJIS.WARNING} Database is not configured. Set MONGO_URI to enable broadcast tracking.`,
          ephemeral: true
        });
      }

      const guild = interaction.guild;
      const storedGuild = await client.mongo.getGuild(guild);

      const botPfp = client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      
      if (!selectedChannel) {
        if (!storedGuild || !storedGuild.broadcastChannel) {
          response = {
            title: 'Broadcast Channel Not Set',
            message: `${EMOJIS.NO_ENTRY} No broadcast channel defined.\nRun \`${client.config.prefix}channel #channel\` to set one.`,
            color: BOT_CONFIG.EMBED_COLORS.WARNING
          };
        } else {
          const current = guild.channels.cache.get(storedGuild.broadcastChannel);

          if (!current) {
            response = {
              title: 'Broadcast Channel Missing',
              message: `${EMOJIS.WARNING} The stored broadcast channel no longer exists.\nPlease select a new one.`,
              color: BOT_CONFIG.EMBED_COLORS.WARNING
            };
          } else {
            response = {
              title: 'Current Broadcast Channel',
              message: `${EMOJIS.BROADCAST} The broadcast channel is currently set to ${current}.`,
              color: BOT_CONFIG.EMBED_COLORS.PRIMARY
            };
          }
        }
      }

      
      else if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(selectedChannel.type)) {
        response = createErrorResponse(
          'Invalid Channel Type',
          'The specified channel is not a text or announcement channel.'
        );
      }

      
      else if (!selectedChannel.viewable) {
        response = {
          title: 'Channel Not Accessible',
          message: `${EMOJIS.WARNING} I cannot see the selected channel. Please check my permissions.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      }

      
      else {
        await client.mongo.updateBroadcastChannel(selectedChannel);
        response = createSuccessResponse(
          'Broadcast Channel Updated',
          `Successfully set the broadcast channel to ${selectedChannel}.`
        );
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
            `Updated by **Miyu Manager** • <t:${getCurrentTimestamp()}:R>`
          )
        );

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error(`Failed to execute channel slash command: ${error.stack || error.message}`);

      const errorResponse = createErrorResponse(
        'Error',
        'Failed to set broadcast channel. Please try again later.'
      );

      const errContainer = new ContainerBuilder()
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
          components: [errContainer],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }
  }
};
