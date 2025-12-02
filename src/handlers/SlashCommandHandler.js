const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const logger = require('../utils/logger');

class SlashCommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.commandData = [];
  }

  
  loadCommands() {
    const commandsPath = path.join(__dirname, '../slashCommands');
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of files) {
      try {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) {
          this.commands.set(command.data.name, command);
          this.commandData.push(command.data.toJSON());
        }
      } catch (error) {
        logger.error(`Failed to load slash command ${file}: ${error.message}`);
      }
    }

    logger.info(`Loaded ${this.commands.size} slash commands`);
  }

  
  async registerCommands() {
    if (!this.client.user || !this.client.user.id) {
      logger.warn('Client not ready; skipping slash command registration');
      return;
    }

    try {
      const rest = new REST({ version: '10' }).setToken(this.client.token);
      
      logger.info(`Registering ${this.commandData.length} slash commands with Discord...`);
      
      const data = await rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: this.commandData }
      );

      logger.info(`✅ Successfully registered ${data.length} slash commands`);
    } catch (error) {
      logger.error(`Failed to register slash commands: ${error.message}`);
    }
  }

  
  getAllCommands() {
    return this.commands;
  }
}

module.exports = SlashCommandHandler;
