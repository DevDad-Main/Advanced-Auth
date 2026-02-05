import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { AppError } from "devdad-express-utils";
import crypto from "crypto";
import { logger } from "devdad-express-utils";
import { RefreshToken } from "../models/RefreshToken.model.js";

//#region Generate Token
export const generateTokens = async (user) => {
  try {
    if (!isValidObjectId(user._id)) {
      throw new AppError("User Not Found", 404);
    }

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" },
    );

    // Generate refresh token (long-lived)
    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (parseInt(process.env.REFRESH_TOKEN_DAYS) || 7));

    // Store refresh token in database
    const refreshTokenDoc = await RefreshToken.create({
      token: refreshTokenString,
      user: user._id,
      expiresAt,
    });

    logger.info("Tokens generated successfully", {
      userId: user._id,
      refreshTokenId: refreshTokenDoc._id,
    });

    return { 
      accessToken, 
      refreshToken: refreshTokenString 
    };
  } catch (error) {
    logger.error("Failed to generate tokens", { error, userId: user._id });
    throw error;
  }
};
//#endregion

/**
 * Clean up expired refresh tokens for a user
 */
export async function cleanupExpiredRefreshTokens(userId) {
  try {
    const result = await RefreshToken.deleteMany({
      user: userId,
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      logger.info("Cleaned up expired refresh tokens", {
        userId,
        deletedCount: result.deletedCount,
      });
    }

    return result.deletedCount;
  } catch (error) {
    logger.error("Failed to cleanup expired tokens", { userId, error });
    return 0;
  }
}

/**
 * Revoke all refresh tokens for a user (for logout/security)
 */
export async function revokeAllUserTokens(userId) {
  try {
    const result = await RefreshToken.deleteMany({ user: userId });
    
    logger.info("Revoked all user tokens", {
      userId,
      deletedCount: result.deletedCount,
    });

    return result.deletedCount;
  } catch (error) {
    logger.error("Failed to revoke user tokens", { userId, error });
    throw error;
  }
}
//#endregion
