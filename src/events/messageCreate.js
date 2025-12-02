const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    
    if (message.content.startsWith(client.config.prefix)) {
      await client.commandHandler.handleCommand(message);
    }
  }
};