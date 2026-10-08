const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend folder first, or project root if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  botApiKey: process.env.BOT_API_KEY || 'change-me',
  demoMode: process.env.DEMO_MODE === 'true',
  duplicateWindowMinutes: parseInt(process.env.DUPLICATE_WINDOW_MINUTES || '10', 10),
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;
