import httpStatus from "http-status";
// import tokenService from "../../services/token.service.js";
// import ApiError from "../../utils/ApiError.js";
// import catchAsync from "../../utils/catchAsync.js";
// import eventEmitter from "../../utils/eventEmit.js";
// import userService from "../../services/user.service.js";
// import roomModel from "../models/room.js";
// import User from "../../models/userModel.js";
// import adminService from "../../service/admin/admin.service.js";
import authService from "../../service/auth.service.js";
import tokenService from "../../service/token.service.js";
// import ApiError from "../../landing-server/utils/ApiError.js";
import catchAsync from "../../landing-server/utils/catchAsync.js";
import User from "../../landing-server/models/user.model.js";
import adminService from "../../service/admin/admin.service.js";
// import eventEmitter from "../../landing-server/utils/eventEmit.js";
import userService from "../../service/user.service.js";

export const adminLogin = catchAsync(async (req, res, next) => {
  const {
    body: { email, password },
  } = req;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

export const getLettestUser = catchAsync(async (req, res, next) => {
  const users = await User.find(
    {},
    {
      firstName: 1,
      lastName: 1,
      email: 1,
      profile: 1,
      username: 1,
      phone: 1,
      wallet: 1,
    }
  )
    .limit(5)
    .sort({ _id: -1 });
  res.send({ users });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const filter = await adminService.getAllUsers(req.query);
  res.send({ users: filter.users, count: filter.count });
});

export const checkAdmin = catchAsync(async (req, res, next) => {
  if (req.user) {
    // console.log('user ==>>', req.user);
    return res.status(200).send({
      user: {
        username: req.user.username,
        email: req.user.email,
        id: req.user.id,
        profile: req.user.profile,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
      },
    });
  }
  throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized user");
});

// export const blockUser = catchAsync(async (req, res, next) => {
//   const block = await adminService.blockUser(req.params.id);
//   return res.status(200).send({ block });
// });

// export const updateUser = catchAsync(async (req, res, next) => {
//   const user = await adminService.updateUser(req.params.id, req.body);
//   return res.status(200).send({ user });
// });

export const dashboardCount = catchAsync(async (req, res, next) => {
  const allCount = await adminService.allDashboardCount();
  return res.status(200).send(allCount);
});

// export const monthlyGameStats = catchAsync(async (req, res, next) => {
//   const response = await adminService.monthlyGameStats(req.query);
//   return res.status(200).send(response);
// });

export const getAllTransaction = catchAsync(async (req, res, next) => {
  const response = await adminService.allTransaction(req.query);
  return res.status(200).send(response);
});

// export const updateWallet = catchAsync(async (req, res, next) => {
//   const response = await adminService.updateUserWallet(req.params.id, req.body);
//   eventEmitter.emit("notifyUserAdminUpdate", req.params.id);
//   return res.status(200).send(response);
// });

export const resetPassword = async (req, res) => {
  console.log("reset password", req.body);
  const { email, currentPassword, newPassword } = req.body;
  try {
    const admin = await User.findOne({ email });
    // console.log(admin);
    if (admin) {
      const pswd = await admin?.isPasswordMatch(currentPassword);
      console.log(pswd);
      if (pswd) {
        await userService.updateUserById(admin._id, { password: newPassword });
        const userDetail = await User.findOne({ _id: admin._id });
        res.status(200).json({
          code: 200,
          msg: "Your Password is changed successfully",
          userDetail,
        });
        return;
      }
      res.status(404).json({
        msg: "Your old password is wrong",
      });
      return;
      // throw new ApiError(httpStatus.NOT_FOUND, 'Your old password is wrong');
    }
    res.status(404).json({
      msg: "User not found",
    });
    return;
    // throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  } catch (err) {
    console.log("error in reset password", err);

    res.status(404).json({
      msg: "Something went wrong",
    });
  }
};

// export const getPokerTable = async (req, res) => {
//   console.log("getPokerTable", req.query);
//   const { tournament, skip, pageLimit, keyword } = req.query;
//   try {
//     let searchqrery = "";
//     if (keyword && keyword !== "") {
//       searchqrery = {
//         gameName: { $regex: keyword, $options: "i" },
//       };
//     } else {
//       searchqrery = {};
//     }

//     let queryObject = {};
//     if (tournament === "true") {
//       console.log("true executed");
//       queryObject = {
//         $and: [{ tournament: { $ne: null } }],
//       };
//     } else {
//       console.log("false executed");
//       queryObject = { $and: [{ tournament: null }, searchqrery] };
//     }
//     console.log(queryObject, tournament);
//     const rooms = await roomModel
//       .find(queryObject)
//       .skip(Number(skip))
//       .limit(Number(pageLimit));
//     const count = await roomModel.countDocuments(queryObject);
//     console.log("count", count);
//     res.status(200).json({
//       rooms,
//       count,
//       succeess: true,
//     });
//   } catch (err) {
//     console.log("error in getPokerTables", err);
//   }
// };
// export const getAllUsersForInvite = async (req, res) => {
//   try {
//     const allUsers = await User.find({
//       _id: { $ne: req.user._id },
//       isRegistrationComplete: true,
//     }).select("_id username");
//     return res.status(200).json({
//       allUsers,
//     });
//   } catch (error) {
//     console.log("error in Get All user", error);
//     res.status(500).send({ message: "Internal server error" });
//   }
// };

// export const CreateTournament = catchAsync(async (req, res,next) => {
//   console.log('Created Tournament');
//   const response = await adminService.CreateTournament(req.body);

//   return res.status(200).send(response);
// });

const adminController = {
  adminLogin,
  getLettestUser,
  getAllUsers,
  getAllTransaction,
  resetPassword,
  // checkAdmin,
  // dashboardCount,
  // getAllUsersForInvite,
};
export default adminController;
