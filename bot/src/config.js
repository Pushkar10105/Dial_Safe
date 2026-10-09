/**
 * config.js — load and validate environment variables for the bot.
 * Fails fast at startup if any required variable is missing.
 */

require('dotenv').config();

const required = ['BACKEND_URL', 'BOT_API_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[DialSafe Bot] Missing required env variable: ${key}`);
    console.error('[DialSafe Bot] Copy bot/.env.example to bot/.env and fill in values.');
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  backendUrl: process.env.BACKEND_URL,
  botApiKey: process.env.BOT_API_KEY,
  frontendUrl: process.env.FRONTEND_URL || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  // In development, set SKIP_TWILIO_VALIDATION=true to skip Twilio signature check
  skipTwilioValidation: process.env.SKIP_TWILIO_VALIDATION === 'true',
};
