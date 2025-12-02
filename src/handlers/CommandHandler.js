const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
  }

  
  loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    this._loadCommandsFromDirectory(commandsPath);
    logger.info(`Loaded ${this.commands.size} commands`);
  }

  
  _loadCommandsFromDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        this._loadCommandsFromDirectory(filePath);
      } else if (file.endsWith('.js')) {
        try {
          const command = require(filePath);
          if (command.name) {
            this.commands.set(command.name, command);
            
            
            if (command.aliases) {
              command.aliases.forEach(alias => {
                this.commands.set(alias, command);
              });
            }
          }
        } catch (error) {
          logger.error(`Failed to load command ${file}: ${error.message}`);
        }
      }
    }
  }

  
  async handleCommand(message) {
    const { client, config } = this.client;
    
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = this.commands.get(commandName);

    if (!command) return;

    
    if (command.userPermissions && !message.member.permissions.has(command.userPermissions)) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    
    if (command.guildOnly && !message.guild) {
      return message.reply('❌ This command can only be used in servers.');
    }

    try {
      await command.run(message, args);
    } catch (error) {
      logger.error(`Command error in ${commandName}: ${error.stack || error.message}`);
      message.reply('❌ An error occurred while executing this command.');
    }
  }

  
  getCommand(name) {
    return this.commands.get(name) || null;
  }

  
  getAllCommands() {
    return this.commands;
  }
}

module.exports = CommandHandler;