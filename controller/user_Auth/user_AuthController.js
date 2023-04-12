import httpStatus from "http-status";
import multiparty from "multiparty";
import pick from "../../landing-server/utils/pick.js";
import ApiError from "../../landing-server/utils/ApiError.js";
import catchAsync from "../../landing-server/utils/catchAsync.js";
import userService from "../../service/user.service.js";
import s3Service from "../../service/s3.service.js";
import tokenService from "../../service/token.service.js";
// import logger from '../config/logger.js';
import transactionModel from "../../models/transaction.js";
// import Friends from '../models/friend.model.js';
import User from "../../landing-server/models/user.model.js";

// import s3Service from '../services/s3.service.js';
// import User from '../models/user.model.js';

const createUser = catchAsync(async (req, res, next) => {
  console.log("body data--->", req.body);
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res
    .status(httpStatus.CREATED)
    .send({ user: user, token: tokens.access.token });
});

const loginWithMetamask = async (req, res) => {
  try {
    const { metaMaskAddress } = req.body;
    const userData = await User.findOne({ metaMaskAddress });
    if (!userData) {
      // return res.send({status:401, message:"Please provide detail"});

      const user = await User.create({
        username: metaMaskAddress?.trim()?.toString()?.slice(0, 10),
        metaMaskAddress: metaMaskAddress,
      });
      res.send({
        user: user,
        token: tokens.access.token,
        status: 200,
      });
    }
    const tokens = await tokenService.generateAuthTokens(userData);
    res.send({ user: userData, token: tokens.access.token, status: 200 });
  } catch (err) {
    throw new ApiError(500, "Internal server error");
  }
};

