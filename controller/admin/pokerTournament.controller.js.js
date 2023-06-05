import pokerTournamentService from "../../service/admin/pokerTournamentService.js";
export const CreateTournament = async (req, res, io) => {
  try {
    const response = await pokerTournamentService.CreateTournament(req.body);
    if (response) {
      io.emit("tournamentAction", { creation: true });
      return res.status(200).send({ msg: "Tournament created successfully" });
    }
  } catch (err) {
    console.log("Error---->", err);
    return res.status(401).send({ msg: "Something went wrong" });
  }
};

export const updateTournament = async (req, res, io) => {
  try {
    const response = await pokerTournamentService.updateTournament(
      req.body.tournamentId,
      req.body
    );
    if (response) {
      io.emit("tournamentAction", { creation: true });
      return res.status(200).send(response);
    }
  } catch (err) {
    return res.status(401).send({ message: "Something went wrong!" });
  }
};

export const deleteTournament = async (req, res, io) => {
  try {
    const response = await pokerTournamentService.deleteTournament(
      req.query.tournamentId
    );
    if (response) {
      io.emit("tournamentAction", { creation: true });
      return res.status(200).send(response);
    }
  } catch (err) {
    return res.status(401).send({ message: "Something went wrong!" });
  }
};

export const getAllTournament = async (req, res) => {
  const response = await pokerTournamentService.getAllTournament(req.query);
  if (!response) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tournament not found");
  }
  return res.status(200).send(response);
};
