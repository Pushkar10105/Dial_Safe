const express = require('express');
const router = express.Router();

/**
 * Placeholder router for Member 1 (WhatsApp Bot teammate).
 * Twilio sends application/x-www-form-urlencoded webhooks to this endpoint.
 */
router.post('/', (req, res) => {
  // TODO: Member 1 will implement WhatsApp message processing, command routing,
  // Twilio signature verification, and dynamic TwiML response generation here.
  res.type('text/xml');
  return res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

module.exports = router;
