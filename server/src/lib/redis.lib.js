import Redis from "ioredis";
import { logger } from "devdad-express-utils";

const redisClient = new Redis(process.env.REDIS_URL, {
  family: 4, // force IPv4 (fixes ETIMEDOUT)
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
});

redisClient.on("connect", () => {
  logger.info("✅ Redis connected");
});

redisClient.on("ready", () => {
  logger.info("🟢 Redis ready");
});

redisClient.on("error", (err) => {
  logger.error("❌ Redis error", {
    message: err.message,
    code: err.code,
  });
});

redisClient.on("close", () => {
  logger.warn("⚠️ Redis connection closed");
});

redisClient.on("reconnecting", (time) => {
  logger.warn(`🔄 Redis reconnecting in ${time}ms`);
});

export default redisClient;
