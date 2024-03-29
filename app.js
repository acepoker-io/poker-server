//imports
import express from "express";
import http from "http";
import { PORT } from "./config/keys";
import { mongoConnect } from "./config/mongo";
import cors from "cors";
import passport, { authenticate } from "passport";
import socket from "socket.io";
import roomModel from "./models/room";
import { doLeaveTable, doLeaveWatcher } from "./functions/functions";
import jwtStrategy from "./landing-server/config/jwtstragety";
import {
  successHandler,
  errorHandler as morganErrorHandler,
} from "./landing-server/config/morgan.js";
import pokerRoute from "./routes/pokerRoutes.js";
//import tournamentRoute from "./routes/tournamentRoutes.js";
import adminRoute from "./routes/admin.route.js";
import dotenv from "dotenv";
import auth from "./landing-server/middlewares/auth.js";
import mongoose from "mongoose";
import User from "./landing-server/models/user.model.js";
import returnCron from "./cron/cron.js";
//import tournamentModel from "./models/tournament";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/user.route.js";

import {
  getTransactionReceiptByHash,
  sendCommisionToSharableAddress,
} from "./service/transaction";
import axios from "axios";
import tournamentRoute from "./routes/tournamentRoutes";
import Notification from "./models/notificationModal";

let app = express();
dotenv.config();
const server = http.createServer(app);
const io = socket(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
});

returnCron(io);

const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://admin.acepoker.io",
  "https://api.acepoker.io",
  "https://app.acepoker.io",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback("Not allowed by CORS");
    }
  },
};

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cors());
mongoConnect();

// Auth functions
// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

if (process.env.ENVIROMENT !== "test") {
  app.use(successHandler);
  app.use(morganErrorHandler);
}

require("./socketconnection/socketconnection")(io);

// app.use("/api/user", tournamentRoute(socket));
app.get("/checkTableExist/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;
    const room = await roomModel.findOne({
      _id: mongoose.Types.ObjectId(tableId),
    });
    if (room) {
      res.status(200).send({
        success: true,
        error: "no-error",
      });
    } else {
      res.status(404).send({
        success: false,
        error: "Table not found",
      });
    }
  } catch (error) {
    console.log("Error in Poker game server =>", error);
  }
});

