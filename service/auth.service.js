import httpStatus from "http-status";
// import axios from 'axios';
// import tokenService from './token.service.js';
// import userService from "./user.service.js";
// import Token from '../models/token.model.js';
// import ApiError from "../utils/ApiError.js";
// import mongoose from 'mongoose';
// import tokenTypes from '../config/tokens.js';
// import smsService from './sms.service.js';
// import User from "../models/user.model.js";
// import logger from '../config/logger.js';
// import config from '../config/config.js';
import emailService from "./email.service.js";
import userService from "./user.service.js";
import ApiError from "../landing-server/utils/ApiError.js";
import User from "../landing-server/models/user.model.js";
// import * as db from '../config/mongo.js';
// import transactionModel from '../models/transaction.model.js';

const loginUserWithEmailAndPassword = async (email, password) => {
  const existUser = await userService.getAdminEmail(email);

  if (!existUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect Email or Password!");
  }
  if (!existUser?.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You do not have password!");
  }
  const verifyPswd = await existUser.isPasswordMatch(password);

  const userEmail = existUser?.email;
  const userId = existUser?._id;
  if (!verifyPswd && existUser) {
    if (existUser?.loginAttempt <= 2) {
      await User.updateOne(
        { email: email },
        {
          $inc: {
            loginAttempt: 1,
          },
        }
      );
      if (existUser?.loginAttempt > 0) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          `You have ${3 - existUser?.loginAttempt} attempt left`
        );
      }
    }
    if (existUser?.loginAttempt + 1 >= 2) {
      console.log("login attempt +1 greater equal 2");
      const userblockTime = new Date().getTime() + 60 * 1000;
      const hashToken = crypto.randomBytes(8).toString("hex");
      await User.updateOne(
        { email: userEmail },
        { isBlock: true, blockTime: userblockTime, hashToken: hashToken }
      );

      let link = `${process.env.CLIENT_PATH}/resetPassword/resetPassword/?hashToken=${hashToken}`;
      // console.log('process.env.CLIENT_PATH==>', process.env.CLIENT_PATH);
      // let link = `http://localhost:3000/resetPassword/resetPassword/?hashToken=${hashToken}`;
      await emailService.sendVerificationEmail(
        userEmail,
        "reset-password-admin-block",
        { link }
      );
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Many attempt failed.You are blocked,reset link sent on your email.Reset your password instant"
      );
    } else {
      await emailService.sendVerificationEmail(
        "Security Check",
        userEmail,
        "Someone is trying to access your account"
      );
      throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect Password");
    }
  }

  //here i am check the diffrence current time and login failed time
  let currentTime = new Date().getTime();
  let diff = existUser?.blockTime - currentTime;
  if (diff < 0) {
    await User.updateOne(
      { email: userEmail },
      { block: false, loginAttempt: 0, blockTime: new Date() }
    );
    return await User.findOne({ _id: userId });
  } else {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are blocked");
  }
};

const authService = {
  loginUserWithEmailAndPassword,
};

export default authService;
