import { connectDB, getDBStatus, logger } from "devdad-express-utils";
import app from "./app.js";
import { setupAutomaticCleanup } from "./utils/registrationCleanup.utils.js";

const PORT = process.env.PORT || "3000";

await connectDB();
const dbStatus = getDBStatus();

(async () => {
  try {
    // // Setup automatic registration session cleanup (every 30 minutes)
    const cleanupInterval = setupAutomaticCleanup(30);
    logger.info("Registration cleanup service started");

    app.listen(PORT, () => {
      logger.info(`Backend App is running on port ${PORT}`);
      logger.info("Backend App DB Status ->", { dbStatus });
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
        logger.info("Registration cleanup stopped");
      }
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to connect to servers... ", { error });
    process.exit(1);
  }
})();

/* 
The 'unhandledRejection' event is emitted whenever a Promise is rejected and no error handler is attached to the promise within a turn of the event loop. When programming with Promises, exceptions are encapsulated as "rejected promises". Rejections can be caught and handled using promise.catch() and are propagated through a Promise chain. The 'unhandledRejection' event is useful for detecting and keeping track of promises that were rejected whose rejections have not yet been handled.
*/
process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at: Promise", { reason, p });
  process.exit(1);
});
