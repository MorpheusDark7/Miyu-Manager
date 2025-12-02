const { REST } = require('@discordjs/rest');
const { ChannelType } = require('discord.js');

class VoiceStatusManager {
  constructor(client) {
    this.client = client;
    this.rest = new REST({ version: '10' }).setToken(client.config.token);
    this.updateQueue = new Map(); 
  }

  /**
   *
   * @param {string} voiceChannelId 
   * @returns {boolean} 
   */
  async supportsVoiceStatus(voiceChannelId) {
    try {
      
      if (!voiceChannelId || typeof voiceChannelId !== 'string') return false;
      
      const channel = this.client.channels.cache.get(voiceChannelId);
      if (!channel) return false;
      
      
      return channel.type !== ChannelType.GuildStageVoice;
    } catch (error) {
      return false;
    }
  }

  /**
   * 
   * @param {string} title 
   * @returns {string} 
   */
  

  /**
   * 
   * @param {string|Object} voiceChannelId 
   * @returns {string|null} 
   */
  normalizeChannelId(voiceChannelId) {
    try {
      
      if (typeof voiceChannelId === 'string') {
        return voiceChannelId;
      }
      
     
      if (voiceChannelId && typeof voiceChannelId === 'object') {
        
        if (voiceChannelId.newChannelId) {
          return voiceChannelId.newChannelId;
        }
        if (voiceChannelId.oldChannelId) {
          return voiceChannelId.oldChannelId;
        }
        
        if (voiceChannelId.id) {
          return voiceChannelId.id;
        }
        
        if (voiceChannelId.channelId) {
          return voiceChannelId.channelId;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   * @param {string} status 
   */
  async updateVoiceStatus(voiceChannelId, status) {
    try {
     
      if (voiceChannelId === 'MOVED' || voiceChannelId === null || voiceChannelId === undefined) {
        return; 
      }

      
      if (voiceChannelId && typeof voiceChannelId === 'object' && 
          (voiceChannelId.oldChannelId || voiceChannelId.newChannelId)) {
        
        return;
      }

     
      const normalizedChannelId = this.normalizeChannelId(voiceChannelId);
      
      if (!normalizedChannelId) {
        return; 
      }

    
      if (this.updateQueue.has(normalizedChannelId)) {
        return; 
      }

      this.updateQueue.set(normalizedChannelId, true);

      try {
        
        const supportsStatus = await this.supportsVoiceStatus(normalizedChannelId);
        if (!supportsStatus) {
          return; 
        }

        
        const channel = this.client.channels.cache.get(normalizedChannelId);
        if (!channel) {
          return; 
        }

        const botMember = channel.guild.members.me;
        if (!botMember) {
          return; 
        }

        
        const permissions = channel.permissionsFor(botMember);
        if (!permissions || !permissions.has(['ViewChannel', 'Connect'])) {
          return; 
        }
        
        await this.rest.put(`/channels/${normalizedChannelId}/voice-status`, {
          body: { status: status || "" }
        });

      } finally {
        
        this.updateQueue.delete(normalizedChannelId);
      }

    } catch (error) {
     
      if (error.status !== 200 && 
          !error.message.includes('50024') && 
          !error.message.includes('Unknown Channel') &&
          !error.message.includes('Missing Permissions') &&
          !error.message.includes('50013') && 
          !error.message.includes('50001')) { 
       
        console.log(`Voice status update failed for channel ${voiceChannelId}: ${error.message}`);
      }
    }
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   */
  async setIdleStatus(voiceChannelId) {
    await this.updateVoiceStatus(voiceChannelId, `${this.client.emoji?.Zabrina || '🤖'} /play to start playing music`);
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   * @param {Object} track 
   */
  async setPlayingStatus(voiceChannelId, track) {
    
    
    let text = null;
    if (!track) {
      text = 'Playing';
    } else if (typeof track === 'string') {
      text = track;
    } else if (typeof track === 'object' && track.text) {
      text = track.text;
    } else {
      text = 'Playing';
    }

    await this.updateVoiceStatus(voiceChannelId, `${this.client.emoji?.playing || '▶️'} ${text}`);
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   * @param {Object} track 
   */
  async setPausedStatus(voiceChannelId, track) {
    
    let text = null;
    if (!track) {
      text = 'Paused';
    } else if (typeof track === 'string') {
      text = track;
    } else if (typeof track === 'object' && track.text) {
      text = track.text;
    } else {
      text = 'Paused';
    }

    await this.updateVoiceStatus(voiceChannelId, `${this.client.emoji?.pause || '⏸️'} ${text}`);
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   * @param {string} stationName 
   */
  async setRadioStatus(voiceChannelId, stationName) {
    await this.updateVoiceStatus(voiceChannelId, `${this.client.emoji?.radio || '📻'} Radio: ${stationName}`);
  }

  /**
   * 
   * @param {string|Object} voiceChannelId 
   */
  async clearStatus(voiceChannelId) {
    await this.updateVoiceStatus(voiceChannelId, "");
  }

  /**
   *
   * @param {Object} player 
   * @returns {string|null} 
   */
  getVoiceChannelId(player) {
    try {
      if (!player || player.destroyed) {
        return null;
      }
      
     
      if (player.voiceId && typeof player.voiceId === 'string') {
        return player.voiceId;
      }
      
      
      const connection = player.node?.manager?.connections?.get(player.guildId);
      return connection?.channelId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 
   */
  cleanupQueue() {
    
    if (this.updateQueue.size > 50) {
      this.updateQueue.clear();
    }
  }
}

module.exports = VoiceStatusManager;
