import express from "express";
import user_AuthController from "../controller/user_Auth/user_AuthController.js";
// import auth from "../landing-server/middlewares/auth";

const router = express.Router();
router.post("/register", user_AuthController.createUser);
router.post("/loginWithMetamask", user_AuthController.loginWithMetamask);

export default router;
