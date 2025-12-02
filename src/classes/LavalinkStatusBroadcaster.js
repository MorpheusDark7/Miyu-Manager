const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const EMOJIS = require('../config/emojis');

const DB_PATH = path.join(__dirname, '../db/lavalink_status.json');

class LavalinkStatusBroadcaster {
  constructor(client, options = {}) {
    this.client = client;
    this.channelId = options.channelId || client.config.lavalinkbroadcastchannelId;
    this.interval = options.interval || client.config.lavalink_status_interval || 60000;
    this.message = null;
    this.timer = null;
  }

  async start() {
    if (!this.channelId) {
      logger.error('No channel ID provided for LavalinkStatusBroadcaster');
      return;
    }

    const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
    if (!channel) {
      logger.error(`Invalid channel ID: ${this.channelId}`);
      return;
    }

    const stored = this._loadStored();
    if (stored?.messageId) {
      this.message = await channel.messages.fetch(stored.messageId).catch(() => null);
    }

    if (!this.message) {
      const embed = this._buildEmbed();
      this.message = await channel.send({ embeds: [embed] });
      this._saveStored(this.message.id);
    }

    this.timer = setInterval(() => this.update(), this.interval);
    logger.info('Lavalink status broadcaster started');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Lavalink status broadcaster stopped');
    }
  }

  async update() {
    if (!this.message) return;

    const embed = this._buildEmbed();
    try {
      await this.message.edit({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to update Lavalink status message:', err);
    }
  }

  _buildEmbed() {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Lavalink Node Stats')
      .setImage('https://cdn.discordapp.com/attachments/1380259212000759818/1387465097680650381/standard.gif')
      .setFooter({ text: `Auto-updating every ${Math.round(this.interval / 1000)} seconds` });

 
    const nodes = Array.from(this.client.shoukaku.nodes.values());
    
    
    logger.debug(`Found ${nodes.length} nodes in shoukaku`);
    
  
    for (let i = 0; i < nodes.length; i += 2) {
      const node1 = nodes[i];
      const node2 = nodes[i + 1];
      
      
      const field1 = this._buildNodeField(node1);
      
      if (node2) {
       
        const field2 = this._buildNodeField(node2);
        
       
        embed.addFields(
          { name: field1.name, value: field1.value, inline: true },
          { name: field2.name, value: field2.value, inline: true },
          { name: '\u200B', value: '\u200B', inline: true } 
        );
      } else {
        
        embed.addFields({ name: field1.name, value: field1.value, inline: true });
      }
    }


    embed.addFields({
      name: '\u200B',
      value: `Last updated <t:${Math.floor(Date.now() / 1000)}:R>`,
      inline: false
    });

    return embed;
  }

  _buildNodeField(node) {
    
    const stats = node.stats || {};
    const isConnected = node.state === 1; 
    const players = stats.players ?? 0;
    const playingPlayers = stats.playingPlayers ?? 0;
    
   
    logger.debug(`Node: ${node.name}, State: ${node.state}, Connected: ${isConnected}, Players: ${players}, Playing: ${playingPlayers}`);
    logger.debug(`Node stats:`, JSON.stringify(stats, null, 2));
    
    
    const isOnline = isConnected || players > 0;
    
    
    const value = 
      `${isOnline ? `${EMOJIS.ONLINE} Online` : `${EMOJIS.OFFLINE} Offline`}\n` +
      `\`\`\`yaml\n` +
      `Players: ${players}\n` +
      `Playing: ${playingPlayers}\n` +
      `Uptime: ${stats.uptime ? this._formatUptime(stats.uptime) : 'N/A'}\n` +
      `CPU: ${stats.cpu?.cores ?? 'N/A'} cores\n` +
      `Load: ${stats.cpu ? (stats.cpu.systemLoad * 100).toFixed(1) + '%' : 'N/A'}\n` +
      `LL Load: ${stats.cpu ? (stats.cpu.lavalinkLoad * 100).toFixed(1) + '%' : 'N/A'}\n` +
      `Memory: ${stats.memory ? `${Math.round(stats.memory.used / 1024 / 1024)}MB` : 'N/A'}\n` +
      `\`\`\``;

    return {
      name: node.name,
      value: value
    };
  }

  _formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  }

  _loadStored() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      logger.error('Failed to load Lavalink status DB:', e);
    }
    return null;
  }

  _saveStored(messageId) {
    try {
     
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = { channelId: this.channelId, messageId };
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      logger.error('Failed to save Lavalink status DB:', e);
    }
  }
}

module.exports = LavalinkStatusBroadcaster;