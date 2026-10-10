const express = require('express');
const router = express.Router();
const config = require('../config');
const { extractNumber, normalizeNumber } = require('../services/numbers');
const { findBrandByNameOrAlias, findBrandByOfficialNumber, getBrandWithFakeNumbers } = require('../services/brands');
const { getReportCount, addReport } = require('../services/reports');
const { logCheck } = require('../services/checks');
const { detect } = require('../engine');

const HELP_TRIGGERS = new Set(['hi', 'hello', 'hey', 'help', 'menu', 'start', 'helo', 'hii', 'hiii', 'hai']);
const PHONE_RE = /(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}|(?:\+91[\s\-]?)?\d{10}|1800[\s\-]?\d{3}[\s\-]?\d{3,4}|1860[\s\-]?\d{3}[\s\-]?\d{4}/;

function buildTwiML(text) {
  const safe = (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

function formatHelpReply() {
  return [
    '🛡️ *DialSafe* — Phone Scam Detection',
    '',
    'I help you verify phone numbers and find official customer care contacts.',
    '',
    '*How to use:*',
    '• Send a phone number to check if it looks like a scam',
    '  _e.g. 9876543210 or +91 98765 43210_',
    '',
    '• Send a brand name to get their official care number',
    '  _e.g. SBI, Zomato, Amazon, Paytm, Flipkart_',
    '',
    '• Report a suspicious number:',
    '  _report 9876543210 [optional note]_',
  ].join('\n');
}

router.post('/', async (req, res) => {
  res.type('text/xml');

  const rawBody = req.body?.Body || req.body?.text || req.body?.message || '';
  const from = req.body?.From || '';
  const numMedia = parseInt(req.body?.NumMedia || '0', 10);
  const body = String(rawBody).trim();

  if (numMedia > 0 && !body) {
    return res.send(buildTwiML('DialSafe can only process text messages. Please send a phone number or brand name.'));
  }

  if (!body) {
    return res.send(buildTwiML(formatHelpReply()));
  }

  const lower = body.toLowerCase();

  // 1. Help intent
  if (HELP_TRIGGERS.has(lower) || lower === 'help me') {
    return res.send(buildTwiML(formatHelpReply()));
  }

  // 2. Report intent
  if (lower.startsWith('report ')) {
    const rest = body.slice(7).trim();
    const match = rest.match(PHONE_RE);
    if (!match) {
      return res.send(buildTwiML('❌ Could not find a phone number in your report.\n\nFormat: _report +91 98765 43210 [optional note]_'));
    }
    const rawNumber = match[0];
    const note = rest.replace(rawNumber, '').trim() || undefined;
    try {
      const rep = await addReport({ number: rawNumber, note, source: 'whatsapp', reporterId: from || undefined });
      const reply = [
        '✅ *Report submitted*',
        `Number: ${rawNumber}`,
        `Total reports for this number: ${rep.reportCount || 1}`,
        '',
        'Thank you for helping protect the community.',
        'Never share OTPs, passwords, or UPI PINs with anyone.'
      ].join('\n');
      return res.send(buildTwiML(reply));
    } catch (err) {
      return res.send(buildTwiML('⚠️ Could not save your report. Please try again.'));
    }
  }

  // 3. Number check intent
  const foundNumber = extractNumber(body);
  if (foundNumber) {
    const remainingText = body.replace(foundNumber, '').trim();
    let brandRecord = null;
    if (remainingText) {
      brandRecord = await findBrandByNameOrAlias(remainingText);
    }
    const officialBrandMatch = await findBrandByOfficialNumber(foundNumber);
    if (officialBrandMatch && !brandRecord) {
      brandRecord = officialBrandMatch;
    }

    const reportCount = await getReportCount(foundNumber);
    const detectionResult = detect({
      number: foundNumber,
      brandRecord,
      reportCount,
      claimedBrandName: brandRecord ? brandRecord.name : (remainingText || null)
    });

    logCheck({
      number: foundNumber,
      brand: brandRecord ? brandRecord.name : null,
      verdict: detectionResult.verdictCode,
      score: detectionResult.score,
      channel: 'whatsapp'
    }).catch(() => {});

    const emoji = {
      'verified_official': '✅',
      'high_risk': '🚨',
      'suspicious': '⚠️',
      'unknown': '❓'
    }[detectionResult.verdictCode] || '❓';

    const lines = [
      `${emoji} *${detectionResult.verdict}*`,
      `Number: ${foundNumber}`
    ];
    if (brandRecord) lines.push(`Brand: ${brandRecord.name}`);
    lines.push('──────────────────');
    if (detectionResult.reasons?.length) {
      lines.push('*Why:*');
      detectionResult.reasons.forEach(r => lines.push(`• ${r}`));
    }
    if (reportCount > 0) {
      lines.push(`📊 Reported ${reportCount} time(s) by the community.`);
    }
    if (brandRecord?.official_numbers?.length) {
      lines.push(`\n📞 Official number: ${brandRecord.official_numbers[0]}`);
    }
    if (detectionResult.advice?.length) {
      lines.push('──────────────────');
      detectionResult.advice.forEach(a => lines.push(`ℹ️ ${a}`));
    }
    const cleanFrontendUrl = (config.frontendUrl || 'http://localhost:5173').replace(/\/+$/, '');
    lines.push(`🔗 Full details: ${cleanFrontendUrl}/number/${encodeURIComponent(foundNumber)}`);

    return res.send(buildTwiML(lines.join('\n')));
  }

  // 4. Brand lookup intent
  const brandData = await getBrandWithFakeNumbers(body);
  if (brandData) {
    const lines = [
      `📋 *Official care numbers for ${brandData.name || brandData.brand}*`,
      '──────────────────'
    ];
    if (brandData.official_numbers?.length || brandData.officialNumbers?.length) {
      const nums = brandData.official_numbers || brandData.officialNumbers;
      nums.forEach(n => lines.push(`📞 ${n}`));
    } else {
      lines.push('No phone helpline — support is app-only.');
    }
    if (brandData.source_url || brandData.sourceUrl) {
      lines.push(`\n✅ Verified from: ${brandData.source_url || brandData.sourceUrl}`);
    }
    return res.send(buildTwiML(lines.join('\n')));
  }

  // 5. Unrecognized
  const unrec = [
    '❓ *Not in our verified brand list*',
    '',
    `We could not find verified records for "${body}".`,
    '',
    '• Search the company\'s official website or app directly.',
    '• Never trust phone numbers shown in search engine ads or social media comments.',
    '• Dial 1930 or visit cybercrime.gov.in to report cyber fraud.'
  ].join('\n');
  return res.send(buildTwiML(unrec));
});

module.exports = router;
