const redis = require('redis');
const config = require('../config/env');
const logger = require('./logger');

let redisClient = null;

const initRedis = async () => {
  if (!config.REDIS_URL && !config.REDIS_HOST) {
    logger.info('Redis configuration not provided. Caching is disabled.');
    return null;
  }

  const url = config.REDIS_URL || `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`;

  try {
    redisClient = redis.createClient({ 
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection failed after 3 attempts. Disabling client.');
            return false; // Stop retrying
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      // Don't log full error if it's just a connection refusal during startup
      if (err.code === 'ECONNREFUSED') {
        logger.warn('Redis connection refused. Caching temporarily unavailable.');
      } else {
        logger.error('Redis Client Error', err);
      }
    });

    redisClient.on('connect', () => logger.info('Redis Client Connected'));

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.warn(`Redis connection failed: ${err.message}. Feature will be disabled.`);
    redisClient = null;
    return null;
  }
};

const getClient = () => redisClient;

const clearCachePattern = async (pattern) => {
  if (!redisClient || !redisClient.isReady) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error('Error clearing cache pattern', error);
  }
};

module.exports = { initRedis, getClient, clearCachePattern };
