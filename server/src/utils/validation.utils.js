import { User } from "../models/User.model.js";
import { body } from "express-validator";
import {
  validateName,
  validateOTP,
  validatePassword,
} from "./safeRegex.utils.js";

//#region Register User Validation
export const registerUserValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required.")
    .trim()
    .custom(validateName),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required.")
    .trim()
    .custom(validateName),

  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email address already in use, Please choose another.");
      }
    })
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .custom(validatePassword)
    .isStrongPassword({
      minLength: 6,
      maxLength: 12,
      minUppercase: 1,
      minNumbers: 3,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be 6–12 characters and include at least 1 uppercase, 3 numbers, and 1 symbol.",
    )
    .trim(),
];
//#endregion

//#region Verify Registration OTP Validation
export const verifyUserRegisterValidation = [
  // Validate registration token
  body("registrationToken")
    .notEmpty()
    .withMessage("Registration token is required.")
    .bail()
    .isString()
    .withMessage("Registration token must be a string.")
    .isLength({ min: 64 })
    .withMessage("Invalid registration token format."),

  // Validate OTP
  body("otp")
    .notEmpty()
    .withMessage("OTP is required.")
    .bail()
    .isString()
    .withMessage("OTP must be a string.")
    .custom(validateOTP)
    .withMessage("OTP must be a 4-digit number."),
];
//#endregion

//#region Login User Validation
export const loginUserValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email can't be empty!")
    .bail()
    .custom(async (value) => {
      const userToFind = await User.findOne({ email: value });
      if (!userToFind) {
        throw new Error("User Not Found!");
      }
    })
    .trim()
    .isEmail(),
  body("password").notEmpty().withMessage("Password can't be empty!"),
];
//#endregion
