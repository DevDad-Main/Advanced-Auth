import { User } from "../models/User.model.js";
import { body } from "express-validator";
import { validateName, validatePassword } from "./safeRegex.utils.js";

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
