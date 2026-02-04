import { Router } from "express";
import { authenticationController } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", authenticationController.register);
// authRouter.get("/login");
// authRouter.get("/logout");

export { authRouter };
