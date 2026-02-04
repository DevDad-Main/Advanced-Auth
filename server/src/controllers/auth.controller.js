import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { validationResult } from "express-validator";
import { User } from "../models/User.model.js";
import bcrypt from "bcrypt";
import { generateTokens } from "../utils/generateToken.utils.js";
import { authenticationService } from "../services/auth.services.js";

//#region Constants
const SALT_ROUNDS = 12;

const HTTP_OPTIONS = {
  httpOnly: process.env.NODE_ENV === "production",
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
};
//#endregion

export const authenticationController = {
  //#region Signup
  register: catchAsync(async (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      logger.warn("Registration Validation Error", {
        errorMessages,
        email,
        firstName,
      });
      return sendError(res, errorMessages.join(", "), 400);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      logger.warn("User Already Exists.", {
        email,
        name,
        existingUserID: existingUser._id,
      });
      return sendError(res, "User Already Exists", 400);
    }

    await authenticationService.checkUserOtpRestrictionsAndRequests(
      email,
      next,
    );

    const userData = { firstName, lastName, email, password };

    const { registrationToken } =
      await authenticationService.storeUserDataInRedisAndCreateRegistrationToken(
        userData,
        next,
      );

    const userFullName = `${firstName} ${lastName}`;
    await authenticationService.sendUserOtp(userFullName, email, next);

    return sendSuccess(
      res,
      {
        registrationToken,
        message: "Please check your email for the verification code.",
        expiresIn: "30 minutes",
      },
      "Registration initiated. Please verify your email.",
      201,
    );
  }),
  //#endregion

  //#region Verify OTP
  verifyUserOTP: catchAsync(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      logger.warn("OTP Verification Validation Error", {
        errorMessages,
        registrationToken: req.body?.registrationToken?.substring(0, 8) + "...",
        body: req.body,
      });
      return sendError(res, errorMessages.join(", "), 400);
    }

    const { registrationToken, otp } = req.body;

    logger.info(
      "DEBUG: Verification request - Token:",
      registrationToken?.substring(0, 8) + "...",
      "OTP:",
      otp,
    );

    // Retrieve Registration Data From Redis
    const { registrationSession } =
      await authenticationService.retrieveUserRegistrationSession(
        registrationToken,
        next,
      );

    const { userData } = registrationSession;
    const { firstName, lastName, email, password } = userData;
    const fullName = `${firstName} ${lastName}`;

    const { isVerified } = authenticationService.verifyUserViaOTPVerification(
      email,
      otp,
      registrationToken,
      next,
    );

    const { user } = await authenticationService.createNewUserAndCleanUpCaches(
      {
        isVerified,
        email,
        fullName,
        password,
        registrationToken,
      },
      next,
    );

    await authenticationService.sendUserWelcomeEmail(
      req,
      fullName,
      email,
      user._id,
    );

    await authenticationService.deleteNewUserRegistrationSession(
      registrationToken,
    );

    return sendSuccess(
      res,
      {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
      "Registration completed successfully! Welcome aboard!",
      201,
    );
  }),
  //#endregion

  //#region Login
  login: catchAsync(async (req, res) => {
    logger.info("Login Controller Called.");

    return sendSuccess(res, {}, "Login Successful", 201);
  }),
  //#endregion

  //#region Register
  register: catchAsync(async (req, res) => {
    logger.info("Register Controller Called.");

    return sendSuccess(res, {}, "Register Successful", 201);
  }),
  //#endregion
};