app.get("/rescueTable/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;
    const room = await roomModel.findOne({
      _id: mongoose.Types.ObjectId(tableId),
    });
    if (room) {
      let firstGameTime = new Date(room.firstGameTime);
      let now = new Date();
      if ((now - firstGameTime) / (1000 * 60) > 15) {
        let player;
        if (room.runninground === 0) {
          player = room.players;
        } else if (room.runninground === 1) {
          player = room.preflopround;
        } else if (room.runninground === 2) {
          player = room.flopround;
        } else if (room.runninground === 3) {
          player = room.turnround;
        } else if (room.runninground === 4) {
          player = room.riverround;
        } else if (room.runninground === 5) {
          player = room.showdown;
        }
        let allUsers = player.concat(room.watchers);
        let users = [];
        allUsers.forEach((item) => {
          let uid = item.id ? item.id : item.userid;
          users.push({
            uid,
            hands: item.hands,
            coinsBeforeJoin: item.initialCoinBeforeStart,
            gameLeaveAt: new Date(),
            gameJoinedAt: item.gameJoinedAt,
            isWatcher: room.watchers.find((ele) => ele.userid === uid)
              ? true
              : false,
          });
        });
        let payload = {
          gameColl: room.gameType,
          tableId: room.tableId,
          buyIn: room.gameType === "pokerTournament_Tables" ? room.maxchips : 0,
          playerCount: player.length,
          users: users,
          adminUid: room.hostId,
        };
        res.status(200).send({
          stuckTable: payload,
          success: true,
          error: "no-error",
        });
      } else {
        res.status(404).send({
          success: false,
          error: "Table exist and its running in game",
        });
      }
    } else {
      res.status(404).send({
        success: false,
        error: "Table not Found",
      });
    }
  } catch (error) {
    console.log("Error in rescueTable api", error);
    res.status(500).send({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/deleteStuckTable/:tableId", async (req, res) => {
  try {
    const { tableId } = req.params;
    const room = await roomModel.deleteOne({
      _id: mongoose.Types.ObjectId(tableId),
    });
    if (room) {
      res.status(200).send({
        success: true,
        error: "no-error",
      });
    } else {
      res.status(404).send({
        success: false,
        error: "Table not found",
      });
    }
  } catch (error) {
    console.log("Error in Poker game delete table api =>", error);
  }
});

app.get("/leaveGame/:tableId/:userId", async (req, res) => {
  try {
    let { tableId, userId } = req.params;
    tableId = mongoose.Types.ObjectId(tableId);
    let roomdata = await roomModel
      .findOne({
        _id: tableId,
      })
      .lean();
    if (
      roomdata &&
      roomdata.players.find((el) => el.userid.toString() === userId?.toString())
    ) {
      const ress = await doLeaveTable({ tableId, userId }, io);
      return res.send({
        success: true,
      });
    } else if (
      roomdata &&
      roomdata.watchers.find((el) => el.userid === userId)
    ) {
      await doLeaveWatcher({ tableId, userId }, io);
      return res.send({
        success: true,
      });
    } else {
      let roomdata = await roomModel.findOne({ tableId }).lean();
      if (!roomdata?.players?.find((el) => el.id === userId)) {
        return res.send({
          success: true,
        });
      }
    }
  } catch (error) {
    console.log("Error in checkUserInGame api", error);
    res.status(500).send({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/checkUserInGame/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const room = await roomModel.findOne({
      $or: [
        {
          players: { $elemMatch: { userid: mongoose.Types.ObjectId(userId) } },
        },
        {
          watchers: { $elemMatch: { userid: mongoose.Types.ObjectId(userId) } },
        },
      ],
    });
    if (
      room &&
      (room.players.find((el) => el.userid.toString() === userId?.toString()) ||
        room.watchers.find((el) => el.userid.toString() === userId?.toString()))
    ) {
      res.status(200).send({
        success: false,
        gameStatus: "InGame",
        link: `${req.baseUrl}/poker/index.html?tableid=${room._id}&gameCollection=${room.gameType}#/`,
        leaveTableUrl: `https://poker-server-t3e66zpola-uc.a.run.app/leaveGame/${room._id}/${userId}`,
      });
    } else {
      res.status(200).send({
        success: true,
        gameStatus: "online",
      });
    }
  } catch (error) {
    console.log("Error in checkUserInGame api", error);
    res.status(500).send({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/getUserForInvite/:tableId", async (req, res) => {
  try {
    if (!req.params.tableId) {
      return res.status(400).send({ msg: "Table id not found." });
    }

    const roomData = await roomModel.findOne({
      _id: mongoose.Types.ObjectId(req.params.tableId),
    });

    if (!roomData) {
      return res.status(403).send({ msg: "Table not found." });
    }

    const { leavereq, invPlayers, players } = roomData;
    const allId = [...leavereq, ...invPlayers, ...players.map((el) => el.id)];

    const allUsers = await User.find({
      _id: { $nin: allId },
      isRegistrationComplete: true,
    }).select({ id: 1, username: 1 });

    return res.status(200).send({ data: allUsers });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal server error" });
  }
});

app.get("/user/getAllNotifications", auth(), async (req, res) => {
  try {
    const { _id } = req.user;
    // console.log("_id", _id);
    const notifications = await Notification.find({
      $and: [{ receiver: _id.toString() }],
    }).sort({ _id: -1 });
    // console.log(notifications);
    return res.status(200).send(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal server error" });
  }
});

app.get("/user/notificationCount", auth(), async (req, res) => {
  try {
    const { _id } = req.user;
    // console.log("_id", _id);
    const counts = await Notification.countDocuments({
      $and: [{ receiver: _id.toString() }, { isRead: false }],
    });
    // console.log(counts);
    return res.status(200).send({ counts });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal server error" });
  }
});

app.get("/user/seenAllNotifications", auth(), async (req, res) => {
  try {
    const { _id } = req.user;
    // console.log("_id", _id);
    // const counts = await Notification.updateMany(
    //   {
    //     $and: [{ receiver: _id.toString() }, { seen: false }],
    //   },
    //   { seen: true }
    // );
    const up = await Notification.updateMany(
      { receiver: _id.toString() },
      {
        $set: {
          isRead: true,
        },
      },
      { upsert: false }
    );
    // console.log(counts);
    if (up.nModified) {
      const counts = await Notification.countDocuments({
        receiver: _id.toString(),
        isRead: false,
      });
      return res.status(200).send({ counts });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal server error" });
  }
});

app.use("/poker", pokerRoute(io)); //, auth()
// app.use("/tournament", auth(), tournamentRoute);
// app.use("/v1/admin/auth", adminRoute);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.use("/v1/admin/auth", adminRoute(io));
app.use("/v1/poker/tournament", tournamentRoute(io));

app.use("*", (req, res) => res.status(404).send({ message: "Api not found" }));
//server
server.listen(PORT, () => console.log(`server running on port ${PORT}`));

// const testFun = async () => {
//   try {
//     const transactionRecipt = await thirdWeb.getTransactionReceipt('0xfcee673d4521ca31e5a871dacb2bfaf3e19673c8c5ffc178df4a9f9d1e64b489');
//     console.log("transactionRecipt ==>", transactionRecipt);
//   } catch (e) {
//     console.log("errorr in testfun ==>", e);
//   }
// };
// testFun();
