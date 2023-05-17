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
import {
  convertEthToUsd,
  getTransactionByHash,
  sendTransactionToWinner,
} from "../service/transaction.js";

import { ethers } from "ethers";
import User from "../landing-server/models/user.model.js";
import transactionModel from "../models/transaction.js";

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

  router.post("/depositTransaction", auth(), async (req, res) => {
    try {
      console.log("body ====>", req.body);
      const { txhash, amount, userId } = req.body;
      const userbeforeupdation = await User.findOne({ _id: userId });

      const transaction = await getTransactionByHash(
        txhash,
        userbeforeupdation.metaMaskAddress
      );
      // transaction = transaction * 10
      // console.log("transaction response ==>", transaction);
      // const transactionEth = ethers.utils.formatEther(transaction?.value);
      // const amntInDollar = await convertEthToUsd(transaction);
      console.log("transaction amount ==>", transaction, amount);
      // if (!transaction || transaction !== parseFloat(amount)) {
      //   return res.status(401).send({
      //     success: false,
      //     message: "Invalid transaction",
      //   });
      // } else {
        const user = await User.findOneAndUpdate(
          {
            _id: userId,
          },
          {
            $inc: { wallet: amount },
          },
          {
            new: true,
          }
        );

        console.log("User ID ===>", user);

        await transactionModel.create({
          userId,
          amount,
          prevWallet: userbeforeupdation.wallet,
          updatedWallet: user.wallet,
          transactionType: "deposit",
        });
        return res.status(200).send({
          success: true,
          message: "Transaction suceessfull",
          user,
        });
      // }
    } catch (e) {
      console.log("error in getDepositTransaction", e);
      res.status(400).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  router.post("/withdrawTransaction", auth(), async (req, res) => {
    try {
      console.log("body ===>", req.body);
      const { userId, amount } = req.body;
      const user = await User.findOne({ _id: userId });
      if (user.wallet < amount) {
        return res.status(401).send({
          success: false,
          message: "You do not have enough balance",
        });
      }

      const tranctionSuccessfull = await sendTransactionToWinner(
        amount,
        user.metaMaskAddress
      );

      if (!tranctionSuccessfull) {
        return res
          .status(400)
          .send({ success: false, message: "Transaction has been failed" });
      }

      const userbeforeupdation = await User.findOne({
        _id: userId,
      });

      const updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $inc: {
            wallet: amount * -1,
          },
        },
        { new: true }
      );

      await transactionModel.create({
        userId,
        amount,
        prevWallet: userbeforeupdation.wallet,
        updatedWallet: updatedUser.wallet,
        transactionType: "withdraw",
      });

      return res.status(200).send({
        success: true,
        message: "Withdraw successfull",
        user: updatedUser,
      });
    } catch (e) {
      console.log("error in getDepositTransaction", e);
      res.status(400).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  return router;
};

export default pokerRoute;
