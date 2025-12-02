/**
 * 
 */

/**
 * 
 * @type {Object<string, string>}
 */
const PRESENCE_STATUS = {
  online: 'online',
  idle: 'idle',
  offline: 'offline',
  dnd: 'dnd'
};

/**
 * 
 * @type {Object}
 */
const MESSAGE_EMBED = {
  thumbnail: process.env.EMBED_THUMBNAIL || 'https://i.imgur.com/Tqnk48j.png',
  color: 0xffcb5c,
  issuesURL: process.env.ISSUES_URL || 'https://github.com/MorpheusDark7/discord-manager-app/issues'
};

/**
 * 
 * @type {Object<string, string>}
 */
const MESSAGE_SEND_ERRORS = {
  unknown: 'DiscordAPIError: Unknown Channel',
  permissions: 'DiscordAPIError: Missing Permissions',
  rateLimit: 'DiscordAPIError: 429 Too Many Requests'
};

/**
 * 
 * @type {Object<string, number>}
 */
const MONGO_ERROR_CODES = {
  DUPLICATE: 11000
};

/**
 * 
 */
const BOT_CONFIG = {
  DEFAULT_NOTIFICATION_ROLE_ID: process.env.NOTIFICATION_ROLE_ID || '1355096660115460220',
  PRESENCE_REFRESH_INTERVAL: parseInt(process.env.PRESENCE_REFRESH_INTERVAL || '12000', 10),
  LAVALINK_STATUS_INTERVAL: parseInt(process.env.LAVALINK_STATUS_INTERVAL || '60000', 10),
  COMMAND_TIMEOUT: 15000,
  EMBED_COLORS: {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    WARNING: 0xffcb5c
  }
};

module.exports = {
  PRESENCE_STATUS,
  MESSAGE_EMBED,
  MESSAGE_SEND_ERRORS,
  MONGO_ERROR_CODES,
  BOT_CONFIG
};