import mongoose, { mongo } from "mongoose";
import User from "../landing-server/models/user.model.js";
import s3Service from "./s3.service.js";
import roomModel from "../models/room.js";

const convertMongoId = (id) => mongoose.Types.ObjectId(id);

const getUserById = async (userId) => {
  const userData = await User.findOne({ _id: convertMongoId(userId) });
  return userData;
};

const updateUserWallet = async (userId, walletAmount = 0) => {
  try {
    await User.updateOne(
      { _id: convertMongoId(userId) },
      { wallet: walletAmount }
    );
    return true;
  } catch (error) {
    throw new Error(false);
  }
};

const getUserByEmail = async (email) => {
  const user = User.findOne({ email: email?.toLowerCase().trim() });
  return user;
};
const getUserByPhone = async (phone) => {
  const phoneDate = await User.findOne({ phone: `${phone?.toString()}` });
  return phoneDate;
};
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const createUser = async (userBody) => {
  const checkExist = await User.findOne({
    metaMaskAddress: userBody?.metaMaskAddress,
  });
  if (checkExist) return checkExist;
  const user = await User.create(userBody);
  return user;
};

const getAdminEmail = async (email) => {
  const user = User.findOne({
    email: email?.toLowerCase().trim(),
    role: "admin",
  });
  return user;
};

const uploadUserProfile = async (file, user) => {
  console.log("file ====>", file);
  const res = await s3Service.uploadS3(file);
  console.log("res ===>", res);
  const upd = await User.updateOne(
    {
      _id: user._id,
    },
    { profile: res.Location }
  );
  if (upd.nModified === 1) {
    const users = await User.findOne({ _id: user._id });
    return users;
  }
  return false;
};
const checkUserAvailableInGame = async (userId) => {
  const promiseData = await Promise.allSettled([
    roomModel.findOne({ "players.userid": userId, tournament: null }),
  ]);
  const [pokerGame] = promiseData.map((el) => el.value);
  return {
    pokerGame: pokerGame,
  };
};

const getAllFriends = async (req, res, next) => {
  const users = await User.find({});
  if (!users) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }
  return { users };
};

const userService = {
  getUserById,
  updateUserWallet,
  getAdminEmail,
  createUser,
  updateUserById,
  uploadUserProfile,
  checkUserAvailableInGame,
  getAllFriends,
};

export default userService;
