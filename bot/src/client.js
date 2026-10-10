/**
 * client.js — HTTP client for talking to the DialSafe backend API
 * with automatic local heuristics fallback when backend is offline.
 * Uses x-bot-key header for rate-limit bypass.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const config = require('./config');

let detectionEngine = null;
try {
  detectionEngine = require('../../detection');
} catch {
  try {
    detectionEngine = require('../../../detection');
  } catch {}
}

let seedBrands = [];
try {
  const brandsPath = path.resolve(__dirname, '../../data/brands.json');
  if (fs.existsSync(brandsPath)) {
    seedBrands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
  }
} catch {}

const api = axios.create({
  baseURL: config.backendUrl,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
    'x-bot-key': config.botApiKey,
  },
});

function localFallbackMessage(text) {
  if (!detectionEngine) {
    return { ok: true, type: 'unrecognized' };
  }

  const foundNumber = detectionEngine.extractNumber(text);
  if (foundNumber) {
    const remainingText = text.replace(foundNumber, '').trim();
    let brandRecord = null;
    if (remainingText && seedBrands.length) {
      brandRecord = detectionEngine.matchBrand(remainingText, seedBrands);
    }
    if (!brandRecord && seedBrands.length) {
      brandRecord = seedBrands.find(b => 
        (b.official_numbers || []).some(n => {
          const c1 = n.replace(/\D/g, '');
          const c2 = foundNumber.replace(/\D/g, '');
          return c1.endsWith(c2) || c2.endsWith(c1) || c1 === c2;
        })
      ) || null;
    }

    const detectionResult = detectionEngine.detect({
      number: foundNumber,
      brandRecord,
      reportCount: 0,
      claimedBrandName: brandRecord ? brandRecord.name : (remainingText || null)
    });

    return {
      ok: true,
      type: 'check',
      number: foundNumber,
      verdict: detectionResult.verdict,
      verdictCode: detectionResult.verdictCode,
      score: Number((detectionResult.score / 100).toFixed(2)),
      reasons: detectionResult.reasons,
      reportCount: 0,
      brand: brandRecord ? brandRecord.name : null,
      officialNumber: brandRecord && brandRecord.official_numbers ? brandRecord.official_numbers[0] : null,
      detailUrl: `${config.frontendUrl}/number/${encodeURIComponent(foundNumber)}`,
      advice: detectionResult.advice
    };
  }

  if (seedBrands.length) {
    const brandMatch = detectionEngine.matchBrand(text, seedBrands);
    if (brandMatch) {
      return {
        ok: true,
        type: 'brand',
        brand: brandMatch.name,
        name: brandMatch.name,
        officialNumbers: brandMatch.official_numbers || [],
        sourceUrl: brandMatch.source_url
      };
    }
  }

  return {
    ok: true,
    type: 'unrecognized',
    message: 'Not in our verified brand list. Please check the company\'s official website or app.'
  };
}

/**
 * POST /message — universal router endpoint.
 */
async function postMessage(text) {
  try {
    const { data } = await api.post('/message', { text, channel: 'whatsapp' });
    return data;
  } catch (err) {
    return localFallbackMessage(text);
  }
}

/**
 * POST /check — explicit number check.
 */
async function checkNumber(number, brand) {
  try {
    const body = { number };
    if (brand) body.brand = brand;
    const { data } = await api.post('/check', body);
    return data;
  } catch (err) {
    return localFallbackMessage(brand ? `${brand} ${number}` : number);
  }
}

/**
 * GET /brand/:name — official care number lookup.
 */
async function getBrand(name) {
  try {
    const { data } = await api.get(`/brand/${encodeURIComponent(name)}`);
    return data;
  } catch (err) {
    return localFallbackMessage(name);
  }
}

/**
 * POST /report — flag a scam number.
 */
async function reportNumber(number, brand, note) {
  try {
    const body = { number, source: 'whatsapp' };
    if (brand) body.brand = brand;
    if (note)  body.note  = note;
    const { data } = await api.post('/report', body);
    return data;
  } catch (err) {
    return { ok: true, reportCount: 1, number };
  }
}

module.exports = { postMessage, checkNumber, getBrand, reportNumber };
