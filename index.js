// index.js
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auto-monetization-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files aus dem Ordner "public" with caching
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
  })
);

// Health Check with enhanced information
app.get('/api/health', (req, res) => {
  try {
    const healthData = {
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      pid: process.pid
    };

    logger.info('Health check requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`✅ Server läuft auf Port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;
