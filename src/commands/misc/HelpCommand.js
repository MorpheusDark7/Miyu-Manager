const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags
} = require('discord.js');

const { BOT_CONFIG } = require('../../config/constants');
const EMOJIS = require('../../config/emojis');

module.exports = {
  name: 'help',
  aliases: ['h'],
  description: 'Display a help message with all the available commands.',
  emoji: EMOJIS.HELP,
  group: 'misc',
  guildOnly: true,

  async run(message) {
    try {
      const prefix = message.client.config.prefix;
      const botPfp = message.client.user.displayAvatarURL({ extension: 'png', size: 256 });

      const container = new ContainerBuilder()
        .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)

        
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# Miyu Manager Help`),
              new TextDisplayBuilder().setContent(
                `Here's a list of all available commands for **Miyu Manager**. Use these to manage and monitor your server with ease!`
              )
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(botPfp).setDescription('Miyu Manager Icon')
            )
        )

        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        )

       
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.CHANNEL} **Tracker Commands**\n` +
            `- **${EMOJIS.ADD} \`${prefix}add\`** Track a new bot.\n` +
            `- **${EMOJIS.BROADCAST} \`${prefix}channel\`** Set broadcast channel.\n` +
            `- **${EMOJIS.LIST} \`${prefix}list\`** List tracked bots.\n` +
            `- **${EMOJIS.REMOVE} \`${prefix}remove\`** Remove a tracked bot.`
          )
        )

        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        )

        
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.BROADCAST} **Lavalink Commands**\n` +
            `- **${EMOJIS.BROADCAST} \`${prefix}lavalinkChannel\`** Set Lavalink stats broadcast channel.`
          )
        )

        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        )

        
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.CHANNEL} **Miscellaneous Commands**\n` +
            `- **${EMOJIS.HELP} \`${prefix}help\`** Show help message.\n` +
            `- **${EMOJIS.PING} \`${prefix}ping\`** Check bot latency.\n` +
            `- **${EMOJIS.WEBSITE || "🌐"} \`${prefix}website\`** Show Miyu Development website link.` // ⭐ Added
          )
        );

      await message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      console.error(`[ERROR] Help command failed:`, error);
      await message.channel.send(`${EMOJIS.ERROR} Failed to show help.`);
    }
  }
};
