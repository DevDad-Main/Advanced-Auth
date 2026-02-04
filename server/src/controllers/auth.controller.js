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
import { authenticationService } from "src/services/auth.services.js";

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
    const { email, password, fullName, lastName } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      logger.warn("Registration Validation Error", {
        errorMessages,
        email,
        name,
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
    await authenticationService.sendUserOtp(userFullName, email);

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
