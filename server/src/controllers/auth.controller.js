import {
  catchAsync,
  logger,
  sendError,
  sendSuccess,
} from "devdad-express-utils";
import { validationResult } from "express-validator";

export const authenticationController = {
  //#region Signup
  signup: catchAsync(async (req, res) => {
    const { email, password, name } = req.body;
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

    return sendSuccess(res, {}, "Signup Successful", 201);
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
