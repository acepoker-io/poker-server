import express from "express";
import {
  CreateTournament,
  deleteTournament,
  updateTournament,
  getAllTournament,
} from "../controller/admin/pokerTournament.controller.js";
import auth from "../landing-server/middlewares/auth.js";

const router = express.Router();
const tournamentRoute = (io) => {
  router.post("/CreateTournament", auth(), (req, res) =>
    CreateTournament(req, res, io)
  );
  // router.post("/CreateSitAndGoTournament", auth(), (req, res) =>
  //   CreateSitAndGoTournament(req, res, io)
  // );
  // router.post("/createTable", auth(), (req, res) => createTable(req, res, io));
  // router.get("/AllMulti-TableTournament", auth(), getMultiTableTournament);
  // router.get("/sit&goTournament", auth(), getSitAndGoTournament);
  router.post("/UpdateTournament", auth(), (req, res) =>
    updateTournament(req, res, io)
  );
  // router.post("/UpdateSitAndGoTournament", auth(), (req, res) =>
  //   updateSitAndGoTournament(req, res, io)
  // );
  router.delete("/DeleteTournament", auth(), (req, res) =>
    deleteTournament(req, res, io)
  );

  router.get("/AllTournament", auth(), getAllTournament);
  // router.delete("/GetSingleTournament", auth(), getSingleTournament);
  // router.delete("/DeleteTable", auth(), (req, res) =>
  //   deleteTable(req, res, io)
  // );
  return router;
};
export default tournamentRoute;
