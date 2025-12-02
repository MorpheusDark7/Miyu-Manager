const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const { BOT_CONFIG } = require('../../config/constants');
const EMOJIS = require('../../config/emojis');
const logger = require('../../utils/logger');


function getPingStyle(value) {
  if (value <= 100) return ButtonStyle.Success;
  if (value <= 200) return ButtonStyle.Primary;
  if (value <= 400) return ButtonStyle.Secondary;
  return ButtonStyle.Danger;
}

module.exports = {
  name: 'ping',
  aliases: ['p', 'latency'],
  description: 'Check the bot\'s latency and API response time.',
  emoji: EMOJIS.PING,
  group: 'misc',
  guildOnly: true,
  userPermissions: null,
  ownerOverride: false,
  async run(message) {
    try {
      const wsPing = Math.round(message.client.ws.ping);
      const sentTimestamp = Date.now();
      const tempMsg = await message.channel.send({
        content: 'Pinging...',
        flags: MessageFlags.SuppressEmbeds
      });
      const apiLatency = Date.now() - sentTimestamp;

      const container = new ContainerBuilder()
        .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`# Miyu Manager Ping\n**Pong! Here are the latency details:**`)
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

      await tempMsg.edit({
        content: null,
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      logger.error('Failed to execute ping command:', error);
      await message.channel.send({
        content: `${EMOJIS.ERROR} Failed to display ping. Please try again later.`
      });
    }
  }
};