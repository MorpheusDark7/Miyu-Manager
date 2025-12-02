const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const { BOT_CONFIG } = require('../config/constants');
const EMOJIS = require('../config/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('website')
    .setDescription('Show Miyu Development website link'),

  async execute(interaction) {
    try {
      const botPfp = interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 });

      const websiteButton = new ButtonBuilder()
        .setLabel("Visit Website")
        .setEmoji(EMOJIS.WEBSITE || "🌐")
        .setStyle(ButtonStyle.Link)
        .setURL("https://miyudevelopment.online");

      const container = new ContainerBuilder()
        .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(botPfp).setDescription("Miyu Manager Icon")
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${EMOJIS.WEBSITE || "🌐"} Miyu Development`),
              new TextDisplayBuilder().setContent("**Official website**")
            )
            .setButtonAccessory(websiteButton) 
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("`https://miyudevelopment.online`")
        );

      await interaction.reply({
        components: [container],
        flags: [MessageFlags.IsComponentsV2]
      });

    } catch (err) {
      console.error("Failed to execute website slash command:", err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "Failed to show website.",
          ephemeral: true
        });
      }
    }
  }
};
