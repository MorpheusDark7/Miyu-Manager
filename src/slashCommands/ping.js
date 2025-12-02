const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');

const { BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');
const logger = require('../utils/logger');


function getPingStyle(value) {
  if (value <= 100) return ButtonStyle.Success;
  if (value <= 200) return ButtonStyle.Primary;
  if (value <= 400) return ButtonStyle.Secondary;
  return ButtonStyle.Danger;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API response time.'),

  async execute(interaction) {
    try {
      const wsPing = Math.round(interaction.client.ws.ping);
      const apiLatency = Date.now() - interaction.createdTimestamp;
      const botPfp = interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const container = new ContainerBuilder()
        .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# Miyu Manager Ping\n**Pong! Here are the latency details:**`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**WebSocket Ping:**`)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId('noop_ws')
                .setLabel(`${wsPing}ms`)
                .setStyle(getPingStyle(wsPing))
                .setDisabled(true)
            )
        )
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**API Latency:**`)
            )
            .setButtonAccessory(
              new ButtonBuilder()
                .setCustomId('noop_api')
                .setLabel(`${apiLatency}ms`)
                .setStyle(getPingStyle(apiLatency))
                .setDisabled(true)
            )
        );

      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error('Failed to execute slash ping command:', error);

      if (!interaction.replied) {
        await interaction.reply({
          content: `${EMOJIS.ERROR} Failed to display ping.`,
          ephemeral: true
        });
      }
    }
  }
};
