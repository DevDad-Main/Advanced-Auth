import { AppError, logger } from "devdad-express-utils";

export async function clearRedisUserCache(req, id) {
  const keys = await req.redisClient.keys(`user_profile:${id}`);

  logger.debug("Found Redis cache keys for user", { userId: id, keyCount: keys.length });

  if (Array.isArray(keys) && keys.length > 0) {
    await req.redisClient.unlink(keys);
  }

  // Also clear any related profile cache patterns
  const relatedKeys = await req.redisClient.keys(`*profile*${id}*`);
  if (Array.isArray(relatedKeys) && relatedKeys.length > 0) {
    logger.debug("Cleared additional Redis cache keys", { userId: id, relatedKeyCount: relatedKeys.length });
    await req.redisClient.unlink(relatedKeys);
  }

  // Clear user connections cache
  const connectionsKeys = await req.redisClient.keys(`user_connections:${id}`);
  if (Array.isArray(connectionsKeys) && connectionsKeys.length > 0) {
    logger.debug("Cleared user connections cache keys", { userId, connectionsKeyCount: connectionsKeys.length });
    await req.redisClient.unlink(connectionsKeys);
  }
}

export async function clearRedisUserConnectionsCache(req, userId) {
  const cacheKey = `user_connections:${userId}`;
  if (!cacheKey) {
    logger.warn("User Connections Cache Key Not Found");
    return;
  }

  await req.redisClient.unlink(cacheKey);
  logger.debug("Cleared user connections cache", { userId });
}

export async function clearRedisConnectionsCacheForMultipleUsers(req, userIds) {
  if (!Array.isArray(userIds)) return;

  const cacheKeys = userIds.map((id) => `user_connections:${id}`);

  logger.debug("Clearing connections cache for users", { userIds, keyCount: cacheKeys.length });
  const existingKeys = [];

  for (const key of cacheKeys) {
    const exists = await req.redisClient.exists(key);
    if (exists) {
      existingKeys.push(key);
    }
  }

  if (existingKeys.length > 0) {
    await req.redisClient.unlink(existingKeys);
    logger.debug("Cleared connections cache for multiple users", { existingKeyCount: existingKeys.length });
  }
}

export async function clearRedisPostCache(req, input) {
  const cachedPostKey = `post:${input}`;

  if (!cachedPostKey) {
    throw new AppError(`Invalid Post ID: ${input}`, 400, [
      "Redis Cached Post Key Not Found",
      "Please Make Sure You Are Passing The Correct Post ID",
    ]);
  }

  await req.redisClient.unlink(cachedPostKey);
}
