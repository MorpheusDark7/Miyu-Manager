const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
require('dotenv').config();

const config = require('../config/settings.json');
const { LAVALINK_NODES, LAVALINK_CONFIG } = require('./config/lavalink');

const logger = require('./utils/logger');
const MongoDatabase = require('./db/MongoDatabase');
const StatusBroadcaster = require('./classes/StatusBroadcaster');
const VoiceStatusManager = require('./classes/VoiceStatusManager');
const CommandHandler = require('./handlers/CommandHandler');
const SlashCommandHandler = require('./handlers/SlashCommandHandler');
const EventHandler = require('./handlers/EventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || config.token;
const MONGO_URI = process.env.MONGO_URI || config.mongo_uri;
const MONGO_RETRY_ATTEMPTS = parseInt(process.env.MONGO_RETRY_ATTEMPTS || '5', 10);
const MONGO_RETRY_DELAY = parseInt(process.env.MONGO_RETRY_DELAY || '5000', 10);

client.config = config;
client.config.prefix = process.env.PREFIX || config.prefix || '>';
client.config.owner_id = process.env.OWNER_ID || config.owner_id || '';
client.config.lavalinkbroadcastchannelId = process.env.LAVALINK_BROADCAST_CHANNEL_ID || config.lavalinkbroadcastchannelId || '';
client.config.notification_role_id = process.env.NOTIFICATION_ROLE_ID || config.notification_role_id || '';
client.config.presence_refresh_interval = parseInt(process.env.PRESENCE_REFRESH_INTERVAL || config.presence_refresh_interval || '12000', 10);
client.config.lavalink_status_interval = parseInt(process.env.LAVALINK_STATUS_INTERVAL || config.lavalink_status_interval || '60000', 10);
client.config.voice_channel_id = process.env.VOICE_CHANNEL_ID || config.voice_channel_id || '';
client.config.voice_auto_join = process.env.VOICE_AUTO_JOIN?.toLowerCase() === 'true' || config.voice_autojoin || false;
client.config.voice_status_text = process.env.VOICE_STATUS_TEXT || config.voice_status_text || 'All Systems Online';
client.config.token = DISCORD_TOKEN;

async function initMongoWithRetries(uri, attempts = MONGO_RETRY_ATTEMPTS, delayMs = MONGO_RETRY_DELAY) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const mongo = new MongoDatabase({ uri });
      mongo.registerConnectionEvents();
      mongo.registerDefaultEvents();
      if (mongo.connectionPromise) await mongo.connectionPromise;
      logger.info('(MONGO): Successfully connected to MongoDB');
      return mongo;
    } catch (err) {
      logger.warn(`(MONGO): Connection attempt ${i} failed: ${err?.message || err}. Retrying in ${delayMs}ms...`);
      if (i < attempts) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Failed to connect to MongoDB after multiple attempts');
}

if (MONGO_URI) {
  initMongoWithRetries(MONGO_URI, 5, 5000)
    .then((mongo) => { client.mongo = mongo; })
    .catch((err) => {
      client.mongo = null;
      logger.error('(MONGO): Could not establish MongoDB connection:', err);
    });
} else {
  client.mongo = null;
  logger.warn('MONGO_URI not provided — skipping MongoDB initialization.');
}

client.statusBroadcaster = new StatusBroadcaster(client);
client.voiceStatusManager = new VoiceStatusManager(client);
client.commands = new Collection();

client.slashCommandHandler = new SlashCommandHandler(client);
client.slashCommands = new Map();

client.shoukaku = new Shoukaku(
  new Connectors.DiscordJS(client), 
  LAVALINK_NODES, 
  LAVALINK_CONFIG
);

client.shoukaku.on('ready', (name) => logger.info(`✅ Node connected: ${name}`));
client.shoukaku.on('disconnect', (name, reason) => logger.warn(`⚠️ Node disconnected: ${name} (${reason})`));
client.shoukaku.on('error', (name, error) => logger.error(`❌ Node error on ${name}: ${error.message}`));

client.commandHandler = new CommandHandler(client);
client.slashCommandHandler = new SlashCommandHandler(client);
client.eventHandler = new EventHandler(client);

client.commandHandler.loadCommands();
client.slashCommandHandler.loadCommands();
client.eventHandler.loadEvents();

logger.printBanner();


process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  try {
    
    if (client.lavalinkBroadcaster) {
      try { client.lavalinkBroadcaster.stop(); } catch (e) { logger.warn('Failed to stop lavalink broadcaster during uncaughtException:', e); }
    }
    try { await client.destroy(); } catch (e) { logger.warn('Error destroying Discord client during uncaughtException:', e); }

    
    if (DISCORD_TOKEN) {
      const retryDelay = 5000;
      logger.info(`Attempting to reconnect Discord client in ${retryDelay}ms...`);
      setTimeout(async () => {
        try {
          await client.login(DISCORD_TOKEN);
          logger.info('Reconnected Discord client after uncaught exception');
        } catch (loginErr) {
          logger.error('Reconnection attempt failed:', loginErr);
        }
      }, retryDelay);
    }
  } catch (cleanupErr) {
    logger.error('Error during uncaughtException cleanup:', cleanupErr);
  }
  
});


process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (client.lavalinkBroadcaster) {
    client.lavalinkBroadcaster.stop();
  }
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (client.lavalinkBroadcaster) {
    client.lavalinkBroadcaster.stop();
  }
  client.destroy();
  process.exit(0);
});


client.login(DISCORD_TOKEN).catch(error => {
  logger.error('Failed to login:', error);
  process.exit(1);
});