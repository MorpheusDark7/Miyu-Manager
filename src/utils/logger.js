const winston = require('winston');


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      const colors = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        debug: '\x1b[35m',
        reset: '\x1b[0m'
      };

      const levelColor = colors[level] || colors.reset;
      const levelUpper = level.toUpperCase().padEnd(6);

      let icon = '';
      switch (level) {
        case 'info': icon = '✓'; break;
        case 'warn': icon = '⚠'; break;
        case 'error': icon = '✗'; break;
        case 'debug': icon = '◆'; break;
      }

      return `${levelColor}[${timestamp}] [${levelUpper}] ${icon} ${message}${colors.reset}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), 
        winston.format.printf(({ timestamp, level, message }) => {
          const colors = {
            info: '\x1b[36m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            debug: '\x1b[35m',
            reset: '\x1b[0m'
          };

          const levelColor = colors[level] || colors.reset;
          const levelUpper = level.toUpperCase().padEnd(6);

          let icon = '';
          switch (level) {
            case 'info': icon = '✓'; break;
            case 'warn': icon = '⚠'; break;
            case 'error': icon = '✗'; break;
            case 'debug': icon = '◆'; break;
          }

          return `${levelColor}[${timestamp}] [${levelUpper}] ${icon} ${message}${colors.reset}`;
        })
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});


logger.printBanner = function () {
  const banner = `
╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                               ║
║                                                                                               ║
║        ▄▄▄     ▄▄▄                    ▄▄▄▄▄▄                    ▄▄                            ║
║         ███▄ ▄███                    █▀██▀▀██                    ██                     █▄    ║
║         ██ ▀█▀ ██   ▀▀                 ██   ██                   ██        ▄        ▄   ▄██▄  ║
║         ██     ██   ██ ██ ██ ██ ██     ██   ██ ▄█▀█▄▀█▄ ██▀▄█▀█▄ ██ ▄███▄ ████▄ ███▄███▄ ██   ║
║         ██     ██   ██ ██▄██ ██ ██   ▄ ██   ██ ██▄█▀ ██▄██ ██▄█▀ ██ ██ ██ ██ ██ ██ ██▄█▀ ██   ║
║       ▀██▀     ▀██▄▄██▄▄▀██▀▄▀██▀█   ▀██▀███▀ ▄▀█▄▄▄  ▀█▀ ▄▀█▄▄▄▄██▄▀███▀▄████▀▄██ ██ ▀█▄██   ║
║                          ██                                        ██                         ║
║                        ▀▀▀                                        ▀                           ║
║                                                                                               ║
║                          https://miyudevelopment.online                                       ║
║                                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
  `;
  
  console.log(banner);
};

module.exports = logger;
