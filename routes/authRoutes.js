import express from "express";
import {
  getAllGame,
  enterRoom,
  getTournamentById,
} from "../controller/tournamentController";
import {createUser} from '../controller/user_Auth/user_AuthController'
// import auth from "../landing-server/middlewares/auth";

const router = express.Router();

router.get("/register", createUser);
router.get('/Login',getTournamentById)

export default router;