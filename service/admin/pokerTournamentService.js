import httpStatus from "http-status";
import ApiError from "../../landing-server/utils/ApiError";
import tournamentModel from "../../models/tournament.js";
import roomModel from "../../models/room.js";

const converMongoId = (id) => mongoose.Types.ObjectId(id);
const CreateTournament = async (userBody) => {
  console.log("userBody ====>", userBody);

  const checkTournament = await tournamentModel.findOne({
    name: userBody?.name?.toLowerCase(),
  });
  if (checkTournament) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tournament name already exist");
  }
  //   let winPlayers;
  //   if (userBody.prizeType === "Fixed") {
  //     winPlayers = {
  //       first: {
  //         userId: null,
  //         amount: userBody?.first,
  //         playerCount: 1,
  //       },
  //       second: {
  //         userId: null,
  //         amount: userBody?.second,
  //         playerCount: 1,
  //       },
  //       third: {
  //         userId: null,
  //         amount: userBody?.third,
  //         playerCount: 1,
  //       },
  //       "4-10": {
  //         userIds: [],
  //         amount: userBody?.["4-10"],
  //         playerCount: 7,
  //       },
  //       "11-25": {
  //         userIds: [],
  //         amount: userBody?.["11-25"],
  //         playerCount: 15,
  //       },
  //     };
  //   } else {
  //     winPlayers = null;
  //   }
  const payload = {
    name: userBody?.name?.toLowerCase(),
    tournamentFee: userBody.tournamentFees,
    levels: {
      bigBlind: { amount: userBody?.bigBlind || 0 },
      smallBlind: { amount: userBody?.smallBlind || 0 },
      level: 1,
    },
    havePlayers: userBody?.havePlayers,
    // startDate: userBody?.startDate,
    // startTime: `${new Date(userBody?.tournamentDate).getUTCHours()}:${new Date(
    //   userBody?.tournamentDate
    // ).getUTCMinutes()}:00`,
    // tournamentDate: userBody?.tournamentDate,
    incBlindTime: userBody?.incBlindTime,
    // winTotalPlayer: parseInt(userBody?.winTotalPlayer) || 0,
    buyIn: parseInt(userBody?.buyIn),
    winPlayer: [],
    winnerAmount: userBody?.first,
    // prizeType: userBody.prizeType,
    // tournamentType: "Multi-Table",
    // prizeDistribution: userBody.prizeDistribution,
    // joinTime: userBody.joinTime,
  };
  const user = await tournamentModel.create(payload);
  return user;
};

const updateTournament = async (tournamentId, tournamentBody) => {
  try {
    const findTournament = await tournamentModel.findOne({
      _id: tournamentId.toString(),
    });
    if (!findTournament) {
      throw new ApiError(httpStatus.NOT_FOUND, "Tournament not found");
    }
    // if (
    //   tournamentBody?.name?.toLowerCase() !==
    //   tournamentBody?.existTournamentName?.toLowerCase()
    // ) {
    //   const checkTournament = await tournamentModel.findOne({
    //     name: tournamentBody?.name?.toLowerCase(),
    //   });
    //   if (checkTournament) {
    //     throw new ApiError(
    //       httpStatus.NOT_FOUND,
    //       "Tournament name already exist"
    //     );
    //   }
    // }
    // let winPlayers;
    // if (tournamentBody.prizeType === "Fixed") {
    //   winPlayers = {
    //     first: {
    //       userId: null,
    //       amount: tournamentBody?.first,
    //       playerCount: 1,
    //     },
    //     second: {
    //       userId: null,
    //       amount: tournamentBody?.second,
    //       playerCount: 1,
    //     },
    //     third: {
    //       userId: null,
    //       amount: tournamentBody?.third,
    //       playerCount: 1,
    //     },
    //     "4-10": {
    //       userIds: [],
    //       amount: tournamentBody?.["4-10"],
    //       playerCount: 7,
    //     },
    //     "11-25": {
    //       userIds: [],
    //       amount: tournamentBody?.["11-25"],
    //       playerCount: 15,
    //     },
    //   };
    // } else {
    //   winPlayers = null;
    // }
    const payload = {
      name: tournamentBody?.name.toLowerCase(),
      tournamentFee: tournamentBody?.tournamentFees,
      levels: {
        bigBlind: { amount: tournamentBody?.bigBlind || 0 },
        smallBlind: { amount: tournamentBody?.smallBlind || 0 },
        level: 1,
      },
      havePlayers: tournamentBody?.havePlayers,
      //   startDate: tournamentBody?.startDate,
      //   startTime: `${new Date(
      //     tournamentBody?.tournamentDate
      //   ).getUTCHours()}:${new Date(
      //     tournamentBody?.tournamentDate
      //   ).getUTCMinutes()}:00`,
      //   havePlayers: tournamentBody?.havePlayers,
      //   tournamentDate: tournamentBody?.tournamentDate,
      incBlindTime: tournamentBody?.incBlindTime,
      //   winTotalPlayer: parseInt(tournamentBody?.winTotalPlayer) || 0,
      buyIn: parseInt(tournamentBody?.buyIn),
      winPlayer: [],
      havePlayers: tournamentBody?.havePlayers,
      //   prizeType: tournamentBody.prizeType,
      //   prizeDistribution: tournamentBody.prizeDistribution,
      //   tournamentType: "Multi-Table",
      //   joinTime: tournamentBody.joinTime,
    };
    await tournamentModel.updateOne({ _id: tournamentId }, payload);
    return { code: 200, msg: "Tournament updated successfully" };
  } catch (err) {
    console.log("Error in update tournament-->", err);
    throw new ApiError(httpStatus.NOT_FOUND, "Internal Server Error!");
  }
};

const deleteTournament = async (tournamentId) => {
  const tournament = await tournamentModel.findOne({ _id: tournamentId });
  const roomIdArr = tournament?.rooms;
  if (!tournament) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tournament not found");
  }
  await roomModel.deleteMany({
    _id: {
      $in: roomIdArr,
    },
  });

  await tournament.remove();
  return tournament;
};

const getAllTournament = async (query) => {
  const skip = Number(query.skip);
  const limit = Number(query.limit);
  const tournament = await tournamentModel
    .find({ tournamentType: "Multi-Table" })
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });
  const count = await tournamentModel.countDocuments({});
  return { tournament, count };
};

const pokerTournamentService = {
  CreateTournament,
  updateTournament,
  deleteTournament,
  getAllTournament,
};
export default pokerTournamentService;
