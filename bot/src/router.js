/**
 * router.js — Classify incoming WhatsApp messages into intents,
 * call the appropriate backend endpoint, and return a formatted reply.
 *
 * Intent priority (in order):
 *   1. HELP     — "hi", "hello", "help", "menu", "start"
 *   2. REPORT   — starts with "report <number> [note]"
 *   3. MESSAGE  — everything else is forwarded to POST /message,
 *                 which the backend classifies as number-check or brand-lookup.
 *
 * The backend's POST /message handles:
 *   - Number check  (response.type === 'check')
 *   - Brand lookup  (response.type === 'brand')
 *   - Unrecognized  (response.type === 'unrecognized')
 */

const client = require('./client');
const {
  formatCheckReply,
  formatBrandReply,
  formatReportReply,
  formatHelpReply,
  formatUnrecognizedReply,
  formatErrorReply,
} = require('./formatters');

// Regex to detect a phone number anywhere in the message
const PHONE_RE = /(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}|(?:\+91[\s\-]?)?\d{10}|1800[\s\-]?\d{3}[\s\-]?\d{3,4}|1860[\s\-]?\d{3}[\s\-]?\d{4}/;

// Keywords for greeting / help intent
const HELP_TRIGGERS = new Set(['hi', 'hello', 'hey', 'help', 'menu', 'start', 'helo', 'hii', 'hiii', 'hai']);

/**
 * Main routing function.
 * @param {string} messageBody  - raw text the user sent on WhatsApp
 * @param {string} [from]       - sender WhatsApp number (for logging, not stored beyond this call)
 * @returns {Promise<string>}   - text to reply with
 */
async function routeMessage(messageBody, from) {
  const body = (messageBody || '').trim();

  if (!body) {
    return formatHelpReply();
  }

  const lower = body.toLowerCase();

  // ── 1. HELP intent ──────────────────────────────────────────────────
  // Single-word triggers or short phrases like "hi", "help", "menu"
  if (HELP_TRIGGERS.has(lower) || lower === 'help me') {
    return formatHelpReply();
  }

  // ── 2. REPORT intent ────────────────────────────────────────────────
  // Syntax:  report <number> [optional note text]
  if (lower.startsWith('report ')) {
    return await handleReport(body);
  }

  // ── 3. Everything else → POST /message (backend classifies) ─────────
  return await handleMessage(body);
}

// ── Handlers ────────────────────────────────────────────────────────────

/**
 * Handle "report <number> [note]"
 */
async function handleReport(body) {
  // Strip the leading "report " prefix
  const rest = body.slice(7).trim(); // "report ".length === 7

  // Extract the phone number from the remainder
  const match = rest.match(PHONE_RE);
  if (!match) {
    return [
      '❌ Could not find a phone number in your report.',
      '',
      'Format: _report +91 98765 43210 [optional note]_',
      'Example: _report 9876543210 Asked me for OTP claiming to be Zomato_',
    ].join('\n');
  }

  const rawNumber = match[0];
  // Note is everything except the matched number
  const note = rest.replace(rawNumber, '').trim() || undefined;

  try {
    const result = await client.reportNumber(rawNumber, undefined, note);
    return formatReportReply(result, rawNumber);
  } catch (err) {
    console.error('[BOT REPORT ERROR]', err.message);
    return formatErrorReply();
  }
}

/**
 * Forward message to backend POST /message and format the response.
 */
async function handleMessage(body) {
  try {
    const result = await client.postMessage(body);

    switch (result.type) {
      case 'check':
        return formatCheckReply(result);

      case 'brand':
        return formatBrandReply(result);

      case 'unrecognized':
        return formatUnrecognizedReply(body);

      default:
        // Unexpected response type — treat as unrecognized
        console.warn('[BOT] Unknown response type from /message:', result.type);
        return formatUnrecognizedReply(body);
    }
  } catch (err) {
    console.error('[BOT MESSAGE ERROR]', err.message);
    // If backend is down or returned 4xx/5xx
    if (err.response && err.response.status === 400) {
      return formatUnrecognizedReply(body);
    }
    return formatErrorReply();
  }
}

module.exports = { routeMessage };
