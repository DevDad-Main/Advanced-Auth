import jwt from "jsonwebtoken";
import { catchAsync, logger, sendError, AppError } from "devdad-express-utils";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User.model.js";

/**
 * Middleware to authenticate users using JWT access tokens
 * Supports both cookie and bearer token authentication
 */
export const authenticateUserMiddleware = catchAsync(async (req, res, next) => {
  try {
    // Extract token from cookie or Authorization header
    const token = getTokenFromRequest(req);

    if (!token) {
      logger.warn("Authentication failed: No token provided", {
        ip: req.ip,
        path: req.path,
      });
      return sendError(res, "Authentication required", 401);
    }

    // Verify and decode JWT token
    const decodedToken = verifyAccessToken(token);

    if (!decodedToken || !decodedToken.userId) {
      logger.warn("Authentication failed: Invalid token structure");
      return sendError(res, "Invalid token", 401);
    }

    // Validate user exists and is active
    const user = await validateUser(decodedToken.userId);
    if (!user) {
      logger.warn("Authentication failed: User not found", {
        userId: decodedToken.userId,
      });
      return sendError(res, "User not found", 401);
    }

    // Attach user to request object
    req.user = {
      _id: user._id,
      email: user.email,
      isVerified: user.isVerified,
    };

    logger.debug("Authentication successful", {
      userId: user._id,
      path: req.path,
    });

    next();
  } catch (error) {
    handleAuthError(error, req, res);
  }
});

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = catchAsync(async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (token) {
      const decodedToken = verifyAccessToken(token);
      if (decodedToken?.userId) {
        const user = await validateUser(decodedToken.userId);
        if (user) {
          req.user = {
            _id: user._id,
            email: user.email,
            isVerified: user.isVerified,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Optional auth should not block requests
    logger.debug("Optional auth failed", { error: error.message });
    next();
  }
});

/**
 * Middleware to require verified email
 */
export const requireVerifiedEmail = catchAsync(async (req, res, next) => {
  if (!req.user?.isVerified) {
    logger.warn("Access denied: Email not verified", {
      userId: req.user?._id,
      path: req.path,
    });
    return sendError(res, "Email verification required", 403);
  }
  next();
});

// Helper functions
function getTokenFromRequest(req) {
  return (
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.query?.token
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn("Token verification failed", {
      error: error.message,
      token: token.substring(0, 20) + "...",
    });
    return null;
  }
}

async function validateUser(userId) {
  if (!isValidObjectId(userId)) {
    return null;
  }

  try {
    return await User.findById(userId).select("_id email isVerified");
  } catch (error) {
    logger.error("User validation failed", { userId, error: error.message });
    return null;
  }
}

function handleAuthError(error, req, res) {
  const errorMessage = error?.message || "Authentication failed";
  
  logger.error("Authentication error", {
    error: errorMessage,
    ip: req.ip,
    path: req.path,
  });

  if (error.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  } else if (error.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  } else {
    throw new AppError(errorMessage, 401);
  }
}
