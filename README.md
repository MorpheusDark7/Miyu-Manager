
# Miyu-Manager

A Discord bot that tracks other bots' presence and posts Lavalink node stats.

Development website: miyudevelopment.online

**This README explains how to configure, run, and develop the bot.**

**Requirements**
- **Node.js**: v18 or later
- **npm**
- Optional: **MongoDB** if you want persistent guild/tracking data

**Quick start (local)**
- Copy `.env.example` to `.env` and fill in your secrets (do not commit `.env`):

```bash
cp .env.example .env
# Edit .env and set DISCORD_TOKEN and optional MONGO_URI
```

- Install dependencies and start:

```bash
npm install
npm start
```

- For development with auto-reload:

```bash
npm run dev
```

**Environment variables**

See `ENV_CONFIG_GUIDE.md` for complete documentation of all environment variables, defaults, and configuration options.

Key variables:
- `DISCORD_TOKEN` — your bot token (required to login)
- `MONGO_URI` — MongoDB connection string (optional). If not provided, DB-dependent features are skipped and the bot will still run.
- `PREFIX` — command prefix (default `>`)
- `LAVALINK_BROADCAST_CHANNEL_ID` — channel for Lavalink stats
- `VOICE_CHANNEL_ID` — voice channel for auto-join
- `VOICE_STATUS_TEXT` — custom voice status message

There is an `.env.example` file with all available options. `.gitignore` includes `.env` and `logs/` to prevent accidental commits.

**Configuration files**
- `config/settings.json` — fallback configuration values (used if environment variables are not set):
  - All fields support environment variable overrides
  - See `ENV_CONFIG_GUIDE.md` for the complete list of configurable options
  - Do not put secrets into this file; use environment variables instead

- `src/config/lavalink.js` — list of Lavalink nodes (module exports `LAVALINK_NODES` and `LAVALINK_CONFIG`).
  - Each node has: `name`, `url` (`host:port`), `auth` (password), `secure` (true/false).
  - To add or update nodes, edit `src/config/lavalink.js` and restart the bot.

**Behavior when MongoDB is missing**
- The bot supports running without a DB. When `MONGO_URI` is not set, DB-dependent features (tracking, broadcast channel persistence) are disabled and commands will return a helpful message.
- Retry behavior is configurable via `MONGO_RETRY_ATTEMPTS` and `MONGO_RETRY_DELAY` environment variables (see `ENV_CONFIG_GUIDE.md`).

**Resilience and restart behavior**
- The bot attempts several background retries when connecting to MongoDB.
- Uncaught exceptions no longer call `process.exit(1)` immediately; the bot attempts a graceful cleanup and an in-process reconnect. For production deployment we recommend running the bot under a process supervisor (PM2, systemd, Docker) so full-process restarts happen reliably.

**Recommended production deployment**
- Use a process supervisor:
  - PM2: `pm2 start npm --name miyu-manager -- start`
  - systemd: create a service that runs `npm start` and sets environment variables securely
  - Docker: build a Docker image and inject secrets via environment or secret manager

**Logging and debugging**
- The app uses a `logger` utility under `src/utils/logger`. Check stdout/stderr or your supervisor's logs for `info`, `warn`, `error` entries.

**Where key code lives**
- `src/app.js` — main entry point, login, Shoukaku init, global handlers
- `src/classes/LavalinkStatusBroadcaster.js` — builds and updates Lavalink stats message
- `src/classes/StatusBroadcaster.js` — builds and sends presence-change notifications
- `src/db/MongoDatabase.js` — Mongoose-based DB layer (models in `src/db/schemas`)
- `src/commands` — command handlers (tracker commands under `src/commands/tracker`)
- `src/events` — event handlers (ready, presenceUpdate, messageCreate, etc.)

**How to configure the bot**
- All configuration is done via environment variables in `.env` file
- See `ENV_CONFIG_GUIDE.md` for complete list of options
- To update configuration for a running process, update `.env` and restart the bot supervisor
- Do not put secrets into `config/settings.json`; use environment variables instead

**Lavalink node format example**
Inside `src/config/lavalink.js`, nodes look like:

```js
{
    "name": "My Node2",
    "url": "host:2333",
    "auth": "password",
    "secure": false
  }
```

**Troubleshooting**
- If the bot logs `Failed to login:`, verify `DISCORD_TOKEN` is correct and the bot has `Bot` token permissions.
- If Lavalink nodes fail to connect, verify host/port/auth and whether `secure` (TLS) is required.
- If DB errors occur, check `MONGO_URI`, network access, and MongoDB credentials.

**Contributing**
- Fork, make changes, and open a PR. Keep secrets out of commits.

**Contact / Website**
- Development site: miyudevelopment.online

---

**See Also**
- `ENV_CONFIG_GUIDE.md` — Complete environment variable reference and configuration guide
- `VOICE_STATUS_USAGE.md` — VoiceStatusManager API documentation