const getUsers = catchAsync(async (req, res, next) => {
  try {
    const filter = pick(req.query, ["firstName", "role"]);
    const options = pick(req.query, ["sortBy", "limit", "page"]);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  if (user) {
    return res.send(user);
  }
  logger.info(JSON.stringify(err));
  throw new ApiError(httpStatus.NOT_FOUND, "Something went wrong!");
});
export const updateUserProfile = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.user._id, req.body);
  if (user) {
    return res.send({ userDetail: user });
  }
  logger.info(JSON.stringify(err));
  throw new ApiError(httpStatus.NOT_FOUND, "Something went wrong!");
});
export const userPasswordSetting = catchAsync(async (req, res, next) => {
  const user = await userService.updatePassword(req.user._id, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const uploadProfile = catchAsync(async (req, res, next) => {
  const form = new multiparty.Form();
  connsole.log("updload profile executed");
  form.parse(req, async (error, fields, files) => {
    if (error) throw new ApiError(httpStatus.NOT_FOUND, "Wrong file format");
    if (files.file.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Please upload profile image.");
    }
    const user = await userService.uploadUserProfile(files.file[0], req.user);
    if (user) {
      return res.status(200).send({ userDetail: user });
    }
    logger.info(JSON.stringify(err));
    throw new ApiError(httpStatus.NOT_FOUND, "Something went wrong!");
  });
});

const getUserTransaction = catchAsync(async (req, res, next) => {
  console.log("getUserTransaction called==>", req.query);
  const transaction = await userService.getUserTransaction(
    req.user._id,
    req.query
  );
  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found");
  }
  res.send(transaction);
});

const getGameHistory = async (req, res) => {
  console.log("getGameHistory ==>", req.query);
  try {
    const { userId } = req.query;
    const gamesCount = await transactionModel.countDocuments({
      userId: userId,
    });
    const lossCount = await transactionModel.countDocuments({
      $and: [{ userId: userId }, { amount: { $lt: 0 } }],
    });
    const winsCount = await transactionModel.countDocuments({
      $and: [{ userId: userId }, { amount: { $gt: 0 } }],
    });
    const populatedFriends = await User.findOne({ _id: userId }).populate({
      path: "friends",
    });
    // console.log('populatedFriends =============>', populatedFriends);
    const reqFriendsArr = populatedFriends?.friends?.filter(
      (friend) => friend?.status === 3 && !friend?.isBlocked
    );
    res.status(200).json({
      gamesCount,
      lossCount,
      winsCount,
      friendsCount: reqFriendsArr?.length || 0,
    });
  } catch (err) {
    console.error("error in get game history", err);
    res.status(400).json({
      success: false,
      msg: "Somthing went wrong",
    });
  }
};
const checkUserInGame = catchAsync(async (req, res, next) => {
  const inGame = await userService.checkUserAvailableInGame(req.user._id);

  if (inGame?.pokerGame) {
    let API_URL;
    if (req.headers.origin === "http://localhost:3000") {
      API_URL = "http://localhost:3002";
    }
    if (req.headers.origin === "https://devpoker.scrooge.casino") {
      API_URL = "https://devpoker-api.scrooge.casino";
    }
    if (req.headers.origin === "https://betapoker.scrooge.casino") {
      API_URL = "https://betapoker-api.scrooge.casino";
    }
    if (req.headers.origin === "https://poker.scrooge.casino") {
      API_URL = "https://poker-api.scrooge.casino";
    }
    if (req.headers.origin === "https://devblackjack.scrooge.casino") {
      API_URL = "https://devpoker-api.scrooge.casino";
    }
    if (req.headers.origin === "https://betablackjack.scrooge.casino") {
      API_URL = "https://betapoker-api.scrooge.casino";
    }
    if (req.headers.origin === "https://blackjack.scrooge.casino") {
      API_URL = "https://poker-api.scrooge.casino";
    }
    return res.status(200).json({
      inGame: true,
      reJoinUrl: `${req.headers.origin}/table?gamecollection=poker&tableid=${inGame?.pokerGame?._id}`,
      leaveTable: `${API_URL}/leaveGame/${inGame?.pokerGame?._id}/${req.user._id}`,
    });
  }
  if (inGame?.blackjackGame) {
    let API_URL;
    if (req.headers.origin === "http://localhost:3000") {
      API_URL = "http://localhost:3003";
    }
    if (req.headers.origin === "https://devblackjack.scrooge.casino") {
      API_URL = "https://devblackjack-api.scrooge.casino";
    }
    if (req.headers.origin === "https://betablackjack.scrooge.casino") {
      API_URL = "https://betablackjack-api.scrooge.casino";
    }
    if (req.headers.origin === "https://blackjack.scrooge.casino") {
      API_URL = "https://blackjack-api.scrooge.casino";
    }
    if (req.headers.origin === "https://devpoker.scrooge.casino") {
      API_URL = "https://devblackjack-api.scrooge.casino";
    }
    if (req.headers.origin === "https://betapoker.scrooge.casino") {
      API_URL = "https://betablackjack-api.scrooge.casino";
    }
    if (req.headers.origin === "https://poker.scrooge.casino") {
      API_URL = "https://blackjack-api.scrooge.casino";
    }
    return res.status(200).json({
      inGame: true,
      reJoinUrl: `${req.headers.origin}/game?gamecollection=Blackjack_Tables&tableid=${inGame?.blackjackGame?._id}`,
      leaveTable: `${API_URL}/leaveGame/${inGame?.blackjackGame?._id}/${req.user._id}`,
    });
  }
  return res.status(200).json({
    inGame: false,
    reJoinUrl: "",
    leaveTable: "",
  });
});

const getKycDetails = catchAsync(async (req, res) => {
  const response = await userService.getKycDetails(req);
  res.status(response.code).send(response);
});

const createKyc = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const userKYC = await KYCModel.findOne({ userId }, { status: 1 });
  if (userKYC && userKYC.status === "idle") {
    throw new ApiError(409, "You already applied for KYC.");
  }
  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if (err) throw new ApiError(httpStatus.NOT_FOUND, err);
    const formValues = JSON.parse(fields.formValues);
    const { IDimageFront, IDimageBack } = files;

    // Check image sizes
    if (
      IDimageFront[0]?.size > 10 * 1024 * 1024 ||
      IDimageBack[0]?.size > 10 * 1024 * 1024
    ) {
      return res.status(400).send({
        code: 400,
        message: "Image size should not be greater than 10 MB.",
      });
    }
    const { Location: frontUpload } = await s3Service.uploadS3(IDimageFront[0]);
    const { Location: backUpload } = await s3Service.uploadS3(IDimageBack[0]);
    formValues.IDimageFront = frontUpload;
    formValues.IDimageBack = backUpload;
    formValues.birthDate = new Date(formValues.birthDate);
    formValues.userId = req.user.id;
    const userKYCCreate = await userService.createKYC(userId, formValues);
    res.status(httpStatus.CREATED).send(userKYCCreate);
  });
});

const userController = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadProfile,
  updateUserProfile,
  userPasswordSetting,
  getUserTransaction,
  getGameHistory,
  checkUserInGame,
  getKycDetails,
  createKyc,
  loginWithMetamask,
};
export default userController;
