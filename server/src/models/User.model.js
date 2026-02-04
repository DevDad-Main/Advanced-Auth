import mongoose from "mongoose";
import bcrypt from "bcrypt";

/**
 * @typedef {Object} User
 * @property {string} email - User's email address (required, unique)
 * @property {string} fullName - User's full name (required)
 * @property {string} username - User's unique username (required, unique)
 * @property {string} password - User's hashed password (required)
 * @property {string} [bio] - User's biography (default: "Hey there! I'm using Knect.")
 * @property {string} [location] - User's location (default: "")
 * @property {mongoose.Types.ObjectId[]} [followers] - Array of user IDs who follow this user
 * @property {mongoose.Types.ObjectId[]} [following] - Array of user IDs this user follows
 * @property {mongoose.Types.ObjectId[]} [connections] - Array of user IDs this user is connected to
 * @property {string} [refreshToken] - Current refresh token for the user
 * @property {boolean} [isVerified] - Users email has been verified via OTP
 * @property {Date} createdAt - When the user was created
 * @property {Date} updatedAt - When the user was last updated
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true },
);

//#region comparePassword Method
userSchema.methods.comparePassword = async function (passwordToCompare) {
  try {
    return await bcrypt.compare(passwordToCompare, this.password);
  } catch (error) {
    throw error;
  }
};
//#endregion

userSchema.index({
  fullName: "text",
  email: "text",
});

/**
 * Mongoose User Model - Represents user accounts with authentication and social features
 * @type {import('mongoose').Model<User>}
 * @property {string} email - User's email address (required, unique)
 * @property {string} fullName - User's full name (required)
 * @property {string} username - User's unique username (required, unique)
 * @property {string} password - User's hashed password (required)
 * @property {string} [bio] - User's biography (default: "Hey there! I'm using Knect.")
 * @property {string} [location] - User's location (default: "")
 * @property {mongoose.Types.ObjectId[]} [followers] - Array of user IDs who follow this user
 * @property {mongoose.Types.ObjectId[]} [following] - Array of user IDs this user follows
 * @property {mongoose.Types.ObjectId[]} [connections] - Array of user IDs this user is connected to
 * @property {string} [refreshToken] - Current refresh token for the user
 * @property {boolean} [isVerified] - Users email has been verified via OTP
 * @property {Date} createdAt - When the user was created
 * @property {Date} updatedAt - When the user was last updated
 */

export const User = mongoose.model("User", userSchema);
