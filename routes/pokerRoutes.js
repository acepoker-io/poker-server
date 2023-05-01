import express from "express";
import {
  getDocument,
  createTable,
  getAllGame,
  getAllUsers,
  checkIfUserInTable,
  getTablePlayers,
  refillWallet,
  checkVerifyPrivateTable,
  checkUserInGame,
} from "../controller/pokerController.js";
import { validateCreateTable } from "../validation/poker.validation.js";
import auth from "../landing-server/middlewares/auth";
import roomModel from "../models/room.js";

const router = express.Router();
const pokerRoute = (io) => {
  router.get('/getDoc/:coll/"id', auth(), getDocument);
  router.post("/createTable", auth(), validateCreateTable, (req, res) =>
    createTable(req, res, io)
  );
  router.get("/rooms", getAllGame);

  router.get("/getAllUsers", auth(), getAllUsers);
  router.get("/checkUserInTable/:tableId", auth(), checkIfUserInTable);
  router.get("/getTablePlayers/:tableId", auth(), getTablePlayers);
  router.post("/refillWallet", auth(), refillWallet);
  router.post("/verifyPrivateTable", auth(), checkVerifyPrivateTable);
  router.get("/checkUserInGame", auth(), checkUserInGame);
  router.get("/check-auth", auth(), async (req, res) => {
    try {
      res.status(200).send({ user: req.user });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal server error" });
    }
  });
  router.get("/getTableById", auth(), async (req, res) => {
    try {
      console.log("query ==>", req.query);
      const { tableId } = req.query;
      const table = await roomModel.findOne({ _id: tableId });
      res.send(table);
    } catch (error) {
      console.log("error in getTableById ==>", error);
    }
  });

  return router;
};

export default pokerRoute;
