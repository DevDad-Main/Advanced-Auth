import redisClient from "../lib/redis.lib.js";
import { logger } from "devdad-express-utils";

/**
 * @fileoverview Registration Cleanup Utilities
 *
 * This module provides utilities for cleaning up expired registration sessions
 * and maintaining system hygiene. It includes automatic cleanup of expired
 * sessions and manual cleanup utilities.
 */

//#region Constants
const REGISTRATION_SESSION_PREFIX = "reg_session:";
const CLEANUP_BATCH_SIZE = 100; // Number of keys to process in each batch
//#endregion

/**
 * Cleans up all expired registration sessions
 * Should be called periodically (e.g., via cron job)
 * @returns {Promise<{deleted: number, errors: string[]}>} Cleanup results
 */
export const cleanupExpiredRegistrationSessions = async () => {
  const results = {
    deleted: 0,
    errors: [],
    startTime: new Date().toISOString(),
  };

  try {
    logger.info("Starting expired registration session cleanup");

    // Get all registration session keys
    const sessionKeys = await redisClient.keys(
      `${REGISTRATION_SESSION_PREFIX}*`,
    );

    if (sessionKeys.length === 0) {
      logger.info("No registration sessions found for cleanup");
      return results;
    }

    logger.info(`Found ${sessionKeys.length} registration sessions to check`);

    // Process in batches to avoid blocking Redis
    for (let i = 0; i < sessionKeys.length; i += CLEANUP_BATCH_SIZE) {
      const batch = sessionKeys.slice(i, i + CLEANUP_BATCH_SIZE);

      for (const key of batch) {
        try {
          const sessionData = await redisClient.get(key);

          if (!sessionData) {
            // Key doesn't exist anymore, count as cleaned
            results.deleted++;
            continue;
          }

          const parsedData = JSON.parse(sessionData);
          const expiresAt = new Date(parsedData.expiresAt);

          if (expiresAt < new Date()) {
            // Session has expired, delete it
            await redisClient.del(key);
            results.deleted++;
            logger.debug("Deleted expired registration session", {
              key:
                key.replace(REGISTRATION_SESSION_PREFIX, "").substring(0, 8) +
                "...",
              expiredAt: parsedData.expiresAt,
            });
          }
        } catch (error) {
          const errorMsg = `Failed to process session ${key}: ${error.message}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      // Small delay between batches to avoid overwhelming Redis
      if (i + CLEANUP_BATCH_SIZE < sessionKeys.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    const duration = Date.now() - new Date(results.startTime).getTime();
    logger.info("Registration session cleanup completed", {
      totalChecked: sessionKeys.length,
      deleted: results.deleted,
      errors: results.errors.length,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error.message}`;
    results.errors.push(errorMsg);
    logger.error("Registration session cleanup failed", {
      error: error.message,
    });
  }

  return results;
};

/**
 * Gets statistics about registration sessions
 * @returns {Promise<Object>} Session statistics
 */
export const getRegistrationSessionStats = async () => {
  const stats = {
    totalSessions: 0,
    expiredSessions: 0,
    activeSessions: 0,
    expiringSoon: 0, // Sessions expiring in next 5 minutes
    oldestSession: null,
    newestSession: null,
  };

  try {
    const sessionKeys = await redisClient.keys(
      `${REGISTRATION_SESSION_PREFIX}*`,
    );
    stats.totalSessions = sessionKeys.length;

    if (sessionKeys.length === 0) {
      return stats;
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    let oldestTime = now;
    let newestTime = new Date(0);

    for (const key of sessionKeys) {
      try {
        const sessionData = await redisClient.get(key);
        if (!sessionData) continue;

        const parsedData = JSON.parse(sessionData);
        const expiresAt = new Date(parsedData.expiresAt);
        const createdAt = new Date(parsedData.createdAt);

        if (expiresAt < now) {
          stats.expiredSessions++;
        } else {
          stats.activeSessions++;

          if (expiresAt <= fiveMinutesFromNow) {
            stats.expiringSoon++;
          }
        }

        if (createdAt < oldestTime) {
          oldestTime = createdAt;
          stats.oldestSession = {
            key:
              key.replace(REGISTRATION_SESSION_PREFIX, "").substring(0, 8) +
              "...",
            createdAt: createdAt.toISOString(),
            email: parsedData.userData?.email || "unknown",
          };
        }

        if (createdAt > newestTime) {
          newestTime = createdAt;
          stats.newestSession = {
            key:
              key.replace(REGISTRATION_SESSION_PREFIX, "").substring(0, 8) +
              "...",
            createdAt: createdAt.toISOString(),
            email: parsedData.userData?.email || "unknown",
          };
        }
      } catch (error) {
        logger.error("Failed to process session for stats", {
          key,
          error: error.message,
        });
      }
    }

    logger.info("Registration session statistics", stats);
  } catch (error) {
    logger.error("Failed to get registration session stats", {
      error: error.message,
    });
  }

  return stats;
};

/**
 * Manually cleanup specific registration sessions by email
 * Useful for customer support or manual intervention
 * @param {string} email - Email to cleanup sessions for
 * @returns {Promise<number>} Number of sessions deleted
 */
export const cleanupUserRegistrationSessions = async (email) => {
  let deletedCount = 0;

  try {
    const sessionKeys = await redisClient.keys(
      `${REGISTRATION_SESSION_PREFIX}*`,
    );

    for (const key of sessionKeys) {
      try {
        const sessionData = await redisClient.get(key);
        if (!sessionData) continue;

        const parsedData = JSON.parse(sessionData);
        if (parsedData.userData?.email === email) {
          await redisClient.del(key);
          deletedCount++;
          logger.info("Cleaned up user registration session", {
            email,
            key:
              key.replace(REGISTRATION_SESSION_PREFIX, "").substring(0, 8) +
              "...",
          });
        }
      } catch (error) {
        logger.error("Failed to cleanup user session", {
          key,
          email,
          error: error.message,
        });
      }
    }

    if (deletedCount > 0) {
      logger.info("User registration session cleanup completed", {
        email,
        deletedCount,
      });
    }
  } catch (error) {
    logger.error("Failed to cleanup user registration sessions", {
      email,
      error: error.message,
    });
  }

  return deletedCount;
};

/**
 * Setup automatic cleanup with interval
 * Call this during application startup
 * @param {number} intervalMinutes - Cleanup interval in minutes (default: 30)
 * @returns {NodeJS.Timeout} Interval timer reference
 */
export const setupAutomaticCleanup = (intervalMinutes = 30) => {
  const intervalMs = intervalMinutes * 60 * 1000;

  logger.info("Setting up automatic registration session cleanup", {
    interval: `${intervalMinutes} minutes`,
  });

  // Run initial cleanup
  cleanupExpiredRegistrationSessions().catch((error) => {
    logger.error("Initial cleanup failed", { error: error.message });
  });

  // Setup recurring cleanup
  const cleanupInterval = setInterval(async () => {
    try {
      const results = await cleanupExpiredRegistrationSessions();

      // Log if there were issues
      if (results.errors.length > 0) {
        logger.warn("Cleanup completed with errors", {
          errors: results.errors.length,
          deleted: results.deleted,
        });
      }
    } catch (error) {
      logger.error("Automatic cleanup failed", { error: error.message });
    }
  }, intervalMs);

  return cleanupInterval;
};
