import express from "express";
// import authValidation from "../../validation/auth.validation.js";
import {
  adminLogin,
  getLettestUser,
  dashboardCount,
} from "../controller/admin/admin.controler.js";
import authValidation from "../validation/auth.validation.js";
import validate from "../middlewares/validate.js";
import auth from "../landing-server/middlewares/auth.js";

const router = express.Router();

router.post("/login", validate(authValidation.adminLogin), adminLogin);

router.get("/getLettestUser", getLettestUser);

router.get("/dashboardCount", auth(), dashboardCount);

export default router;
