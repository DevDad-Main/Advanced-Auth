import { deleteRegistrationSession } from "src/utils/registrationSession.utils";
import {
  checkOTPRestrictions,
  sendOTP,
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

  async sendUserOtp(userFullName, email) {
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
      return sendError(
        res,
        "Failed to send verification email. Please try again.",
        500,
      );
    }
  },
};
