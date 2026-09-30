import Redis from "ioredis";
import { logger } from "./logger";

const redisUrl = process.env.REDIS_URL?.trim() ?? "";
export const redisConfigured = Boolean(redisUrl);
const redis = redisConfigured ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;
let redisConnected = false;

if (redis) {
  redis.on("ready", () => {
    redisConnected = true;
    logger.info("Redis cache connected");
  });
  redis.on("end", () => {
    redisConnected = false;
  });
  redis.on("error", (error) => {
    redisConnected = false;
    logger.warn({ err: error }, "Redis cache unavailable; using database fallback");
  });
}

async function getRedisClient() {
  if (!redis) return null;
  if (redis.status === "wait") await redis.connect();
  return redis;
}

export async function cacheAside<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  try {
    const client = await getRedisClient();
    if (client) {
      const cached = await client.get(key);
      if (cached) return JSON.parse(cached) as T;
    }
  } catch (error) {
    logger.warn({ err: error, key }, "Redis cache read failed; using database fallback");
  }

  const value = await loader();

  try {
    const client = await getRedisClient();
    if (client) await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.warn({ err: error, key }, "Redis cache write failed; continuing without cache");
  }

  return value;
}

export async function invalidateCache(...keys: string[]) {
  if (!redis || keys.length === 0) return;
  try {
    const client = await getRedisClient();
    if (client) await client.del(...keys);
  } catch (error) {
    logger.warn({ err: error, keys }, "Redis cache invalidation failed");
  }
}

export async function setWorkerHeartbeat(workerId: string) {
  if (!redis) return false;
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.set(`sentinelaml:worker:${workerId}`, new Date().toISOString(), "EX", 15);
    return true;
  } catch (error) {
    logger.warn({ err: error }, "Worker heartbeat could not be written to Redis");
    return false;
  }
}

export async function hasWorkerHeartbeat(workerId: string) {
  if (!redis) return false;
  try {
    const client = await getRedisClient();
    return Boolean(client && (await client.exists(`sentinelaml:worker:${workerId}`)));
  } catch {
    return false;
  }
}

export async function closeRedis() {
  if (redis) await redis.quit();
}

export function getRedisHealth() {
  return { configured: redisConfigured, connected: redisConnected };
}