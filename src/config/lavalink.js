const fs = require('fs');
const path = require('path');
const settings = require('../../config/settings.json');

let LAVALINK_NODES = [];

const nodesJsonPath = path.join(__dirname, '../../lavalink-nodes.json');
if (fs.existsSync(nodesJsonPath)) {
  try {
    LAVALINK_NODES = JSON.parse(fs.readFileSync(nodesJsonPath, 'utf8'));
    if (!Array.isArray(LAVALINK_NODES)) LAVALINK_NODES = [];
  } catch (e) {
    LAVALINK_NODES = [];
  }
} else if (process.env.LAVALINK_NODES) {
  try {
    const parsed = JSON.parse(process.env.LAVALINK_NODES);
    if (Array.isArray(parsed)) LAVALINK_NODES = parsed;
  } catch (e) {
    LAVALINK_NODES = [];
  }
} else if (settings.lavalink_nodes && Array.isArray(settings.lavalink_nodes)) {
  LAVALINK_NODES = settings.lavalink_nodes;
}

const LAVALINK_CONFIG = (settings.lavalink_config && typeof settings.lavalink_config === 'object') ? settings.lavalink_config : {
  reconnectTries: 5,
  reconnectInterval: 5000,
  statusUpdateInterval: 60000
};

module.exports = {
  LAVALINK_NODES,
  LAVALINK_CONFIG
};
