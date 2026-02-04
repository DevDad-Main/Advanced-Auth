import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { AppError } from "devdad-express-utils";
import crypto from "crypto";
import { logger } from "devdad-express-utils";

//#region Generate Token
export const generateTokens = async (user) => {
  try {
    if (!isValidObjectId(user._id)) {
      throw new AppError("User Not Found", 404);
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1day" },
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Failed to generate tokens..", { error });
    throw error;
  }
};
//#endregion
