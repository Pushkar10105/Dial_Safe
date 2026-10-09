/**
 * server.js — Express webhook server for the DialSafe WhatsApp bot.
 *
 * Twilio sends a POST request (application/x-www-form-urlencoded) to /webhook
 * whenever a WhatsApp message arrives.  We validate the signature (optional in
 * dev via SKIP_TWILIO_VALIDATION=true), route the message, and respond with
 * TwiML <Message> XML.
 *
 * Twilio webhook timeout: 15 seconds.  Our HTTP client timeout: 12 seconds.
 */

require('dotenv').config();
const express = require('express');
const twilio  = require('twilio');
const config  = require('./config');
const { routeMessage } = require('./router');

const app = express();

// 1. Parse URL-encoded bodies from Twilio
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 2. Health-check — useful for UptimeRobot pings so Render stays warm
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dialsafe-bot', timestamp: new Date().toISOString() });
});

// 3. Twilio webhook — receives every incoming WhatsApp message
app.post('/webhook', async (req, res) => {
  // ── Signature validation ────────────────────────────────────────────
  if (!config.skipTwilioValidation && config.twilioAuthToken) {
    const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(
      config.twilioAuthToken,
      req.headers['x-twilio-signature'] || '',
      webhookUrl,
      req.body
    );
    if (!isValid) {
      console.warn('[BOT] Invalid Twilio signature from', req.ip);
      return res.status(403).send('Forbidden');
    }
  }

  const from        = req.body.From  || '';      // e.g. "whatsapp:+919876543210"
  const messageBody = req.body.Body  || '';
  const numMedia    = parseInt(req.body.NumMedia || '0', 10);

  console.log(`[BOT] Received from ${from}: "${messageBody.slice(0, 80)}"`);

  // ── Handle media messages (images, documents, etc.) ─────────────────
  if (numMedia > 0 && !messageBody.trim()) {
    const twiml = buildTwiML(
      'DialSafe can only process text messages. Please send a phone number or a brand name.'
    );
    return res.type('text/xml').send(twiml);
  }

  // ── Route the text message and get reply ────────────────────────────
  let replyText;
  try {
    replyText = await routeMessage(messageBody, from);
  } catch (err) {
    console.error('[BOT] Unhandled routing error:', err);
    replyText = '⚠️ Something went wrong. Please try again.';
  }

  // ── Respond with TwiML ──────────────────────────────────────────────
  res.type('text/xml').send(buildTwiML(replyText));
});

// 4. 404 fallback
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Wrap a text reply in Twilio Messaging TwiML.
 * @param {string} text
 * @returns {string}  XML string
 */
function buildTwiML(text) {
  // Escape XML special characters to prevent malformed TwiML
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

// ── Start ────────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`[DialSafe Bot] Listening on port ${config.port}`);
  console.log(`[DialSafe Bot] Backend: ${config.backendUrl}`);
  if (config.skipTwilioValidation) {
    console.warn('[DialSafe Bot] ⚠️  SKIP_TWILIO_VALIDATION=true — do NOT use in production!');
  }
});

const gracefulShutdown = () => {
  console.log('[DialSafe Bot] Shutting down...');
  server.close(() => process.exit(0));
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT',  gracefulShutdown);

module.exports = app; // for testing
