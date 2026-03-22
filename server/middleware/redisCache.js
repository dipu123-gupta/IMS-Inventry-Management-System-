const { getClient } = require('../utils/redisClient');
const logger = require('../utils/logger');

const redisCache = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Determine the organization ID to namespace the cache correctly
    const orgId = req.organization ? req.organization.toString() : 'guest';
    const client = getClient();

    // If Redis is not connected or in development skip cache gracefully
    if (!client || !client.isReady || process.env.NODE_ENV === 'development' && !process.env.FORCE_CACHE) {
      return next();
    }

    // Generate unique key based on full URL and payload (useful for POST/filter queries if needed)
    const key = `cache:${orgId}:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await client.get(key);
      if (cachedResponse) {
        // Cache Hit
        logger.debug(`Cache Hit for ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }

      // Cache Miss - Proxy the res.json method
      const originalJson = res.json.bind(res);
      
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
             client.setEx(key, ttlSeconds, JSON.stringify(body));
             logger.debug(`Cache Set for ${key} (TTL ${ttlSeconds}s)`);
          } catch (err) {
            logger.error(`Error setting cache for ${key}`, err);
          }
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Redis cache middleware error', error);
      next(); // Fail open - proceed without caching if Redis errors
    }
  };
};

module.exports = redisCache;
