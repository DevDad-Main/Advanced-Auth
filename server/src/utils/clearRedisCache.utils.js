import { AppError } from "devdad-express-utils";

export async function clearRedisUserCache(req, id) {
  const keys = await req.redisClient.keys(`user_profile:${id}`);

  console.log("DEBUG: Redis Cache Keys for user ${id} = ", keys);

  if (Array.isArray(keys) && keys.length > 0) {
    await req.redisClient.unlink(keys);
  }

  // Also clear any related profile cache patterns
  const relatedKeys = await req.redisClient.keys(`*profile*${id}*`);
  if (Array.isArray(relatedKeys) && relatedKeys.length > 0) {
    console.log("DEBUG: Additional Redis Cache Keys cleared = ", relatedKeys);
    await req.redisClient.unlink(relatedKeys);
  }

  // Clear user connections cache
  const connectionsKeys = await req.redisClient.keys(`user_connections:${id}`);
  if (Array.isArray(connectionsKeys) && connectionsKeys.length > 0) {
    console.log(
      "DEBUG: User Connections Cache Keys cleared = ",
      connectionsKeys,
    );
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
  console.log("DEBUG: Cleared user connections cache for user:", userId);
}

export async function clearRedisConnectionsCacheForMultipleUsers(req, userIds) {
  if (!Array.isArray(userIds)) return;

  const cacheKeys = userIds.map((id) => `user_connections:${id}`);

  logger.info("DEBUG: Clearing connections cache for users:", { cacheKeys });
  const existingKeys = [];

  for (const key of cacheKeys) {
    const exists = await req.redisClient.exists(key);
    if (exists) {
      existingKeys.push(key);
    }
  }

  if (existingKeys.length > 0) {
    await req.redisClient.unlink(existingKeys);
    console.log("DEBUG: Cleared connections cache for users:", existingKeys);
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
