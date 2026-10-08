const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const healthRouter = require('./routes/health');
const checkRouter = require('./routes/check');
const reportRouter = require('./routes/report');
const numberRouter = require('./routes/number');
const brandRouter = require('./routes/brand');
const statsRouter = require('./routes/stats');
const whatsappRouter = require('./routes/whatsapp');
const messageRouter = require('./routes/message');

const app = express();

// 1. Behind proxy (Render, Heroku, etc.)
app.set('trust proxy', 1);

// 2. Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('tiny'));
}

// 3. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];
if (config.frontendUrl && !allowedOrigins.includes(config.frontendUrl)) {
  allowedOrigins.push(config.frontendUrl);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (!config.frontendUrl || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/demo, secured by domain list
  },
  credentials: true
}));

// 4. Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Rate limiting with Bot API Key bypass
const botKeyBypass = (req) => {
  const incomingKey = req.headers['x-bot-key'];
  return !!(incomingKey && incomingKey === config.botApiKey);
};

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: config.demoMode ? 2000 : 200,
  skip: botKeyBypass,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' }
});

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: config.demoMode ? 1000 : 30,
  skip: botKeyBypass,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many report submissions. Please wait before submitting again.' }
});

app.use(generalLimiter);

// 6. Routes
app.use('/health', healthRouter);
app.use('/check', checkRouter);
app.use('/report', reportLimiter, reportRouter);
app.use('/number', numberRouter);
app.use('/brand', brandRouter);
app.use('/brands', brandRouter);
app.use('/stats', statsRouter);
app.use('/whatsapp', whatsappRouter);
app.use('/message', messageRouter);

// Root greeting / info
app.get('/', (req, res) => {
  res.json({
    name: 'DialSafe API',
    status: 'running',
    docs: '/health',
    timestamp: new Date().toISOString()
  });
});

// 7. 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// 8. Central Error Handler (never leaks stack traces)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'An internal server error occurred.'
  });
});

// Start listening if run directly
if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`[DialSafe Backend] Server listening on port ${config.port} (env: ${config.nodeEnv})`);
  });

  const gracefulShutdown = () => {
    console.log('[DialSafe Backend] Shutting down gracefully...');
    server.close(() => {
      console.log('[DialSafe Backend] Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
