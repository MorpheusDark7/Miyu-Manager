# Environment Configuration Guide

This document lists all configurable environment variables for the Miyu-Manager bot.

## Required Variables

### `DISCORD_TOKEN`
- **Type**: String
- **Description**: Your Discord bot token
- **Default**: None (required)
- **Example**: `your_token_here`

## Optional Variables - MongoDB

### `MONGO_URI`
- **Type**: String
- **Description**: MongoDB connection string for persistent storage
- **Default**: Empty (features requiring DB will be disabled)
- **Example**: `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### `MONGO_RETRY_ATTEMPTS`
- **Type**: Integer
- **Description**: Number of attempts to connect to MongoDB before giving up
- **Default**: `5`

### `MONGO_RETRY_DELAY`
- **Type**: Integer (milliseconds)
- **Description**: Delay between MongoDB connection retry attempts
- **Default**: `5000`

## Bot Configuration

### `PREFIX`
- **Type**: String
- **Description**: Command prefix for text commands
- **Default**: `>`
- **Example**: `!` or `?`

### `OWNER_ID`
- **Type**: String (Discord User ID)
- **Description**: Discord user ID of bot owner
- **Default**: Empty
- **Example**: `1132306181470298112`

### `NOTIFICATION_ROLE_ID`
- **Type**: String (Discord Role ID)
- **Description**: Role to mention when broadcasting status changes
- **Default**: `1355096660115460220`
- **Example**: `1000000000000000000`

### `PRESENCE_REFRESH_INTERVAL`
- **Type**: Integer (milliseconds)
- **Description**: How often the bot's presence status rotates
- **Default**: `12000` (12 seconds)
- **Example**: `10000` for 10 seconds

## Lavalink Configuration

### `LAVALINK_BROADCAST_CHANNEL_ID`
- **Type**: String (Discord Channel ID)
- **Description**: Channel where Lavalink node stats are posted
- **Default**: Empty
- **Example**: `1443666346343796926`

### `LAVALINK_STATUS_INTERVAL`
- **Type**: Integer (milliseconds)
- **Description**: How often Lavalink stats message is updated
- **Default**: `60000` (60 seconds)
- **Example**: `30000` for 30 seconds

## Voice Channel Configuration

### `VOICE_CHANNEL_ID`
- **Type**: String (Discord Voice Channel ID)
- **Description**: Voice channel where bot automatically joins
- **Default**: Empty (auto-join disabled)
- **Example**: `1445142726965330054`

### `VOICE_AUTO_JOIN`
- **Type**: Boolean
- **Description**: Whether bot automatically joins the voice channel at startup
- **Default**: `false`
- **Options**: `true` or `false`

### `VOICE_STATUS_TEXT`
- **Type**: String
- **Description**: Text displayed in voice channel status
- **Default**: `All Systems Online`
- **Example**: `🎵 Music Bot is Online`

## Optional - Custom URLs and Assets

### `EMBED_THUMBNAIL`
- **Type**: URL String
- **Description**: Thumbnail image URL for embed messages
- **Default**: `https://i.imgur.com/Tqnk48j.png`

### `ISSUES_URL`
- **Type**: URL String
- **Description**: GitHub issues URL for bug reports
- **Default**: `https://github.com/MorpheusDark7/discord-manager-app/issues`

## Configuration File Fallback Hierarchy

The bot uses the following hierarchy to load configuration values:

1. **Environment Variables** (highest priority) - Values from `.env` file
2. **config/settings.json** - Local configuration file
3. **Hardcoded Defaults** (lowest priority) - Built-in defaults

### Example Resolution

For `PREFIX`:
```
Check: process.env.PREFIX
  → If not found, check config/settings.json
    → If not found, use default: '>'
```

## Quick Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your values**:
   ```bash
   # Required
   DISCORD_TOKEN=your_token_here
   
   # Optional but recommended
   MONGO_URI=your_mongodb_uri_here
   OWNER_ID=your_user_id
   NOTIFICATION_ROLE_ID=role_to_mention
   
   # Voice Channel (optional)
   VOICE_CHANNEL_ID=voice_channel_id
   VOICE_STATUS_TEXT=Custom Status
   ```

3. **Start the bot**:
   ```bash
   npm start
   ```

## Notes

- **Secrets**: Never commit `.env` file (it's in `.gitignore`)
- **Integers**: Numeric values should be passed as strings in `.env` and will be parsed automatically
- **Booleans**: In `.env`, use `true` or `false` as strings (case-insensitive)
- **Empty Values**: Leave empty if feature is not needed (e.g., `MONGO_URI=`)
- **IDs**: Discord IDs must be exact numeric strings with no formatting

## Environment-Specific Values

### Development
```env
PREFIX=>
PRESENCE_REFRESH_INTERVAL=7000
LAVALINK_STATUS_INTERVAL=30000
```

### Production
```env
PREFIX=>
PRESENCE_REFRESH_INTERVAL=12000
LAVALINK_STATUS_INTERVAL=60000
MONGO_RETRY_ATTEMPTS=10
MONGO_RETRY_DELAY=3000
```

