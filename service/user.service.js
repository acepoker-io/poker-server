import mongoose, { mongo } from "mongoose";
import User from "../landing-server/models/user.model.js";

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

const createUser = async (userBody) => {
  const checkExist = await User.findOne({ googleId: userBody.googleId });
  if (checkExist) return checkExist;
  console.log("userBody", userBody);
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

const userService = {
  getUserById,
  updateUserWallet,
  getAdminEmail,
  createUser,
  updateUserById,
};

export default userService;
