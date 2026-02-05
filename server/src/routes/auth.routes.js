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
authRouter.post("/refresh-token", authenticationController.refreshToken);

// NOTE: Example usage of how to use different authentication middlewares.

// router.get('/profile', authenticateUserMiddleware, getUserProfile);

// // Optional auth (shows public vs private content)
// router.get('/posts', optionalAuthMiddleware, getPosts);

// // Verified email only
// router.post('/premium', authenticateUserMiddleware, requireVerifiedEmail, upgradeAccount);

export { authRouter };
