import { connectDB, getDBStatus, logger } from "devdad-express-utils";
import app from "./app.js";

const PORT = process.env.PORT || "3000";

await connectDB();
const dbStatus = getDBStatus();

app
  .listen(PORT, () => {
    logger.info(`Server is runnng on: http://localhost:${PORT}`);
    logger.info("DB: ", { dbStatus });
  })
  .on("connect", (error) => {
    logger.error("Failed to start server..", { error });
  });
