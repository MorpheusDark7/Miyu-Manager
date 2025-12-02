const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EventHandler {
  constructor(client) {
    this.client = client;
  }

  
  loadEvents() {
    const eventsPath = path.join(__dirname, '../events');
    
    if (!fs.existsSync(eventsPath)) {
      fs.mkdirSync(eventsPath, { recursive: true });
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      try {
        const event = require(path.join(eventsPath, file));
        
        if (event.once) {
          this.client.once(event.name, (...args) => event.execute(...args, this.client));
        } else {
          this.client.on(event.name, (...args) => event.execute(...args, this.client));
        }
        
        logger.info(`Loaded event: ${event.name}`);
      } catch (error) {
        logger.error(`Failed to load event ${file}: ${error.message}`);
      }
    }
  }
}

module.exports = EventHandler;