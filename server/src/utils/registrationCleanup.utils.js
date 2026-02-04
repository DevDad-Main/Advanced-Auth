import { logger } from "devdad-express-utils";

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
