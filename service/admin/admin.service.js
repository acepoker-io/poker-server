import httpStatus from "http-status";
// import tournamentModel from "../../models/tournament.model.js";
// import transactionModel from "../../models/transaction.model.js";
// import User from "../../models/user.model.js";
// import ApiError from "../../utils/ApiError.js";
import transactionModel from "../../models/transaction.js";
// import User from "../../models/userModel.js";
import ApiError from "../../landing-server/utils/ApiError.js";
import User from "../../landing-server/models/user.model.js";
import withdrawRequest from "../../models/withdrawRequest.model.js";

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

const depositWithdrawalReport = async (query) => {
  const { fromDate, toDate, page, limit, sortBy, searchKey } = query;
  const skip = (Number(page) - 1) * Number(limit);
  let filterObject = {};
  let searchObj = {};
  if (searchKey) {
    searchObj = {
      $or: [
        { "userId.username": { $regex: searchKey, $options: "i" } },
        { "userId.firstName": { $regex: searchKey, $options: "i" } },
        { "userId.lastName": { $regex: searchKey, $options: "i" } },
        { "userId.email": { $regex: searchKey, $options: "i" } },
      ],
    };
    // const user = await User.find(searchObj);
    // filterObject.userId = { $in: user.map(e => e._id)};
    filterObject = searchObj;
  }

  let sortByColumn = {};
  if (sortBy) {
    if (sortBy.includes("totalWithdrawal")) {
      sortByColumn.totalWithdrawal = sortBy.includes("asc") ? 1 : -1;
    }
    if (sortBy.includes("totalDeposit")) {
      sortByColumn.totalDeposit = sortBy.includes("asc") ? 1 : -1;
    }
  } else {
    sortByColumn.totalDeposit = -1;
  }
  const mandatory = {
    $and: [
      {
        userId: {
          $exists: true,
        },
      },
      { userId: { $exists: true } },
    ],
  };
  filterObject = {
    ...mandatory,
    ...filterObject,
    transactionType: { $in: ["deposit", "withdraw"] },
  };

  if (fromDate && toDate) {
    filterObject.createdAt = {
      $gte: new Date(fromDate),
      $lt: new Date(toDate),
    };
  }
  console.log("filterObject ==>", filterObject);

  let depositfilterArray = ["deposit"];
  let withdrawalfilterArray = ["withdraw"];
  const popularData = await transactionModel
    .aggregate([
      {
        $match: filterObject,
      },
      {
        $group: {
          _id: "$userId",
          // userProfile: { $first: "$userId.profile" },
          // username: { $first: "$userId.username" },
          totalDeposit: {
            $sum: {
              $cond: {
                if: { $in: ["$transactionType", depositfilterArray] },
                then: { $sum: "$amount" },
                else: 0,
              },
            },
          },
          totalWithdrawal: {
            $sum: {
              $cond: {
                if: { $in: ["$transactionType", withdrawalfilterArray] },
                then: { $sum: "$amount" },
                else: 0,
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "user", // The name of the collection to join with.
          localField: "userId", // The field from the input documents.
          foreignField: "_id", // The field from the foreign collection.
          as: "userId", // The name of the new array field to store the results.
        },
      },
      {
        $project: {
          _id: 1,
          totalDeposit: 1,
          totalWithdrawal: 1,
          username: 1,
          userProfile: 1,
        },
      },
      { $sort: sortByColumn },
    ])
    .skip(skip)
    .limit(Number(limit));

  const count = await transactionModel.aggregate([
    {
      $match: filterObject,
    },
    {
      $group: {
        _id: "$userId",
        // userProfile: { $first: "$userId.profile" },
        // username: { $first: "$userId.username" },
        totalDeposit: {
          $sum: {
            $cond: {
              if: { $in: ["$transactionType", depositfilterArray] },
              then: { $sum: "$amount" },
              else: 0,
            },
          },
        },
        totalWithdrawal: {
          $sum: {
            $cond: {
              if: { $in: ["$transactionType", withdrawalfilterArray] },
              then: { $sum: "$amount" },
              else: 0,
            },
          },
        },
      },
    },

    {
      $project: {
        _id: 1,
        totalDeposit: 1,
        totalWithdrawal: 1,
        username: 1,
        userProfile: 1,
      },
    },
    { $count: "total" },
  ]);
  const totalPages = Math.ceil(count[0]?.total / limit);

  return {
    data: popularData,
    count: count[0]?.total || 0,
    totalPages: totalPages || 0,
  };
};

const reportMembers = async (query) => {
  const { type, fromDate, toDate, page, limit, sortBy, searchKey } = query;
  let array = ["poker", "poker tournament"];

  const skip = (Number(page) - 1) * Number(limit);

  let sortByColumn = {};
  if (sortBy) {
    if (sortBy.includes("totalBet")) {
      sortByColumn.totalBet = sortBy.includes("asc") ? 1 : -1;
    }
    if (sortBy.includes("ticket")) {
      sortByColumn.ticket = sortBy.includes("asc") ? 1 : -1;
    }
    if (sortBy.includes("goldCoin")) {
      sortByColumn.goldCoin = sortBy.includes("asc") ? 1 : -1;
    }
    if (sortBy.includes("wallet")) {
      sortByColumn.wallet = sortBy.includes("asc") ? 1 : -1;
    }
  } else {
    if (type === "Inactive") {
      sortByColumn.totalBet = 1;
    } else {
      sortByColumn.totalBet = -1;
    }
  }
  let filterObject = {};
  if (fromDate && toDate) {
    filterObject.createdAt = {
      $gte: new Date(fromDate),
      $lt: new Date(toDate),
    };
  }
  let searchObj = {};
  if (searchKey) {
    if (type === "Not Played") {
      searchObj = {
        $or: [
          { username: { $regex: searchKey, $options: "i" } },
          { firstName: { $regex: searchKey, $options: "i" } },
          { lastName: { $regex: searchKey, $options: "i" } },
          { email: { $regex: searchKey, $options: "i" } },
        ],
      };
    } else {
      searchObj = {
        $or: [
          { "userId.username": { $regex: searchKey, $options: "i" } },
          { "userId.firstName": { $regex: searchKey, $options: "i" } },
          { "userId.lastName": { $regex: searchKey, $options: "i" } },
          { "userId.email": { $regex: searchKey, $options: "i" } },
        ],
      };
    }
    filterObject = searchObj;
    // const user = await User.find(searchObj);
    // if(type === 'Not Played')
    // {
    //   filterObject._id = { $in: user.map(e => e._id)}
    // }
    // else{
    //   filterObject.userId = { $in: user.map(e => e._id)}
    // }
  }

  if (type === "Not Played") {
    filterObject.transactions = { $size: 0 };
    const notPlayedUsers = await User.aggregate([
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "userId",
          as: "transactions",
        },
      },
      {
        $match: filterObject,
      },
      { $sort: sortByColumn },
    ])
      .skip(skip)
      .limit(Number(limit));

    const count = await User.aggregate([
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "userId",
          as: "transactions",
        },
      },
      {
        $match: filterObject,
      },
      {
        $count: "total",
      },
    ]);
    const totalPages = Math.ceil(count[0]?.total / limit);
    return {
      data: notPlayedUsers,
      count: count[0]?.total || 0,
      totalPages: totalPages || 0,
    };
  } else if (type === "Active") {
    filterObject.transactionType = { $in: array };
    const mandatory = {
      $and: [
        {
          userId: {
            $exists: true,
          },
        },
        { userId: { $exists: true } },
      ],
    };
    filterObject = { ...mandatory, ...filterObject };

    const playedUsers = await transactionModel
      .aggregate([
        {
          $match: filterObject,
        },
        {
          $group: {
            _id: "$userId",
            // userProfile: { $first: "$userId.profile" },
            // username: { $first: "$userId.username" },
            count: { $sum: 1 },
            totalBet: {
              $sum: {
                $cond: {
                  if: { $in: ["$transactionType", array] },
                  then: 1,
                  else: 0,
                },
              },
            },
            wallet: {
              $sum: {
                $subtract: [
                  {
                    $convert: {
                      input: "$updatedWallet",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  {
                    $convert: {
                      input: "$prevWallet",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
            // ticket: {
            //   $sum: {
            //     $subtract: [
            //       {
            //         $convert: {
            //           input: "$updatedTicket",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //       {
            //         $convert: {
            //           input: "$prevTicket",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //     ],
            //   },
            // },
            // goldCoin: {
            //   $sum: {
            //     $subtract: [
            //       {
            //         $convert: {
            //           input: "$updatedGoldCoin",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //       {
            //         $convert: {
            //           input: "$prevGoldCoin",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //     ],
            //   },
            // },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            totalBet: 1,
            username: 1,
            wallet: 1,
            // goldCoin: 1,
            // ticket: 1,
            // userProfile: 1,
          },
        },
        { $sort: sortByColumn },
      ])
      .skip(skip)
      .limit(Number(limit));

    const count = await transactionModel.aggregate([
      {
        $match: {
          transactionType: { $in: array },
          createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          },
        },
      },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $count: "total" },
    ]);
    const totalPages = Math.ceil(count[0]?.total / limit);
    return {
      data: playedUsers,
      count: count[0]?.total || 0,
      totalPages: totalPages || 0,
    };
  } else if (type === "Inactive") {
    filterObject.transactionType = { $in: array };
    const playedUsers = await transactionModel
      .aggregate([
        {
          $match: filterObject,
        },
        {
          $group: {
            _id: "$userId",
            // userProfile: { $first: "$userId.profile" },
            // username: { $first: "$userId.username" },
            count: { $sum: 1 },
            totalBet: {
              $sum: {
                $cond: {
                  if: { $in: ["$transactionType", array] },
                  then: 1,
                  else: 0,
                },
              },
            },
            wallet: {
              $sum: {
                $subtract: [
                  {
                    $convert: {
                      input: "$updatedWallet",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  {
                    $convert: {
                      input: "$prevWallet",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                ],
              },
            },
            // ticket: {
            //   $sum: {
            //     $subtract: [
            //       {
            //         $convert: {
            //           input: "$updatedTicket",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //       {
            //         $convert: {
            //           input: "$prevTicket",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //     ],
            //   },
            // },
            // goldCoin: {
            //   $sum: {
            //     $subtract: [
            //       {
            //         $convert: {
            //           input: "$updatedGoldCoin",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //       {
            //         $convert: {
            //           input: "$prevGoldCoin",
            //           to: "int",
            //           onError: 0,
            //           onNull: 0,
            //         },
            //       },
            //     ],
            //   },
            // },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            totalBet: 1,
            username: 1,
            wallet: 1,
            // goldCoin: 1,
            // ticket: 1,
            // userProfile: 1,
          },
        },
        { $sort: sortByColumn },
      ])
      .skip(skip)
      .limit(Number(limit));

    const count = await transactionModel.aggregate([
      {
        $match: filterObject,
      },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $count: "total" },
    ]);
    const totalPages = Math.ceil(count[0]?.total / limit);
    return {
      data: playedUsers,
      count: count[0]?.total,
      totalPages: totalPages || 0,
    };
  }
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

const getAllWithdrawData = async (query) => {
  try {
    const page = Number(query.page);
    const limit = Number(query.limit);
    let filterObj = {};
    let searchObj = {};
    let option = {
      populate: "redeemId,userId",
      sortBy: "_id:desc",
      limit,
      page,
    };
    if (query?.filter) {
      filterObj = {
        status: query?.filter,
      };
    }
    if (query?.searchKey) {
      searchObj = {
        username: { $regex: query.searchKey, $options: "i" },
      };
      const user = await User.find(searchObj);
      filterObj.userId = { $in: user.map((e) => e._id) };
    }

    if (query.sortBy) {
      option.sortBy = query.sortBy;
    }

    console.log("option", option);

    const requestPrize = await withdrawRequest.paginate(filterObj, option);
    return { requestPrize };
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      status: "error",
      RedeemPrize: {},
    });
  }
};

const rejectWithdrawRequest = async (params, res) => {
  try {
    const { redeem_id } = params;
    let findRedeem = await withdrawRequest
      .findOne({ _id: redeem_id })
      .populate("userId");
    const { userId, amount } = findRedeem;
    if (!userId) {
      return { status: 404, msg: "User not found" };
    }
    let findUpdate = await User.findOneAndUpdate(
      { _id: userId?._id },
      {
        $inc: {
          wallet: parseInt(amount),
        },
      },
      { new: true }
    );

    if (findUpdate) {
      await withdrawRequest.findOneAndUpdate(
        { _id: redeem_id },
        {
          $set: { status: "Rejected" },
        }
      );
      transactionModel.create({
        userId,
        amount,
        prevWallet: findUpdate.wallet,
        updatedWallet: findUpdate.wallet,
        transactionType: "Withdraw Request Rejected By Admin",
      });
      return { status: 200, msg: "Rejected successfully", user: findUpdate };
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      status: "error",
    });
  }
};

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
  depositWithdrawalReport,
  reportMembers,
  getAllWithdrawData,
  rejectWithdrawRequest,
};
export default adminService;
