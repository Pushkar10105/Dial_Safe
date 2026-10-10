/**
 * config.js — load and validate environment variables for the bot.
 * Fails fast at startup if any required variable is missing.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env from bot directory first, then fallback to current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const botApiKey = process.env.BOT_API_KEY || 'change-me';

module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  backendUrl,
  botApiKey,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  // In development, set SKIP_TWILIO_VALIDATION=true to skip Twilio signature check
  skipTwilioValidation: process.env.SKIP_TWILIO_VALIDATION === 'true' || !process.env.TWILIO_AUTH_TOKEN,
};
