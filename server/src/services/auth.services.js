import { clearRedisUserCache } from "src/utils/clearRedisCache.utils";
import {
  deleteRegistrationSession,
  getRegistrationSession,
} from "src/utils/registrationSession.utils";
import {
  checkOTPRestrictions,
  sendOTP,
  sendWelcomeEmail,
  trackOTPRequests,
} from "src/utils/userAuthentication.utils";

export const authenticationService = {
  async checkUserOtpRestrictionsAndRequests(email, next) {
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
    let registrationToken;
    try {
      registrationToken = await createRegistrationSession(userData);
      logger.info("Registration session created", {
        registrationToken: registrationToken.substring(0, 8) + "...",
        email,
        firstName,
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

  async sendUserOtp(userFullName, email, next) {
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
    try {
      user = await User.create({
        fullName,
        email,
        username,
        password,
        isVerified,
      });

      logger.info("User created successfully", {
        userId: user._id,
        email,
        username,
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
};
