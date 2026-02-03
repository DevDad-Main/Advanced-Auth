import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/signup", authenticationController.signup);
authRouter.get("/login");
authRouter.get("/logout");

export { authRouter };
