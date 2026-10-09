/**
 * cli-simulator.js — Interactive terminal simulator for the DialSafe bot.
 *
 * Run this to test the entire bot conversation flow locally WITHOUT Twilio or ngrok.
 * It calls the real backend, so make sure BACKEND_URL is set in bot/.env.
 *
 * Usage:
 *   cd bot
 *   node cli-simulator.js
 */

require('dotenv').config();
const readline = require('readline');
const { routeMessage } = require('./src/router');

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

const DIVIDER = '═'.repeat(50);

console.log(DIVIDER);
console.log('  DialSafe WhatsApp Bot — CLI Simulator');
console.log('  Type messages as if you are a WhatsApp user.');
console.log('  Type "exit" or Ctrl+C to quit.');
console.log(DIVIDER);
console.log();

function prompt() {
  rl.question('You: ', async (input) => {
    const text = input.trim();

    if (!text) {
      return prompt();
    }

    if (text.toLowerCase() === 'exit') {
      console.log('\nGoodbye!');
      rl.close();
      return;
    }

    try {
      const reply = await routeMessage(text, 'whatsapp:+910000000000');
      console.log('\n' + DIVIDER);
      console.log('Bot:\n' + reply);
      console.log(DIVIDER + '\n');
    } catch (err) {
      console.error('\n[ERROR]', err.message, '\n');
    }

    prompt();
  });
}

prompt();
