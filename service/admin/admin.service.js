import httpStatus from "http-status";
// import tournamentModel from "../../models/tournament.model.js";
// import transactionModel from "../../models/transaction.model.js";
// import User from "../../models/user.model.js";
// import ApiError from "../../utils/ApiError.js";
import transactionModel from "../../models/transaction.js";
// import User from "../../models/userModel.js";
import ApiError from "../../landing-server/utils/ApiError.js";
import User from "../../landing-server/models/user.model.js";

const blockUser = async (id) => {
  const users = await User.findOne({ _id: id }, { isBlock: 1 });
  const block = await User.updateOne({ _id: id }, { isBlock: !users.isBlock });
  if (block.nModified === 0) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Not exist");
  }
  const user = await User.findOne(
    { _id: id },
    {
      username: 1,
      email: 1,
      phone: 1,
      profile: 1,
      isBlock: 1,
      wallet: 1,
      lastName: 1,
      firstName: 1,
    }
  );
  const blockAction = !users.isBlock ? "blocked" : "active";
  return { status: 200, msg: blockAction, user };
};
const deleteUser = async (id) => {
  const users = await User.findOne({ _id: id });
  if (!users) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not exist");
  }
  const deleteUser = await User.deleteOne({ _id: id });
  if (deleteUser) {
    return true;
  }
  return false;
};

const getAllUsers = async (query) => {
  let search;
  const skip = Number(query.skip);
  const limit = Number(query.limit);
  if (query?.keyword && query?.keyword !== "") {
    if (query.keyword.startsWith("+")) {
      query.keyword = query.keyword.substring(1);
    }
    // if (query.keyword === 'block') {
    //   blockKey = true;
    // }
    // if (query.keyword === 'active') {
    //   blockKey = false;
    // }
    search = {
      $or: [
        {
          phone: {
            $regex: `${query.keyword}`,
          },
        },
        { username: { $regex: query.keyword, $options: "i" } },
        { firstName: { $regex: query.keyword, $options: "i" } },
        { lastName: { $regex: query.keyword, $options: "i" } },
        { email: { $regex: query.keyword, $options: "i" } },
      ],
    };
  } else {
    search = {};
  }
  // , {
  //   firstName: 1,
  //   lastName: 1,
  //   email: 1,
  //   profile: 1,
  //   username: 1,
  //   phone: 1,
  //   wallet: 1,
  //   isBlock: 1,
  // }
  const users = await User.find(search)
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 });
  const count = await User.countDocuments(search);
  return { users, count };
};

const updateUser = async (userId, updateBody) => {
  const {
    // firstName,
    // lastName,
    // email,
    username,
    // phone,
    // existEmail,
    existUsername,
    // existPhone,
  } = updateBody;
  if (username.toLowerCase()?.trim() !== existUsername.toLowerCase()?.trim()) {
    const existName = await User.findOne({
      username: username?.toLowerCase()?.trim(),
    });
    if (existName) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Username already taken");
    }
  }
  // if (email.toLowerCase()?.trim() !== existEmail.toLowerCase()?.trim()) {
  //   const existUserEmail = await User.findOne({
  //     email: email.toLowerCase()?.trim(),
  //   });
  //   if (existUserEmail) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, "Email already exist");
  //   }
  // }
  // if (phone !== existPhone) {
  //   const existUserPhone = await User.findOne({
  //     phone: phone,
  //   });
  //   if (existUserPhone) {
  //     throw new ApiError(
  //       httpStatus.BAD_REQUEST,
  //       "Phone Number is already in use"
  //     );
  //   }
  // }
  const userUpdate = await User.updateOne(
    { _id: userId },
    {
      // firstName,
      // lastName,
      // phone,
      // email: email.toLowerCase()?.trim(),
      username: username?.toLowerCase()?.trim(),
    }
  );
  if (userUpdate) {
    return true;
  }
  return false;
};
const createUser = async (userBody) => {
  try {
    const { username } = userBody;
    const existName = await User.findOne({
      username: username.toString().trim(),
    });
    if (existName) {
      // throw new ApiError(httpStatus.BAD_REQUEST, "Username already taken");
      return {
        success: false,
        message: "Username already taken",
      };
    }
    const createUser = await User.create({
      username: username?.toString().trim(),
    });
    if (createUser) {
      return {
        success: true,
        message: "User created successfully",
      };
    }
    return {
      success: false,
      message: "Something went wrong",
    };
  } catch (err) {
    return {
      success: false,
      message: "Internal server error",
    };
  }
};
const allDashboardCount = async () => {
  try {
    const allData = await Promise.allSettled([
      // user count
      User.find({}).count(),
      // bet count
      transactionModel.find({}).count(),
    ]);

    const [userCount, transactionCount] = allData.map((el) => el.value);
    return {
      transactionCount,
      userCount,
    };
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Internal server error");
  }
};
const monthlyGameStats = async (info) => {
  try {
    const yearly = info?.yearly || new Date().getFullYear();

    const gameStatsResYearly = await transactionModel.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            gameType: "$transactionType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          percent: { $divide: ["$count", 100] },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    let rouletteStats = [];
    let slotStats = [];
    let blackjackStats = [];
    gameStatsResYearly.filter((el) => {
      if (el?._id.gameType === "poker" && el?._id?.year === Number(yearly)) {
        rouletteStats.push({ month: el?._id?.month, percent: el.percent });
      } else if (
        el?._id.gameType === "slot" &&
        el?._id?.year === Number(yearly)
      ) {
        slotStats.push({ month: el?._id?.month, percent: el.percent });
      } else if (
        el?._id.gameType === "blackjack" &&
        el?._id?.year === Number(yearly)
      ) {
        blackjackStats.push({ month: el?._id?.month, percent: el.percent });
      }
    });
    return { slotStats, rouletteStats, blackjackStats };
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Internal server error");
  }
};

