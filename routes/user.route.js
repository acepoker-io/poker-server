import express from "express";
import auth from "../landing-server/middlewares/auth";
import userController from "../controller/user/user.controller";
import chatCotroller from "../controller/user/chat.controller";

const router = express.Router();

router.get("/getAllFriends", auth(), userController.getAllFriends);
router.get("/chats/:senderId/:recieverId", auth(), chatCotroller.getChats);
router.get("/chatlist", auth(), chatCotroller.chatList);

export default router;
