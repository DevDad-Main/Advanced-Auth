import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { errorHandler, logger, sendError } from "devdad-express-utils";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./lib/redis.lib.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

//#region Constants
const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "advanced-auth-rate-limit-middleware",
  points: 10,
  duration: 1,
});

const expressEndpointRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // How long to remember requests: 15 minutes
  max: 100, // Limit each IP to 100 request per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the 'X-RateLimit-*' headers
  /* 
	  Express request handler that sends back a response when a client is rate-limited.

    By default, sends back the `statusCode` and `message` set via the options.
	*/
  handler: (req, res, _next) => {
    logger.warn(`Public API Rate Limit Exceeded for IP: ${req.ip}`);
    return sendError(res, "Rate Limit Exceeded", 429);
  },
  /*
		The `Store` to use to store the hit count for each client.

		By default, the built-in `MemoryStore` will be used.
	*/
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
//#endregion

//#region Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins, // Array of allowed domains
    credentials: true, // Allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // HTTP methods allowed
    allowedHeaders: [
      "Content-Type", // Required for POST/PUT/PATCH to tell server the payload type (JSON, form, etc.)
      "Authorization", // For sending Bearer tokens or other auth headers
      "X-Requested-With", // Often sent by AJAX/fetch to indicate it's an XMLHttpRequest
      "device-remember-token", // Custom header you might use for remembering device/session
      "Accept", // Tells server what response content types the client accepts
    ],
  }),
);

app.use(express.json({ limit: "3mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate Limit Exceeded for IP: ${req.ip}`);
      return sendError(res, "Rate Limited Exceeded", 429);
    });
});
//#endregion

//#region EndPoints
app.use(
  "/api/auth",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  authRouter,
);

//#endregion

//#region Global Error Handler
app.use(errorHandler);
//#endregion

export default app;
