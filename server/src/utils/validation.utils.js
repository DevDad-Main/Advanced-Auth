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
    .escape()
    .blacklist('<>{}[]\\|%^`~')
    .custom(validateName),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required.")
    .trim()
    .escape()
    .blacklist('<>{}[]\\|%^`~')
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
    .normalizeEmail({
      remove_dots: false,
      remove_extension: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    })
    .escape(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .custom(validatePassword)
    .isStrongPassword({
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
      minUppercase: parseInt(process.env.PASSWORD_MIN_UPPERCASE) || 1,
      minNumbers: parseInt(process.env.PASSWORD_MIN_NUMBERS) || 1,
      minSymbols: parseInt(process.env.PASSWORD_MIN_SYMBOLS) || 1,
    })
    .withMessage(
      `Password must be ${process.env.PASSWORD_MIN_LENGTH || 8}-${process.env.PASSWORD_MAX_LENGTH || 128} characters and include at least ${process.env.PASSWORD_MIN_UPPERCASE || 1} uppercase, ${process.env.PASSWORD_MIN_NUMBERS || 1} numbers, and ${process.env.PASSWORD_MIN_SYMBOLS || 1} symbol.`,
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
