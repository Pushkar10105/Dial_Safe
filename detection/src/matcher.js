/**
 * detection/src/matcher.js
 * Brand name and alias matching utilities.
 */

// Common generic noise suffixes/words in customer inquiries
const NOISE_WORDS = [
  'customer care',
  'customercare',
  'customer service',
  'customersupport',
  'customer support',
  'helpline number',
  'helpline',
  'care number',
  'care',
  'support number',
  'support',
  'toll free',
  'tollfree',
  'official number',
  'official',
  'number',
  'contact',
  'pvt ltd',
  'private limited',
  'ltd'
];

/**
 * Normalises a brand query string by stripping punctuation, extra whitespace,
 * and common user suffixes (e.g., "care", "customer care", "support").
 *
 * @param {string} query
 * @returns {string}
 */
function cleanBrandQuery(query) {
  if (!query || typeof query !== 'string') return '';

  let cleaned = query.toLowerCase().trim();

  // Remove punctuation except alphanumeric and spaces
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip known noise phrases from the end or start
  for (const phrase of NOISE_WORDS) {
    if (cleaned === phrase) continue; // Don't strip if query is solely that word
    const regexEnd = new RegExp(`\\b${phrase}\\b$`, 'g');
    const regexStart = new RegExp(`^\\b${phrase}\\b`, 'g');
    cleaned = cleaned.replace(regexEnd, '').replace(regexStart, '').trim();
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Matches a user brand query against a list of brand objects.
 * Brand object shape expected:
 * { id, name, aliases: string[], official_numbers: string[] }
 *
 * @param {string} query - Raw search string from user (e.g. "zomato care")
 * @param {Array<Object>} brandList - List of brand records from DB or seed
 * @returns {Object|null} - Best matched brand record or null
 */
function matchBrand(query, brandList = []) {
  if (!query || typeof query !== 'string' || !Array.isArray(brandList) || brandList.length === 0) {
    return null;
  }

  const rawLower = query.toLowerCase().trim();
  const cleaned = cleanBrandQuery(query);

  // 1. Exact match on official brand name (case-insensitive)
  for (const brand of brandList) {
    if (brand.name && brand.name.toLowerCase().trim() === rawLower) {
      return brand;
    }
  }

  // 2. Exact match on aliases
  for (const brand of brandList) {
    if (Array.isArray(brand.aliases)) {
      for (const alias of brand.aliases) {
        if (alias.toLowerCase().trim() === rawLower) {
          return brand;
        }
      }
    }
  }

  // 3. Cleaned token match against brand name
  if (cleaned) {
    for (const brand of brandList) {
      const brandCleaned = cleanBrandQuery(brand.name);
      if (brandCleaned && brandCleaned === cleaned) {
        return brand;
      }
    }

    // 4. Cleaned token match against brand aliases
    for (const brand of brandList) {
      if (Array.isArray(brand.aliases)) {
        for (const alias of brand.aliases) {
          const aliasCleaned = cleanBrandQuery(alias);
          if (aliasCleaned && aliasCleaned === cleaned) {
            return brand;
          }
        }
      }
    }
  }

  return null;
}

module.exports = {
  cleanBrandQuery,
  matchBrand
};
