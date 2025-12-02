const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const LavalinkStatusBroadcaster = require('../classes/LavalinkStatusBroadcaster');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`✅ Logged in as ${client.user.tag}`);

    await client.slashCommandHandler.registerCommands();

    client.slashCommands = client.slashCommandHandler.getAllCommands();

    if (client.mongo) {
      try {
        await client.mongo.registerConnectionEvents().registerDefaultEvents();
        await client.mongo.initialize(client.guilds.cache);
      } catch (err) {
        logger.error('Failed to initialize MongoDB:', err);
      }
    } else {
      logger.warn('MongoDB is not configured; skipping DB initialization.');
    }

    const presenceStatuses = [
      { name: `${client.config.prefix}help | Manager of Miyu Development`, type: ActivityType.Watching },
      { name: 'Miyu Development', type: ActivityType.Watching },
      { name: 'miyudevelopment.online', type: ActivityType.Watching }
    ];

    await client.user.setPresence({ activities: [presenceStatuses[0]], status: 'dnd' });

    let _presenceIndex = 0;
    client.presenceRotator = setInterval(async () => {
      try {
        _presenceIndex = (_presenceIndex + 1) % presenceStatuses.length;
        await client.user.setPresence({
          activities: [presenceStatuses[_presenceIndex]],
          status: 'dnd'
        });
      } catch (err) {
        logger.error('Failed to rotate presence:', err);
      }
    }, client.config.presence_refresh_interval);

    logger.info(`Bot ready and tracking ${client.guilds.cache.size} guild(s).`);
    logger.info(`Lavalink Channel ID: ${client.config.lavalinkbroadcastchannelId}`);

    const lavalinkBroadcaster = new LavalinkStatusBroadcaster(client, {
      channelId: client.config.lavalinkbroadcastchannelId,
      interval: client.config.lavalink_status_interval
    });

    lavalinkBroadcaster.start();
    client.lavalinkBroadcaster = lavalinkBroadcaster;

    const voiceChannelId = client.config.voice_channel_id;
    const voiceStatusText = client.config.voice_status_text;

    if (voiceChannelId) {
      try {
        const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
        const channel =
          client.channels.cache.get(voiceChannelId) ||
          (await client.channels.fetch(voiceChannelId).catch(() => null));

        if (channel && channel.guild && channel.joinable !== false && channel.type) {
          const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
          });

          client.voiceConnection = connection;

          try {
            await entersState(connection, VoiceConnectionStatus.Ready, 15000);
            logger.info('Joined configured voice channel');
          } catch (e) {
            logger.warn('Voice connection not ready:', e?.message || e);
          }

          // Update voice channel status ONLY (no bot presence change)
          try {
            await client.voiceStatusManager.updateVoiceStatus(voiceChannelId, voiceStatusText);
            logger.info('Voice channel status set successfully');
          } catch (e) {
            logger.warn('Failed to set voice channel status:', e?.message || e);
          }

          // >>> Presence stays controlled by presenceRotator <<<
          // No presence override. No rotator stop.
        } else {
          logger.warn('Configured voice channel not found or not joinable. Skipping auto-join.');
        }
      } catch (err) {
        logger.warn('Voice auto-join skipped: @discordjs/voice missing or error:', err?.message || err);
      }
    }
  }
};
