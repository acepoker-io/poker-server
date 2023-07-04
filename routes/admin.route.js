import express from "express";
// import authValidation from "../../validation/auth.validation.js";
import {
  adminLogin,
  getLettestUser,
  dashboardCount,
  checkAdmin,
  getAllUsers,
  getAllTransaction,
  resetPassword,
  getAllUsersForInvite,
  getPokerTable,
  createTable,
  updateWallet,
  deleteTable,
  uploadProfile,
  updateUser,
  blockUser,
  createUser,
  deleteUser,
} from "../controller/admin/admin.controler.js";
import authValidation from "../validation/auth.validation.js";
import validate from "../middlewares/validate.js";
import auth from "../landing-server/middlewares/auth.js";

const router = express.Router();

const adimRoute = (io) => {
  router.post("/login", validate(authValidation.adminLogin), adminLogin);

  router.get("/getLettestUser", getLettestUser);

  router.get("/dashboardCount", auth(), dashboardCount);

  router.get("/check-admin", auth(), checkAdmin);

  router.get("/getAllUsers", getAllUsers);

  router.get("/allTransaction", auth(), getAllTransaction);

  router.put("/reset-password", auth(), resetPassword);

  router.get("/users-forInvite", auth(), getAllUsersForInvite);

  router.get("/pokerTables", auth(), getPokerTable);

  router.put("/update-wallet/:id", auth(), updateWallet);

  router.post("/createTable", auth(), (req, res) => createTable(req, res, io));

  router.delete("/tableDelete", auth(), deleteTable);

  router.post("/uploadProfile", auth(), uploadProfile);

  router.post("/update-user/:id", auth(), updateUser);
  router.post("/create-user", auth(), createUser);

  router.put("/block-user/:id", auth(), blockUser);
  router.delete("/delete-user/:id", auth(), deleteUser);

  return router;
};

export default adimRoute;
