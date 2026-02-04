import { clearRedisUserCache } from "../utils/clearRedisCache.utils.js";
import {
  createRegistrationSession,
  deleteRegistrationSession,
  getRegistrationSession,
} from "../utils/registrationSession.utils.js";
import {
  checkOTPRestrictions,
  sendOTP,
  sendWelcomeEmail,
  trackOTPRequests,
  verifyOTP,
} from "../utils/userAuthentication.utils.js";
import { User } from "../models/User.model.js";
import { logger, sendError } from "devdad-express-utils";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const authenticationService = {
  async checkUserOtpRestrictionsAndRequests(email, next) {
    logger.info("Auth Service checking OTP Restrictions");

    try {
      await checkOTPRestrictions(email, next);
      await trackOTPRequests(email, next);
    } catch (error) {
      logger.error("OTP restrictions check failed", {
        email,
        error: error.message,
      });
      next(error);
    }
  },

  async storeUserDataInRedisAndCreateRegistrationToken(userData, next) {
    logger.info("Auth Service storing user data in redis and generating token");

    let registrationToken;
    try {
      registrationToken = await createRegistrationSession(userData);
      logger.info("Registration session created", {
        registrationToken: registrationToken.substring(0, 8) + "...",
      });

      return { registrationToken };
    } catch (error) {
      logger.error("Failed to create registration session", {
        email,
        error: error.message,
      });
      next(error);
    }
  },

  async sendUserOtp(userFullName, email, registrationToken, next) {
    logger.info("Auth Service genereating OTP code and sending email", {
      email,
    });

    try {
      await sendOTP(userFullName, email);
      logger.info("OTP sent successfully", {
        email,
        registrationToken: registrationToken.substring(0, 8) + "...",
      });
    } catch (error) {
      // Clean up session if OTP sending fails
      await deleteRegistrationSession(registrationToken);
      logger.error("Failed to send OTP, session cleaned up", {
        email,
        error: error.message,
      });
      next(error);
    }
  },

  async retrieveUserRegistrationSession(registrationToken, next) {
    //  Retrieve registration data from Redis
    let registrationSession;
    try {
      registrationSession = await getRegistrationSession(registrationToken);

      return { registrationSession };
    } catch (error) {
      logger.error("Failed to retrieve registration session", {
        registrationToken: registrationToken?.substring(0, 8) + "...",
        error: error.message,
      });
      next(error);
    }
  },

  async verifyUserViaOTPVerification(email, otp, registrationToken, next) {
    let isVerified;
    try {
      isVerified = await verifyOTP(email, otp);
      logger.info("OTP verification successful", {
        email,
        registrationToken: registrationToken.substring(0, 8) + "...",
      });

      console.log("Checking isVerified variable: ", isVerified);

      return { isVerified };
    } catch (error) {
      logger.error("OTP verification failed", {
        email,
        registrationToken: registrationToken.substring(0, 8) + "...",
        error: error.message,
      });
      next(error);
    }
  },

  async createNewUserAndCleanUpCaches(
    { isVerified, email, fullName, password, registrationToken },
    next,
  ) {
    let user;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        isVerified,
      });

      logger.info("User created successfully", {
        userId: user._id,
        email,
      });

      return { user };
    } catch (error) {
      logger.error("Failed to create user", {
        email,
        error: error.message,
      });
      // Clean up session on user creation failure
      await deleteRegistrationSession(registrationToken);
      next(error);
    }
  },

  async sendUserWelcomeEmail(req, fullName, email, _id) {
    try {
      // Send welcome email
      await sendWelcomeEmail(fullName, email);

      // Clear any potential stale cache for this new user
      await clearRedisUserCache(req, _id);

      logger.info("Post-registration tasks completed", { userId: _id });
    } catch (error) {
      // Log error but don't fail the registration
      logger.error("Post-registration tasks failed", {
        userId: _id,
        error: error.message,
      });
    }
  },

  async deleteNewUserRegistrationSession(registrationToken) {
    try {
      await deleteRegistrationSession(registrationToken);
      logger.info("Registration session cleaned up", {
        registrationToken: registrationToken.substring(0, 8) + "...",
      });
    } catch (error) {
      logger.error("Failed to clean up registration session", {
        registrationToken: registrationToken.substring(0, 8) + "...",
        error: error.message,
      });
    }
  },

  async fetchUserFromDB(email, password, next, res) {
    let user;
    try {
      user = await User.findOne({ email });

      if (!user) {
        logger.warn("User Not Found: ", { email });
        return sendError(res, "User Not Found", 404);
      }

      logger.info("User Found: ", { user });

      const isPasswordMatching = await user.comparePassword(password);

      if (!isPasswordMatching) {
        logger.warn("Invalid Password");
        return sendError(res, "Invalid Password", 400);
      }
      return { user };
    } catch (error) {
      logger.error("Failed to fetch User", { error });
      next(error);
    }
  },
};
