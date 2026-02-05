import mongoose from "mongoose";

/**
 * @typedef {Object} RefreshToken
 * @property {string} token - Unique refresh token string (required, unique)
 * @property {mongoose.Types.ObjectId} user - ID of the user this token belongs to (required)
 * @property {Date} expiresAt - When this token expires (required)
 * @property {Date} createdAt - When the token was created
 * @property {Date} updatedAt - When the token was last updated
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Mongoose RefreshToken Model - Manages refresh tokens for user authentication
 * @type {import('mongoose').Model<RefreshToken>}
 * @property {string} token - Unique refresh token string (required, unique)
 * @property {mongoose.Types.ObjectId} user - ID of the user this token belongs to (required)
 * @property {Date} expiresAt - When this token expires (required)
 * @property {Date} createdAt - When the token was created
 * @property {Date} updatedAt - When the token was last updated
 */
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
