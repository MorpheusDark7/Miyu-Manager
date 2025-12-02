// Voice Status Manager Usage Guide

// The VoiceStatusManager is now available on the client object as:
// client.voiceStatusManager

// BASIC USAGE EXAMPLES:

// 1. Set idle status (when bot joins but isn't playing)
await client.voiceStatusManager.setIdleStatus(voiceChannelId);

// 2. Set playing status (provide plain text or an object with `text`)
await client.voiceStatusManager.setPlayingStatus(voiceChannelId, "Now playing: My Stream");

// 3. Set paused status (provide plain text or an object with `text`)
await client.voiceStatusManager.setPausedStatus(voiceChannelId, "Paused — resuming soon");

// 4. Set radio status
await client.voiceStatusManager.setRadioStatus(voiceChannelId, "Station Name");

// 5. Clear voice channel status
await client.voiceStatusManager.clearStatus(voiceChannelId);

// 6. Directly update voice status with custom text
await client.voiceStatusManager.updateVoiceStatus(voiceChannelId, "Custom Status Text");

// ADVANCED METHODS:

// Get voice channel ID from a player object
const channelId = client.voiceStatusManager.getVoiceChannelId(player);

// Check if a channel supports voice status (Stage Channels don't)
const supports = await client.voiceStatusManager.supportsVoiceStatus(voiceChannelId);

// Note: song-title cleaning has been removed. Provide the status text you
// want displayed directly to the manager (examples above).

// Cleanup update queue (call periodically for maintenance)
client.voiceStatusManager.cleanupQueue();

// KEY FEATURES:
// - Uses Discord REST API for voice channel status updates
// - Automatic channel type checking (Stage Channels are skipped)
// - Permission verification (ViewChannel, Connect)
// - Concurrent update prevention with updateQueue
// - Automatic title cleaning and truncation (max 35 chars)
// - Safe error handling (silently skips errors like missing permissions)
// - Token is automatically configured from client.config.token

// EMOJI SUPPORT:
// The manager looks for emojis in client.emoji object:
// - client.emoji.Zabrina (for idle status)
// - client.emoji.playing (for playing status)
// - client.emoji.pause (for paused status)
// - client.emoji.radio (for radio status)
// Falls back to default emojis if not found
