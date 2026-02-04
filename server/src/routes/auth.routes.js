import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller.js";
import {
  loginUserValidation,
  registerUserValidation,
  verifyUserRegisterValidation,
} from "../utils/validation.utils.js";

const authRouter = Router();

authRouter.post(
  "/register",
  registerUserValidation,
  authenticationController.register,
);

authRouter.post(
  "/verify-registration",
  verifyUserRegisterValidation,
  authenticationController.verifyUserOTP,
);

authRouter.post("/login", loginUserValidation, authenticationController.login);
authRouter.post("/logout", authenticationController.logout);
// authRouter.post("/refresh-token", generateRefreshToken);

export { authRouter };
