import redisClient from "../lib/redis.lib.js";
import { AppError, logger } from "devdad-express-utils";
import { randomBytes } from "crypto";

/**
 * @fileoverview Registration Session Management Utilities
 *
 * This module handles temporary storage of registration data using Redis.
 * It provides a secure way to store user registration data between the
 * initial registration request and OTP verification.
 *
 * Key Features:
 * - Secure token generation
 * - Automatic cleanup with TTL
 * - Data validation and error handling
 * - Comprehensive logging
 */

//#region Constants
const REGISTRATION_SESSION_PREFIX = "reg_session:";
const REGISTRATION_SESSION_TTL = 1800; // 30 minutes in seconds
const TOKEN_LENGTH = 32; // bytes for secure token generation
//#endregion

//#region Token Generation
/**
 * Generates a secure registration token
 * @returns {string} Secure random token for registration session
 */
const generateRegistrationToken = () => {
  return randomBytes(TOKEN_LENGTH).toString("hex");
};
//#endregion

//#region Session Management
/**
 * Stores registration data in Redis with a secure token
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @param {string} userData.username - User's username
 * @param {string} userData.password - User's hashed password
 * @param {Object} [files] - Optional uploaded files
 * @returns {Promise<string>} Registration token for session
 * @throws {AppError} If Redis storage fails
 */
export const createRegistrationSession = async (userData, files = null) => {
  try {
    // Generate secure token
    const registrationToken = generateRegistrationToken();
    const sessionKey = `${REGISTRATION_SESSION_PREFIX}${registrationToken}`;

    // Prepare session data with metadata
    const sessionData = {
      userData,
      files: files
        ? {
            profile_photo: files.profile_photo
              ? {
                  name: files.profile_photo[0]?.originalname,
                  mimetype: files.profile_photo[0]?.mimetype,
                  size: files.profile_photo[0]?.size,
                  buffer: files.profile_photo[0]?.buffer.toString("base64"),
                }
              : null,
            cover_photo: files.cover_photo
              ? {
                  name: files.cover_photo[0]?.originalname,
                  mimetype: files.cover_photo[0]?.mimetype,
                  size: files.cover_photo[0]?.size,
                  buffer: files.cover_photo[0]?.buffer.toString("base64"),
                }
              : null,
          }
        : null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + REGISTRATION_SESSION_TTL * 1000,
      ).toISOString(),
    };

    // Store in Redis with automatic expiration
    await redisClient.setex(
      sessionKey,
      REGISTRATION_SESSION_TTL,
      JSON.stringify(sessionData),
    );

    logger.info("Registration session created", {
      registrationToken,
      email: userData.email,
      username: userData.username,
      expiresAt: sessionData.expiresAt,
    });

    return registrationToken;
  } catch (error) {
    logger.error("Failed to create registration session", {
      error: error.message,
      email: userData?.email,
    });
    throw new AppError("Failed to create registration session", 500);
  }
};

/**
 * Retrieves registration data using token
 * @param {string} registrationToken - Token from registration step
 * @returns {Promise<Object>} Registration session data
 * @throws {AppError} If token is invalid or expired
 */
export const getRegistrationSession = async (registrationToken) => {
  try {
    // Validate token format
    if (!registrationToken || typeof registrationToken !== "string") {
      throw new AppError("Invalid registration token", 400);
    }

    const sessionKey = `${REGISTRATION_SESSION_PREFIX}${registrationToken}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      logger.warn("Registration session not found or expired", {
        registrationToken,
      });
      throw new AppError(
        "Registration session expired or invalid. Please restart registration.",
        400,
      );
    }

    const parsedData = JSON.parse(sessionData);

    // Log session retrieval for audit purposes
    logger.info("Registration session retrieved", {
      registrationToken,
      email: parsedData.userData.email,
      createdAt: parsedData.createdAt,
    });

    return parsedData;
  } catch (error) {
    // Re-throw AppError instances, wrap others
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("Failed to retrieve registration session", {
      registrationToken,
      error: error.message,
    });
    throw new AppError("Failed to retrieve registration data", 500);
  }
};

/**
 * Removes registration session after successful verification
 * @param {string} registrationToken - Token to clean up
 * @returns {Promise<boolean>} True if cleanup successful
 */
export const deleteRegistrationSession = async (registrationToken) => {
  try {
    if (!registrationToken) {
      logger.warn("Attempted to delete session with null token");
      return false;
    }

    const sessionKey = `${REGISTRATION_SESSION_PREFIX}${registrationToken}`;
    const result = await redisClient.unlink(sessionKey);

    if (result > 0) {
      logger.info("Registration session deleted successfully", {
        registrationToken,
      });
      return true;
    } else {
      logger.warn("Registration session not found for deletion", {
        registrationToken,
      });
      return false;
    }
  } catch (error) {
    logger.error("Failed to delete registration session", {
      registrationToken,
      error: error.message,
    });
    // Don't throw error - cleanup failure shouldn't break the flow
    return false;
  }
};

/**
 * Validates if a registration token exists and is valid
 * @param {string} registrationToken - Token to validate
 * @returns {Promise<boolean>} True if token is valid
 */
export const validateRegistrationToken = async (registrationToken) => {
  try {
    await getRegistrationSession(registrationToken);
    return true;
  } catch (error) {
    return false;
  }
};
//#endregion

//#region Helper Functions
/**
 * Converts base64 buffer back to Buffer object
 * @param {string} base64String - Base64 encoded buffer
 * @returns {Buffer} Decoded buffer
 */
export const base64ToBuffer = (base64String) => {
  if (!base64String) return null;
  return Buffer.from(base64String, "base64");
};

/**
 * Reconstructs files object from session data
 * @param {Object} sessionFiles - Files data from session
 * @returns {Object|null} Reconstructed files object or null
 */
export const reconstructFiles = (sessionFiles) => {
  if (!sessionFiles) return null;

  const files = {};

  if (sessionFiles.profile_photo) {
    files.profile_photo = [
      {
        originalname: sessionFiles.profile_photo.name,
        mimetype: sessionFiles.profile_photo.mimetype,
        size: sessionFiles.profile_photo.size,
        buffer: base64ToBuffer(sessionFiles.profile_photo.buffer),
      },
    ];
  }

  if (sessionFiles.cover_photo) {
    files.cover_photo = [
      {
        originalname: sessionFiles.cover_photo.name,
        mimetype: sessionFiles.cover_photo.mimetype,
        size: sessionFiles.cover_photo.size,
        buffer: base64ToBuffer(sessionFiles.cover_photo.buffer),
      },
    ];
  }

  return Object.keys(files).length > 0 ? files : null;
};
//#endregion
