/**
 * Number normalization, validation, extraction, and masking.
 */

/**
 * Normalizes a phone number according to Indian phone numbering conventions.
 * @param {string|null|undefined} raw
 * @returns {{ valid: boolean, normalized: string|null, type: 'mobile'|'tollfree'|'landline'|null }}
 */
function normalizeNumber(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: null, type: null };
  }

  // Strip spaces, dashes, brackets, dots, parentheses, slashes
  let clean = raw.trim().replace(/[\s\-\(\)\.\/]+/g, '');

  if (!clean) {
    return { valid: false, normalized: null, type: null };
  }

  // 1. Toll-free check: starts with 1800 or 1860 (can be preceded by +91 or 0)
  let tollFreeCandidate = clean;
  if (tollFreeCandidate.startsWith('+91')) {
    tollFreeCandidate = tollFreeCandidate.slice(3);
  } else if (tollFreeCandidate.startsWith('0')) {
    tollFreeCandidate = tollFreeCandidate.slice(1);
  }

  if (/^(1800|1860)\d{6,7}$/.test(tollFreeCandidate)) {
    return {
      valid: true,
      normalized: tollFreeCandidate,
      type: 'tollfree'
    };
  }

  // 2. Indian Mobile check: 10 digits starting with 6, 7, 8, 9 
  // (also allows sample test pattern +91 00000 xxxxx per AGENTS.md rules)
  // Allowed prefixes: '+91', '91', '0'
  const isMobilePattern = (digits) => /^(?:[6-9]\d{9}|00000\d{5})$/.test(digits);
  let mobileDigits = null;

  if (clean.startsWith('+91')) {
    const rest = clean.slice(3);
    if (isMobilePattern(rest)) {
      mobileDigits = rest;
    }
  } else if (/^91(?:[6-9]\d{9}|00000\d{5})$/.test(clean)) {
    mobileDigits = clean.slice(2);
  } else if (/^0[6-9]\d{9}$/.test(clean)) {
    mobileDigits = clean.slice(1);
  } else if (isMobilePattern(clean)) {
    mobileDigits = clean;
  }


  if (mobileDigits) {
    return {
      valid: true,
      normalized: `+91${mobileDigits}`,
      type: 'mobile'
    };
  }

  // 3. Indian Landline check (STD code + number, 10 or 11 digits, usually starts with 0 or area code)
  let landlineCandidate = clean.startsWith('+91') ? clean.slice(3) : clean;
  if (/^0?[1-8]\d{8,10}$/.test(landlineCandidate)) {
    // Digits only
    const digitsOnly = landlineCandidate.startsWith('0') ? landlineCandidate : `0${landlineCandidate}`;
    if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
      return {
        valid: true,
        normalized: digitsOnly,
        type: 'landline'
      };
    }
  }

  return { valid: false, normalized: null, type: null };
}

/**
 * Extracts the first phone-number-like sequence inside free text.
 * @param {string} text
 * @returns {string|null}
 */
function extractNumber(text) {
  if (!text || typeof text !== 'string') return null;

  // Patterns: +91 xxxxx xxxxx, 10-digit mobile, toll-free 1800/1860
  const patterns = [
    /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b/,
    /(?:\+91[\-\s]?)?[6-9]\d{9}\b/,
    /\b(?:1800|1860)[\-\s]?\d{3}[\-\s]?\d{3,4}\b/,
    /\b0\d{2,4}[\-\s]?\d{6,8}\b/
  ];

  for (const regex of patterns) {
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
 * Masks a phone number for privacy display on dashboard/UI.
 * e.g. '+919876543210' -> '+91 98xxx xx210'
 * @param {string} number
 * @returns {string}
 */
function maskNumber(number) {
  if (!number || typeof number !== 'string') return '';

  if (number.startsWith('+91') && number.length === 13) {
    const digits = number.slice(3); // 10 digits
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
