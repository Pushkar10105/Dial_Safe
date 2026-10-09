/**
 * formatters.js — Convert backend API responses into short, plain WhatsApp text.
 *
 * Rules (from memory.md / AGENTS.md):
 * - Replies are SHORT and PLAIN. No HTML. WhatsApp supports *bold* and _italic_.
 * - Verdicts: "Verified official", "High risk", "Suspicious", "Unknown". Never "safe".
 * - High-risk replies must include: do not share OTPs/PINs; report at cybercrime.gov.in or call 1930.
 * - Every verdict reply links to the number's detail page on the website.
 */

const config = require('./config');

// Emoji prefixes per verdict for quick visual scan
const VERDICT_EMOJI = {
  'verified_official': '✅',
  'high_risk':         '🚨',
  'suspicious':        '⚠️',
  'unknown':           '❓',
};

// Divider line
const SEP = '──────────────────';

/**
 * Format a number-check result into a WhatsApp message.
 * @param {Object} result  - response from POST /check or POST /message
 * @returns {string}
 */
function formatCheckReply(result) {
  const emoji   = VERDICT_EMOJI[result.verdictCode] || '❓';
  const verdict = result.verdict || 'Unknown';
  const number  = result.number  || '';

  const lines = [];

  lines.push(`${emoji} *${verdict}*`);
  lines.push(`Number: ${number}`);

  if (result.brand) {
    lines.push(`Brand:  ${result.brand}`);
  }

  lines.push(SEP);

  if (result.reasons && result.reasons.length > 0) {
    lines.push('*Why:*');
    for (const r of result.reasons) {
      lines.push(`• ${r}`);
    }
  }

  if (result.reportCount !== undefined && result.reportCount > 0) {
    lines.push(`📊 Reported ${result.reportCount} time(s) by the community.`);
  }

  if (result.officialNumber) {
    lines.push(`\n📞 Official number: ${result.officialNumber}`);
  }

  // Safety advice — always show for high-risk and suspicious
  if (result.advice && result.advice.length > 0) {
    lines.push(SEP);
    for (const a of result.advice) {
      lines.push(`ℹ️ ${a}`);
    }
  }

  // Website detail link — required by memory.md §12 Member 1
  const detailUrl = result.detailUrl || buildDetailUrl(number);
  if (detailUrl) {
    lines.push(SEP);
    lines.push(`🔗 Full details: ${detailUrl}`);
  }

  return lines.join('\n');
}

/**
 * Format a brand-lookup result into a WhatsApp message.
 * @param {Object} result - response from GET /brand/:name or POST /message
 * @returns {string}
 */
function formatBrandReply(result) {
  const lines = [];

  const brandName = result.brand || result.name || 'Unknown Brand';
  lines.push(`📋 *Official care numbers for ${brandName}*`);
  lines.push(SEP);

  if (result.officialNumbers && result.officialNumbers.length > 0) {
    for (const num of result.officialNumbers) {
      lines.push(`📞 ${num}`);
    }
  } else {
    lines.push('No official numbers currently in our list.');
  }

  if (result.sourceUrl) {
    lines.push(`\n✅ Verified from: ${result.sourceUrl}`);
  }
  if (result.lastChecked) {
    lines.push(`📅 Last checked: ${result.lastChecked}`);
  }

  lines.push(SEP);
  lines.push('ℹ️ Always verify numbers on the company\'s own website or app before calling.');

  return lines.join('\n');
}

/**
 * Format a report-submission confirmation.
 * @param {Object} result - response from POST /report
 * @param {string} number - the number that was reported
 * @returns {string}
 */
function formatReportReply(result, number) {
  if (!result.ok) {
    return '❌ Could not save your report. Please try again later.';
  }
  const lines = [
    `✅ *Report received* for ${number}.`,
    `📊 Total community reports: ${result.reportCount}`,
    '',
    'Thank you for helping protect others.',
    'ℹ️ To report cyber fraud: cybercrime.gov.in or call 1930.',
  ];
  return lines.join('\n');
}

/**
 * Format the help / greeting message shown for "hi", "help", "menu".
 * @returns {string}
 */
function formatHelpReply() {
  return [
    '👋 *Welcome to DialSafe!*',
    'Protect yourself from fake customer care scams.',
    SEP,
    '*What can I do?*',
    '',
    '1️⃣ *Check a number*',
    '   Send a phone number (with or without a brand name):',
    '   _+91 98765 43210_',
    '   _+91 98765 43210 Zomato_',
    '',
    '2️⃣ *Find official care number*',
    '   Ask for a brand\'s official number:',
    '   _Zomato care number_',
    '   _official number for Swiggy_',
    '',
    '3️⃣ *Report a scam number*',
    '   _report +91 98765 43210 [optional note]_',
    '',
    '4️⃣ *This menu*',
    '   _hi_ or _help_',
    SEP,
    '🚨 Cyber fraud helpline: *1930*',
    '🌐 Website: cybercrime.gov.in',
  ].join('\n');
}

/**
 * Format a reply for an unrecognized brand or message.
 * @param {string} [input] - what the user sent
 * @returns {string}
 */
function formatUnrecognizedReply(input) {
  const lines = [
    '❓ *Not found in our verified list.*',
  ];
  if (input) {
    lines.push(`We couldn\'t find a brand matching: _${input}_`);
  }
  lines.push('');
  lines.push('Please check the company\'s *official website or app* for their contact number.');
  lines.push('');
  lines.push('Send *help* for usage instructions.');
  return lines.join('\n');
}

/**
 * Format a generic error reply.
 * @returns {string}
 */
function formatErrorReply() {
  return [
    '⚠️ Something went wrong while processing your request.',
    'Please try again in a moment.',
    '',
    'If the problem persists, check: cybercrime.gov.in or call 1930.',
  ].join('\n');
}

/**
 * Format an invalid number reply.
 * @param {string} input
 * @returns {string}
 */
function formatInvalidNumberReply(input) {
  return [
    `❌ *"${input}"* doesn't look like a valid Indian phone number.`,
    '',
    'Please send a number in one of these formats:',
    '• _+91 98765 43210_',
    '• _98765 43210_',
    '• _1800-123-4567_ (toll-free)',
    '',
    'Send *help* for full instructions.',
  ].join('\n');
}

/**
 * Build the website detail URL for a phone number.
 * Falls back gracefully if FRONTEND_URL is not configured.
 * @param {string} number
 * @returns {string}
 */
function buildDetailUrl(number) {
  const base = config.frontendUrl;
  if (!base || !number) return '';
  return `${base}/number/${encodeURIComponent(number)}`;
}

module.exports = {
  formatCheckReply,
  formatBrandReply,
  formatReportReply,
  formatHelpReply,
  formatUnrecognizedReply,
  formatErrorReply,
  formatInvalidNumberReply,
};
