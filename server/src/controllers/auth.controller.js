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
const HTTP_OPTIONS = {
  httpOnly: process.env.NODE_ENV === "production",
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
};
//#endregion

export const authenticationController = {
  //#region Register
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
        fullName,
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

    await authenticationService.sendUserOtp(
      userFullName,
      email,
      registrationToken,
      next,
    );

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
    logger.debug("Retrieved user data from registration session", { userData: { ...userData, password: '[REDACTED]' } });
    const { firstName, lastName, email, password } = userData;
    const fullName = `${firstName} ${lastName}`;

    const isVerified = await authenticationService.verifyUserViaOTPVerification(
      email,
      otp,
      registrationToken,
      next,
    );

    logger.debug("OTP verification result", { isVerified });

    const { user } = await authenticationService.createNewUserAndCleanUpCaches(
      {
        isVerified: Boolean(isVerified),
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
  login: catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    logger.info("Login Handler Req Body: ", { body: req.body });

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      logger.warn("Login Validation Error: ", { errorMessages });
      return sendError(res, errorMessages.join(", "), 400);
    }

    const { user } = await authenticationService.fetchUserFromDB(
      email,
      password,
      next,
      res,
    );

    const { accessToken, refreshToken } = await generateTokens(user);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          username: user.username,
          _id: user._id,
        },
      },
      "Login Successful",
      200,
      [
        (res) => res.cookie("accessToken", accessToken, HTTP_OPTIONS),
        (res) => res.cookie("refreshToken", refreshToken, HTTP_OPTIONS),
      ],
    );
  }),
  //#endregion

  //#region Logout User
  logout: catchAsync(async (req, res, next) => {
    return sendSuccess(res, {}, "Logout Successful", 200, [
      (res) => res.clearCookie("accessToken"),
      (res) => res.clearCookie("refreshToken"),
    ]);
  }),
  //#endregion
};
