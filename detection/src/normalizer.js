/**
 * detection/src/normalizer.js
 * Phone number normalisation, validation, classification, and masking.
 * Follows Indian telecom (DOT/TRAI) standards and DialSafe project guidelines.
 */

/**
 * Normalises a raw phone number string into canonical DialSafe format.
 * - Mobile: +91XXXXXXXXXX (10 digits starting with 6, 7, 8, or 9, or sample pattern 00000xxxxx)
 * - Toll-Free: 1800xxxxxxx or 1860xxxxxxx (without country code)
 * - Landline: 0<STD><Number> (10 or 11 digits starting with 0)
 *
 * @param {string|null|undefined} raw - Raw input string
 * @returns {{
 *   valid: boolean,
 *   normalized: string|null,
 *   type: 'mobile'|'tollfree'|'landline'|null,
 *   error: string|null
 * }}
 */
function normalizeNumber(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: null, type: null, error: 'Input must be a non-empty string.' };
  }

  // Strip all whitespace, dashes, dots, brackets, parentheses, and slashes
  const clean = raw.trim().replace(/[\s\-\(\)\.\/]+/g, '');

  if (!clean) {
    return { valid: false, normalized: null, type: null, error: 'Empty phone number string.' };
  }

  // 1. Toll-Free / Shared Cost numbers (1800 / 1860)
  // Usually 10 or 11 digits: e.g. 1800 111 222 or 1800 123 4567
  let tollFreeCandidate = clean;
  if (tollFreeCandidate.startsWith('+91')) {
    tollFreeCandidate = tollFreeCandidate.slice(3);
  } else if (tollFreeCandidate.startsWith('91') && tollFreeCandidate.length >= 12) {
    tollFreeCandidate = tollFreeCandidate.slice(2);
  } else if (tollFreeCandidate.startsWith('0')) {
    tollFreeCandidate = tollFreeCandidate.slice(1);
  }

  if (/^(1800|1860)\d{6,7}$/.test(tollFreeCandidate)) {
    return {
      valid: true,
      normalized: tollFreeCandidate,
      type: 'tollfree',
      error: null
    };
  }

  // 2. Indian Mobile Numbers
  // 10 digits starting with 6, 7, 8, 9 (or sample test pattern 00000xxxxx per AGENTS.md)
  const isMobileDigits = (digits) => /^(?:[6-9]\d{9}|00000\d{5})$/.test(digits);
  let mobileDigits = null;

  if (clean.startsWith('+91')) {
    const rest = clean.slice(3);
    if (isMobileDigits(rest)) {
      mobileDigits = rest;
    }
  } else if (/^91(?:[6-9]\d{9}|00000\d{5})$/.test(clean)) {
    mobileDigits = clean.slice(2);
  } else if (/^0(?:[6-9]\d{9}|00000\d{5})$/.test(clean)) {
    mobileDigits = clean.slice(1);
  } else if (isMobileDigits(clean)) {
    mobileDigits = clean;
  }

  if (mobileDigits) {
    return {
      valid: true,
      normalized: `+91${mobileDigits}`,
      type: 'mobile',
      error: null
    };
  }

  // 3. Indian Landline Numbers (STD code + local subscriber number)
  // Total 10-11 digits, prefixed with STD code starting with 0 (e.g., 011 23456789, 080 12345678)
  let landlineCandidate = clean.startsWith('+91') ? clean.slice(3) : clean;
  if (/^0?[1-8]\d{8,10}$/.test(landlineCandidate)) {
    const formattedLandline = landlineCandidate.startsWith('0') ? landlineCandidate : `0${landlineCandidate}`;
    if (formattedLandline.length >= 10 && formattedLandline.length <= 11) {
      return {
        valid: true,
        normalized: formattedLandline,
        type: 'landline',
        error: null
      };
    }
  }

  return {
    valid: false,
    normalized: null,
    type: null,
    error: 'Invalid number format. Expected valid Indian mobile (+91), toll-free (1800/1860), or landline number.'
  };
}

/**
 * Extracts the first recognizable phone number substring from free text.
 * Designed for message parsing (WhatsApp bot, web input).
 *
 * @param {string} text
 * @returns {string|null} - Normalized phone number string, or null if none found
 */
function extractNumber(text) {
  if (!text || typeof text !== 'string') return null;

  // Patterns to scan:
  // 1. Mobile with optional +91, space, or dash: +91 98765 43210 or 9876543210
  // 2. Toll-free 1800/1860
  // 3. Landline STD codes
  const candidateRegexes = [
    /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b/,
    /(?:\+91[\-\s]?)?[6-9]\d{9}\b/,
    /(?:\+91[\-\s]?)?00000[\-\s]?\d{5}\b/, // sample test pattern
    /\b(?:1800|1860)[\-\s]?\d{3}[\-\s]?\d{3,4}\b/,
    /\b0\d{2,4}[\-\s]?\d{6,8}\b/
  ];

  for (const regex of candidateRegexes) {
    const match = text.match(regex);
    if (match) {
      const parsed = normalizeNumber(match[0]);
      if (parsed.valid) {
        return parsed.normalized;
      }
    }
  }

  return null;
}

/**
 * Masks a phone number to protect user privacy in logs and UI.
 * e.g., '+919876543210' -> '+91 98xxx xx210'
 *
 * @param {string} number
 * @returns {string}
 */
function maskNumber(number) {
  if (!number || typeof number !== 'string') return '';

  if (number.startsWith('+91') && number.length === 13) {
    const digits = number.slice(3);
    return `+91 ${digits.slice(0, 2)}xxx xx${digits.slice(-3)}`;
  }

  if (number.length >= 8) {
    const start = number.slice(0, 4);
    const end = number.slice(-3);
    return `${start} xxx ${end}`;
  }

  return number;
}

module.exports = {
  normalizeNumber,
  extractNumber,
  maskNumber
};
