import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

// In-memory fallback cache for when Redis is unavailable
const localCache = new Map<string, { value: string, expiry: number }>();

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  let instance: Redis | null = null;
  try {
    instance = new Redis(config.redis.url, {
      maxRetriesPerRequest: 0,   // don't retry per-command
      lazyConnect: true,
      enableReadyCheck: true,
      retryStrategy: () => null, // disable auto-reconnect entirely
    });

    // One-time error handler so ioredis doesn't throw unhandled rejections
    instance.once('error', () => {/* swallowed — handled in catch below */});

    await instance.connect();

    // Only attach the persistent error handler after a successful connect
    instance.on('connect', () => logger.info('✅ Redis connected'));
    instance.on('error', (err) => {
      logger.warn(`⚠️  Redis error (app will continue without cache): ${err.message}`);
      instance?.disconnect();
      redisClient = null;
    });

    redisClient = instance;
    logger.info('✅ Redis connected');
  } catch {
    logger.warn('⚠️  Redis unavailable — continuing without cache');
    // Cleanly tear down the instance so it stops retrying
    try { instance?.disconnect(); } catch { /* ignore */ }
    redisClient = null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redisClient) {
    const cached = localCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      localCache.delete(key);
      return null;
    }
    return cached.value;
  }
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  if (!redisClient) {
    localCache.set(key, { value, expiry: Date.now() + (ttlSeconds * 1000) });
    return;
  }
  try {
    await redisClient.setex(key, ttlSeconds, value);
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) {
    localCache.delete(key);
    return;
  }
  try {
    await redisClient.del(key);
  } catch {
    // silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redisClient) {
    // Simple wildcard match for fallback cache
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of localCache.keys()) {
      if (regex.test(key)) {
        localCache.delete(key);
      }
    }
    return;
  }
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {
    // silently fail
  }
}
