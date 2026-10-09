/**
 * client.js — HTTP client for talking to the DialSafe backend API.
 * Uses x-bot-key header for rate-limit bypass (see backend config.js).
 * Ref: docs/API_CONTRACT.md
 */

const axios = require('axios');
const config = require('./config');

const api = axios.create({
  baseURL: config.backendUrl,
  timeout: 12000,   // 12 s — Twilio waits up to 15 s for a reply
  headers: {
    'Content-Type': 'application/json',
    'x-bot-key': config.botApiKey,
  },
});

/**
 * POST /message — universal router endpoint (preferred).
 * Backend classifies free text as number-check or brand-lookup.
 * @param {string} text  - raw message body from user
 * @returns {Promise<Object>} API response body
 */
async function postMessage(text) {
  const { data } = await api.post('/message', { text, channel: 'whatsapp' });
  return data;
}

/**
 * POST /check — explicit number check.
 * @param {string} number  - phone number (any format)
 * @param {string} [brand] - optional brand name
 */
async function checkNumber(number, brand) {
  const body = { number };
  if (brand) body.brand = brand;
  const { data } = await api.post('/check', body);
  return data;
}

/**
 * GET /brand/:name — official care number lookup.
 * @param {string} name - brand name or alias
 */
async function getBrand(name) {
  const { data } = await api.get(`/brand/${encodeURIComponent(name)}`);
  return data;
}

/**
 * POST /report — flag a scam number.
 * @param {string} number
 * @param {string} [brand]
 * @param {string} [note]
 */
async function reportNumber(number, brand, note) {
  const body = { number, source: 'whatsapp' };
  if (brand) body.brand = brand;
  if (note)  body.note  = note;
  const { data } = await api.post('/report', body);
  return data;
}

module.exports = { postMessage, checkNumber, getBrand, reportNumber };
