const mongoose = require('mongoose');
const { EventEmitter } = require('events');
const GuildSchema = require('./schemas/GuildSchema');
const { MONGO_ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

class MongoDatabase extends EventEmitter {
  constructor(options) {
    super();
    this.mongo = this._createConnection(options.uri);
    this.isConnected = false;
    this.connectionPromise = null;
    this.GuildModel = this.mongo.model('Guild', GuildSchema);
  }

  _createConnection(uri) {
    return mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true
    });
  }

  registerConnectionEvents() {
    this.mongo.on('connecting', () => {
      logger.info('(MONGO): Connecting to MongoDB...');
      this.isConnected = false;
    });

    this.mongo.on('connected', () => {
      logger.info('(MONGO): Connected to MongoDB.');
      this.isConnected = true;
    });

    this.mongo.on('disconnected', () => {
      logger.warn('(MONGO): Disconnected from MongoDB.');
      this.isConnected = false;
    });

    this.mongo.on('reconnected', () => {
      logger.info('(MONGO): Reconnected to MongoDB.');
      this.isConnected = true;
    });

    this.mongo.on('error', (error) => {
      logger.error(`(MONGO): A connection error has occurred! ${error.stack || error.message}`);
      this.isConnected = false;
      setTimeout(() => {
        logger.info('(MONGO): Attempting to reconnect...');
        this.mongo.close().catch((err) => logger.error(`(MONGO): Error closing connection: ${err.stack || err.message}`));
        this.mongo = this._createConnection(this.mongo.name);
        this.GuildModel = this.mongo.model('Guild', GuildSchema);
        this.registerConnectionEvents();
      }, 5000);
    });

    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      const onConnected = () => {
        this.mongo.off('error', onError);
        resolve();
      };

      const onError = (error) => {
        this.mongo.off('connected', onConnected);
        reject(error);
      };

      this.mongo.once('connected', onConnected);
      this.mongo.once('error', onError);
    });

    return this;
  }

  registerDefaultEvents() {
    this.on('guildCreate', (guild) => {
      logger.info(`(MONGO): Created a new document for ${guild.name}.`);
    });
    this.on('guildRemove', (guild) => {
      logger.info(`(MONGO): Deleted the document for ${guild.name}.`);
    });
    this.on('guildCleanup', (count) => {
      logger.warn(`(MONGO): Cleaned up ${count} guild entries.`);
    });
    this.on('trackedBotAdd', (bot, guild) => {
      logger.info(`(MONGO): Added ${bot.displayName} to the ${guild.name} tracked bots list.`);
    });
    this.on('trackedBotRemove', (bot, guild) => {
      logger.info(`(MONGO): Removed ${bot.displayName} from the ${guild.name} tracked bots list.`);
    });
    this.on('trackedBotUpdate', (bot, guild) => {
      logger.info(`(MONGO): Updated lastOnline for ${bot.displayName} from ${guild.name}.`);
    });
    this.on('trackedBotCleanup', (count) => {
      logger.warn(`(MONGO): Cleaned up ${count} tracked bot entries.`);
    });
    this.on('broadcastChannelUpdate', (channel, guild) => {
      logger.info(`(MONGO): Updated broadcast channel for ${guild.name} to ${channel.name}.`);
    });
    this.on('error', (error, description) => {
      logger.error(`(MONGO): ${description} ${error.stack || error.message}`);
    });
    return this;
  }

  async _withTimeout(promise, timeoutMs = 15000) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  }

  async initialize(guilds) {
    await this.connectionPromise;
    await Promise.all(guilds.map((guild) => this.createGuild(guild)));
  }

  async _ensureConnection() {
    if (!this.isConnected) {
      await this.connectionPromise;
    }
  }

  async createGuild(guild) {
    await this._ensureConnection();
    const model = new this.GuildModel({ id: guild.id });
    try {
      await this._withTimeout(model.save());
      this.emit('guildCreate', guild);
    } catch (error) {
      if (error.code === MONGO_ERROR_CODES.DUPLICATE) return;
      this.emit('error', error, `Failed to create document for guild ${guild.name}.`);
      throw error;
    }
  }

  async deleteGuild(guild) {
    await this._ensureConnection();
    try {
      await this._withTimeout(this.GuildModel.findOneAndDelete({ id: guild.id }));
      this.emit('guildRemove', guild);
    } catch (error) {
      this.emit('error', error, `Failed to delete document for guild ${guild.name}.`);
      throw error;
    }
  }

  async getGuild(guild) {
    return this._withTimeout(this.GuildModel.findOne({ id: guild.id }));
  }

  async updateLastOnline(trackedBotMember, lastOnlineTimestamp) {
    const { guild } = trackedBotMember;
    try {
      const storedGuild = await this._withTimeout(this.GuildModel.findOne({ id: guild.id }));
      const storedBot = storedGuild?.trackedBots.find((bot) => bot.id === trackedBotMember.id);
      if (!storedBot) throw new Error(`Bot ${trackedBotMember.displayName} is not tracked in ${guild.name}.`);
      storedBot.lastOnline = lastOnlineTimestamp;
      await this._withTimeout(storedGuild.save());
      this.emit('trackedBotUpdate', trackedBotMember, guild);
    } catch (error) {
      this.emit('error', error, `Failed to update lastOnline for ${trackedBotMember.displayName} in ${guild.name}.`);
      throw error;
    }
  }

  async updateBroadcastChannel(channel) {
    const { guild } = channel;
    try {
      await this._withTimeout(
        this.GuildModel.findOneAndUpdate(
          { id: guild.id },
          { broadcastChannel: channel.id },
          { new: true }
        )
      );
      this.emit('broadcastChannelUpdate', channel, guild);
    } catch (error) {
      this.emit('error', error, `Failed to update broadcast channel for ${guild.name} to ${channel.name}.`);
      throw error;
    }
  }

  async addTrackedBot(botMember) {
    const { guild } = botMember;
    try {
      const storedGuild = await this._withTimeout(this.GuildModel.findOne({ id: guild.id }));
      storedGuild.trackedBots.push({ id: botMember.id, lastOnline: null });
      await this._withTimeout(storedGuild.save());
      this.emit('trackedBotAdd', botMember, guild);
    } catch (error) {
      this.emit('error', error, `Failed to add ${botMember.displayName} to tracked bots in ${guild.name}.`);
      throw error;
    }
  }

  async removeTrackedBot(botMember) {
    const { guild } = botMember;
    try {
      const storedGuild = await this._withTimeout(this.GuildModel.findOne({ id: guild.id }));
      storedGuild.trackedBots = storedGuild.trackedBots.filter((bot) => bot.id !== botMember.id);
      await this._withTimeout(storedGuild.save());
      this.emit('trackedBotRemove', botMember, guild);
    } catch (error) {
      this.emit('error', error, `Failed to remove ${botMember.displayName} from tracked bots in ${guild.name}.`);
      throw error;
    }
  }

  async cleanupGuilds(guilds) {
    const guildIDs = guilds.map((guild) => guild.id);
    try {
      const { deletedCount } = await this._withTimeout(
        this.GuildModel.deleteMany({ id: { $nin: guildIDs } })
      );
      if (deletedCount > 0) this.emit('guildCleanup', deletedCount);
    } catch (error) {
      this.emit('error', error, 'Failed to clean up guilds.');
      throw error;
    }
  }

  async cleanupTrackedBots(guilds) {
    try {
      const storedGuilds = await this._withTimeout(
        this.GuildModel.find({ trackedBots: { $ne: [] } })
      );
      const bulkUpdate = storedGuilds.reduce((updateJobs, storedGuild) => {
        const guild = guilds.get(storedGuild.id);
        if (!guild) return updateJobs;
        const trackedBotsToKeep = storedGuild.trackedBots.filter((trackedBot) =>
          guild.members.cache.has(trackedBot.id)
        );
        if (trackedBotsToKeep.length !== storedGuild.trackedBots.length) {
          updateJobs.push({
            updateOne: {
              filter: { id: storedGuild.id },
              update: { trackedBots: trackedBotsToKeep }
            }
          });
        }
        return updateJobs;
      }, []);
      if (bulkUpdate.length > 0) {
        await this._withTimeout(this.GuildModel.bulkWrite(bulkUpdate));
        this.emit('trackedBotCleanup', bulkUpdate.length);
      }
    } catch (error) {
      this.emit('error', error, 'Failed to clean up tracked bots.');
      throw error;
    }
  }

}

module.exports = MongoDatabase;