const humanizeDuration = require('humanize-duration');


const formatTimeDelta = (millis) => {
  if (typeof millis !== 'number' || isNaN(millis)) {
    throw new TypeError('Input must be a valid number of milliseconds');
  }
  if (millis < 0) {
    throw new RangeError('Input milliseconds cannot be negative');
  }

  return humanizeDuration(millis, {
    largest: 4,
    units: ['d', 'h', 'm', 's'],
    round: true,
    conjunction: ' and ',
    serialComma: false
  });
};


const createErrorResponse = (title, message) => ({
  title: `${title} • Error`,
  message: `❌ ${message}`,
  color: 0xff0000
});


const createSuccessResponse = (title, message) => ({
  title: `${title} • Success`,
  message: `✅ ${message}`,
  color: 0x00ff00
});


const isBot = (member) => member && member.user && member.user.bot;


const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

module.exports = {
  formatTimeDelta,
  createErrorResponse,
  createSuccessResponse,
  isBot,
  getCurrentTimestamp
};