// automation.js
// Enhanced TikTok shop automation with security and error handling

require('dotenv').config();
const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'automation' },
  transports: [
    new winston.transports.File({
      filename: 'logs/automation-error.log',
      level: 'error'
    }),
    new winston.transports.File({ filename: 'logs/automation.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Validate required environment variables
const requiredEnvVars = ['TIKTOK_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', {
    missing: missingEnvVars
  });
  process.exit(1);
}

const API_KEY = process.env.TIKTOK_API_KEY;
const API_BASE_URL =
  process.env.TIKTOK_API_BASE_URL || 'https://example.com/tiktok';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './data';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY) || 1000; // ms

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    logger.info('Output directory created/verified', { dir: OUTPUT_DIR });
  } catch (error) {
    logger.error('Failed to create output directory', {
      error: error.message,
      dir: OUTPUT_DIR
    });
    throw error;
  }
}

// Enhanced fetch with retry logic and validation
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info('Fetching data', { url, attempt, maxRetries: retries });

      const response = await fetch(url, {
        ...options,
        timeout: 30000, // 30 second timeout
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'User-Agent': 'AutoMonetizationSystem/1.0',
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      logger.info('Data fetched successfully', {
        url,
        attempt,
        dataSize: JSON.stringify(data).length
      });

      return data;
    } catch (error) {
      logger.warn('Fetch attempt failed', {
        url,
        attempt,
        error: error.message,
        willRetry: attempt < retries
      });

      if (attempt === retries) {
        logger.error('All fetch attempts failed', {
          url,
          attempts: retries,
          error: error.message
        });
        throw error;
      }

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function fetchTrending() {
  const endpoint = `${API_BASE_URL}/trending`;
  return await fetchWithRetry(endpoint, {});
}

async function updateShop(trends) {
  try {
    // Validate trends data
    if (!Array.isArray(trends)) {
      throw new Error('Trends data must be an array');
    }

    // Sanitize and validate each trend item
    const sanitizedTrends = trends
      .map((trend, index) => {
        if (!trend || typeof trend !== 'object') {
          logger.warn('Invalid trend item', { index, trend });
          return null;
        }

        return {
          id: trend.id || `trend_${index}_${Date.now()}`,
          title: String(trend.title || '').substring(0, 200), // Limit title length
          category: String(trend.category || 'uncategorized'),
          popularity: Number(trend.popularity) || 0,
          timestamp: new Date().toISOString(),
          ...trend
        };
      })
      .filter(Boolean);

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `trends_${timestamp}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Write to file with atomic operation
    const tempFilepath = `${filepath}.tmp`;
    await fs.writeFile(
      tempFilepath,
      JSON.stringify(sanitizedTrends, null, 2),
      'utf8'
    );
    await fs.rename(tempFilepath, filepath);

    // Also update the latest trends file
    const latestFilepath = path.join(OUTPUT_DIR, 'latest-trends.json');
    await fs.writeFile(
      latestFilepath,
      JSON.stringify(sanitizedTrends, null, 2),
      'utf8'
    );

    logger.info('Shop updated successfully', {
      trendCount: sanitizedTrends.length,
      filepath,
      fileSize: (await fs.stat(filepath)).size
    });

    return { success: true, trendCount: sanitizedTrends.length, filepath };
  } catch (error) {
    logger.error('Failed to update shop', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function automationCycle() {
  const startTime = Date.now();
  logger.info('Starting automation cycle');

  try {
    // Ensure output directory exists
    await ensureOutputDir();

    // Fetch trending data
    const trends = await fetchTrending();

    // Validate trends data
    if (!trends || (!Array.isArray(trends) && !Array.isArray(trends.data))) {
      throw new Error('Invalid trends data structure');
    }

    const trendsArray = Array.isArray(trends) ? trends : trends.data;

    // Update shop
    const result = await updateShop(trendsArray);

    const duration = Date.now() - startTime;
    logger.info('Automation cycle completed successfully', {
      duration: `${duration}ms`,
      trendCount: result.trendCount
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Automation cycle failed', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    // Don't throw to prevent cron from stopping
    return { success: false, error: error.message };
  }
}

// Input validation for cron schedule
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 * * * *'; // Default: every hour

function validateCronSchedule(schedule) {
  try {
    return cron.validate(schedule);
  } catch (error) {
    logger.error('Invalid cron schedule', { schedule, error: error.message });
    return false;
  }
}

// Initialize automation
async function initializeAutomation() {
  try {
    logger.info('Initializing automation system');

    // Validate cron schedule
    if (!validateCronSchedule(CRON_SCHEDULE)) {
      throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`);
    }

    // Ensure output directory exists
    await ensureOutputDir();

    // Schedule the automation
    const task = cron.schedule(CRON_SCHEDULE, automationCycle, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    // Start the scheduled task
    task.start();

    logger.info('Automation scheduler initialized', {
      schedule: CRON_SCHEDULE,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    // Run initial cycle if configured
    if (process.env.RUN_ON_START === 'true') {
      logger.info('Running initial automation cycle');
      await automationCycle();
    }

    return task;
  } catch (error) {
    logger.error('Failed to initialize automation', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down automation gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down automation gracefully');
  process.exit(0);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception in automation', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in automation', { reason, promise });
  process.exit(1);
});

// Start the automation system
if (require.main === module) {
  initializeAutomation().catch(error => {
    logger.error('Failed to start automation system', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  automationCycle,
  fetchTrending,
  updateShop,
  initializeAutomation
};
