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
    .setName('lavalinkchannel')
    .setDescription('Define the channel to broadcast Lavalink node stats.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select the Lavalink broadcast channel')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const client = interaction.client;
      const guild = interaction.guild;

      const botPfp = client.user.displayAvatarURL({ extension: 'png', size: 128 });

      
      const container = new ContainerBuilder().setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY);
      const section = new SectionBuilder().setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL(botPfp)
          .setDescription('Miyu Manager Icon')
      );

      let response;

      
      
      
      if (!channel) {
        const currentChannelId = client.config.lavalinkbroadcastchannelId;

        if (!currentChannelId) {
          response = {
            title: 'Lavalink Broadcast Channel Not Set',
            message: `${EMOJIS.NO_ENTRY} No Lavalink broadcast channel defined.\nRun \`${client.config.prefix}lavalinkChannel #channel\` to set one.`,
            color: BOT_CONFIG.EMBED_COLORS.WARNING
          };
        } else {
          const current = guild.channels.cache.get(currentChannelId);

          if (!current) {
            response = {
              title: 'Lavalink Broadcast Channel Missing',
              message: `${EMOJIS.WARNING} The stored Lavalink broadcast channel no longer exists.\nPlease select a new one.`,
              color: BOT_CONFIG.EMBED_COLORS.WARNING
            };
          } else {
            response = {
              title: 'Current Lavalink Broadcast Channel',
              message: `${EMOJIS.BROADCAST} The Lavalink broadcast channel is currently set to ${current}.`,
              color: BOT_CONFIG.EMBED_COLORS.PRIMARY
            };
          }
        }
      }

      
      
      
      else if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
        response = createErrorResponse(
          'Invalid Channel Type',
          'The specified channel is not a text or announcement channel.'
        );
      }

      
      
      
      else if (!channel.viewable) {
        response = {
          title: 'Channel Not Accessible',
          message: `${EMOJIS.WARNING} I cannot see the selected channel. Check my permissions.`,
          color: BOT_CONFIG.EMBED_COLORS.WARNING
        };
      }

      
      
      
      else {
        
        client.config.lavalinkbroadcastchannelId = channel.id;

        
        if (client.lavalinkBroadcaster) {
          client.lavalinkBroadcaster.stop();

          const LavalinkStatusBroadcaster = require('../classes/LavalinkStatusBroadcaster');
          const broadcaster = new LavalinkStatusBroadcaster(client, {
            channelId: channel.id,
            interval: 60000
          });

          broadcaster.start();
          client.lavalinkBroadcaster = broadcaster;
        }

        response = createSuccessResponse(
          'Lavalink Broadcast Channel Updated',
          `Successfully set the Lavalink broadcast channel to ${channel}.`
        );

        logger.info(
          `Lavalink broadcast channel updated to ${channel.id} in guild ${guild.id}.`
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
      logger.error(
        `Failed to execute lavalinkchannel slash command: ${error.stack || error.message}`
      );

      const errorResponse = createErrorResponse(
        'Error',
        'Failed to set Lavalink broadcast channel. Please try again later.'
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
          flags: MessageFlags.IsComponentsV2
        });
      }
    }
  }
};
