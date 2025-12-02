const { Schema } = require('mongoose');

const GuildSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  broadcastChannel: {
    type: String,
    default: null
  },
  trackedBots: [{
    id: {
      type: String,
      required: true
    },
    lastOnline: {
      type: Number,
      default: null
    }
  }]
});

module.exports = GuildSchema;
