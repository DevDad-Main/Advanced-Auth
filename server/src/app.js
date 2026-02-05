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
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import slowDown from "express-slow-down";
import compression from "compression";

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

// Gradually slow down responses after certain threshold to prevent abuse
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter threshold
  maxDelayMs: 20000, // Maximum delay of 20 seconds to prevent complete blocking
});
//#endregion

//#region Middleware
// Compress response data for better performance
app.use(compression());
// Security headers to protect against common vulnerabilities
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Only allow resources from same origin
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for CSS frameworks
      scriptSrc: ["'self'"], // Only allow scripts from same origin
      imgSrc: ["'self'", "data:", "https:"], // Allow images from same origin, data URIs, and HTTPS
    },
  },
  crossOriginEmbedderPolicy: false // Disable for compatibility with some third-party resources
}));
// Prevent NoSQL injection attacks by sanitizing user input
app.use(mongoSanitize());
// Prevent Cross-Site Scripting (XSS) attacks by cleaning user input
app.use(xss());
// Prevent HTTP Parameter Pollution attacks
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit'] // Allow these parameters for pagination and sorting
}));
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

// Parse JSON request bodies with 3MB limit
app.use(express.json({ limit: "3mb" }));
// Parse URL-encoded request bodies with 3MB limit
app.use(express.urlencoded({ extended: true, limit: "3mb" }));
// Parse cookies for authentication and session management
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
// Apply speed limiter to all routes
app.use(speedLimiter);
// Authentication routes with Redis client injection
app.use(
  "/api/auth",
  (req, res, next) => {
    req.redisClient = redisClient; // Inject Redis client for rate limiting and caching
    next();
  },
  authRouter,
);

//#endregion

//#region Global Error Handler
app.use(errorHandler);
//#endregion

export default app;
