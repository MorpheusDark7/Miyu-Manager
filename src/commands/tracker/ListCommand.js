const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
  PermissionsBitField
} = require('discord.js');
const { BOT_CONFIG } = require('../../config/constants');
const EMOJIS = require('../../config/emojis');

module.exports = {
  name: 'list',
  aliases: ['l'],
  description: 'List the bots that are currently being tracked.',
  emoji: EMOJIS.LIST,
  group: 'tracker',
  guildOnly: true,
  userPermissions: PermissionsBitField.Flags.ManageGuild,
  ownerOverride: false,

  async run(message) {
    try {
      const storedGuild = message.client.mongo ? await message.client.mongo.getGuild(message.guild) : null;
      const botPfp = message.client.user.displayAvatarURL({ extension: 'png', size: 256 });

      const container = new ContainerBuilder()
        .setAccentColor(BOT_CONFIG.EMBED_COLORS.PRIMARY)

        
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# Miyu Manager • Tracked Bots`),
              new TextDisplayBuilder().setContent(`*List of bots currently being tracked in* \n**${message.guild.name}**:`)
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder()
                .setURL(botPfp)
                .setDescription('Miyu Manager Icon')
            )
        )

        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
        );

      if (!storedGuild || !storedGuild.broadcastChannel) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.NO_ENTRY} **No broadcast channel set.**\nRun \`${message.client.config.prefix}channel #channel\` to set one.`
          )
        );
      } else if (storedGuild.trackedBots.length < 1) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.INFO} **No bots are currently being tracked.**`
          )
        );
      } else {
       
        storedGuild.trackedBots.forEach((bot, index) => {
          const member = message.guild.members.cache.get(bot.id);
          const displayName = member ? `${EMOJIS.AUTOMOD} ${member.user.tag}` : `❓ Unknown Bot`;

          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`\`${index + 1}.\` ${displayName} (\`${bot.id}\`)`)
          );
        });

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJIS.WEBSITE} **Broadcast Channel:** <#${storedGuild.broadcastChannel}>`
          )
        );
      }

      await message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      console.error('[ERROR] Failed to execute list:', error);
      await message.channel.send({
        content: `${EMOJIS.ERROR} Failed to display tracked bots. Please try again later.`
      });
    }
  }
};