const allTransaction = async (query) => {
  const skip = Number(query.skip);
  const limit = Number(query.limit);
  let filterObj = {};
  let searchObj = {};
  let sortObj = {};
  console.log("query ==>", query);

  if (query?.searchKey) {
    searchObj = {
      $or: [
        { username: { $regex: query.searchKey, $options: "i" } },
        // { firstName: { $regex: query.searchKey, $options: "i" } },
        // { lastName: { $regex: query.searchKey, $options: "i" } },
        // { email: { $regex: query.searchKey, $options: "i" } },
      ],
    };
    const user = await User.find(searchObj);
    console.log("user", user);
    filterObj.userId = { $in: user.map((e) => e._id) };
    // filterObj = searchObj;
  }

  if (query?.filter) {
    filterObj.transactionType = query?.filter;
  }

  if (query?.sort?.sortBy) {
    sortObj[query?.sort?.sortBy] = parseInt(query?.sort?.sort);
  } else {
    sortObj = { _id: -1 };
  }

  // filterObj.userId = { $exists: true };

  console.log("sortObj: ==>", sortObj);
  console.log("filterObj: ==>", filterObj);

  const transaction = await transactionModel
    .find(filterObj)
    .populate({
      path: "userId",
      select: {
        firstName: 1,
        lastName: 1,
        email: 1,
        profile: 1,
        username: 1,
        phone: 1,
        wallet: 1,
        isBlock: 1,
      },
    })
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  console.log("filterObj ====>", filterObj);
  const count = await transactionModel.countDocuments(filterObj);
  return { transaction, count };
};

const updateUserWallet = async (id, body) => {
  const users = await User.findOne({ _id: id });
  if (!users) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User Not found");
  }
  console.log("user Id: ==>", id);
  const user = await User.findOne({ _id: id });
  const block = await User.updateOne(
    { _id: id },
    { $set: { wallet: parseInt(body?.wallet) } }
  );
  transactionModel.create({
    userId: id,
    amount: body?.wallet,
    prevWallet: user?.wallet,
    updatedWallet: user?.wallet + parseInt(body?.wallet),
    transactionType: "updated by admin",
    prevTicket: user?.ticket,
    updatedTicket: user?.ticket,
  });

  if (block.nModified === 0) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Failed to update");
  }
  return { status: 200, msg: "Wallet updated successfully" };
};

// const CreateTournament = async (userBody) => {
//   console.log({ userBody });
//   const user = await tournamentModel.create(userBody);
//   return user;
// };

// const getKyc = async (payload) => {
//   const { limit, page, searchTerm, status } = payload;

//   const totatCount = await KYCModel.aggregate([
//     {
//       $match: {
//         $and: [
//           { status },
//           {
//             // eslint-disable-next-line security/detect-non-literal-regexp
//             $or: [
//               { firstName: { $regex: new RegExp(searchTerm, "i") } },
//               { lastName: new RegExp(searchTerm, "i") },
//             ],
//           },
//         ],
//       },
//     },
//     {
//       $count: "count",
//     },
//   ]);

//   const { count = 0 } = totatCount[0] || {};

//   const totalPages = Math.ceil(count / limit);
//   const offset = (page - 1) * limit;
//   // eslint-disable-next-line security/detect-non-literal-regexp
//   const kycData = await KYCModel.aggregate([
//     {
//       $match: {
//         $and: [
//           { status },
//           {
//             // eslint-disable-next-line security/detect-non-literal-regexp
//             $or: [
//               { firstName: { $regex: new RegExp(searchTerm, "i") } },
//               { lastName: new RegExp(searchTerm, "i") },
//             ],
//           },
//         ],
//       },
//     },
//     {
//       $sort: {
//         updatedAt: -1,
//       },
//     },
//     {
//       $skip: offset,
//     },
//     {
//       $limit: limit,
//     },
//   ]);

//   return { code: 200, kycData, totalPages };
// };

// const udpateKyc = async (payload) => {
//   const { id, status } = payload;

//   await KYCModel.updateOne({ _id: id }, { $set: { status } });

//   const message = `KYC Request ${status}ed `;

//   return { code: 200, message };
// };

const adminService = {
  getAllUsers,
  blockUser,
  deleteUser,
  updateUser,
  allDashboardCount,
  monthlyGameStats,
  allTransaction,
  updateUserWallet,
  createUser,
};
export default adminService;
