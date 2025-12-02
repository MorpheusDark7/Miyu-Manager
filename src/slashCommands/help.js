const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  MessageFlags
} = require('discord.js');

const { BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands'),

  async execute(interaction) {
    const botPfp = interaction.client.user.displayAvatarURL({ extension: 'png', size: 256 });

    const container = new ContainerBuilder()
      .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)

      
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${EMOJIS.HELP} Miyu Manager Commands`),
            new TextDisplayBuilder().setContent(`Here are all available slash commands:`)
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(botPfp)
          )
      )

      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
      )

      
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${EMOJIS.CHANNEL} **Tracker Commands**\n` +
          `- **/add** Track a new bot.\n` +
          `- **/channel** Set broadcast channel.\n` +
          `- **/list** List tracked bots.\n` +
          `- **/remove** Remove tracked bot.`
        )
      )

      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
      )

      
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${EMOJIS.BROADCAST} **Lavalink Commands**\n` +
          `- **/lavalinkchannel** Set Lavalink stats broadcast channel.`
        )
      )

      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
      )

      
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${EMOJIS.PING} **Misc Commands**\n` +
          `- **/help** Show this help.\n` +
          `- **/ping** Check latency.\n` +
          `- **/website** Show the Miyu Development website link.` 
        )
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
