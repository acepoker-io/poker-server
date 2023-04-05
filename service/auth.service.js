import httpStatus from 'http-status';
import axios from 'axios';
import tokenService from './token.service.js';
import userService from './user.service.js';
import Token from '../models/token.model.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
import tokenTypes from '../config/tokens.js';
import smsService from './sms.service.js';
import User from '../models/user.model.js';
import logger from '../config/logger.js';
import config from '../config/config.js';
import emailService from './email.service.js';
import * as db from '../config/mongo.js';
import transactionModel from '../models/transaction.model.js';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const existUser = await userService.getAdminEmail(email);
  if (!existUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Email or Password!');
  }
  if (!existUser?.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You do not have password!');
  }
  const verifyPswd = await existUser.isPasswordMatch(password);
  console.log('Verify passsword---->', verifyPswd);

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
        throw new ApiError(httpStatus.UNAUTHORIZED, `You have ${3 - existUser?.loginAttempt} attempt left`);
      }
    }
    if (existUser?.loginAttempt + 1 >= 2) {
      console.log('login attempt +1 greater equal 2');
      const userblockTime = new Date().getTime() + 60 * 1000;
      const hashToken = crypto.randomBytes(8).toString('hex');
      await User.updateOne({ email: userEmail }, { isBlock: true, blockTime: userblockTime, hashToken: hashToken });

      let link = `${process.env.CLIENT_PATH}/resetPassword/resetPassword/?hashToken=${hashToken}`;
      // console.log('process.env.CLIENT_PATH==>', process.env.CLIENT_PATH);
      // let link = `http://localhost:3000/resetPassword/resetPassword/?hashToken=${hashToken}`;
      await emailService.sendVerificationEmail(userEmail, 'reset-password-admin-block', { link });
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Many attempt failed.You are blocked,reset link sent on your email.Reset your password instant'
      );
    } else {
      await emailService.sendVerificationEmail('Security Check', userEmail, 'Someone is trying to access your account');
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Password');
    }
  }

  //here i am check the diffrence current time and login failed time
  let currentTime = new Date().getTime();
  let diff = existUser?.blockTime - currentTime;
  if (diff < 0) {
    await User.updateOne({ email: userEmail }, { block: false, loginAttempt: 0, blockTime: new Date() });
    return User.findOne({ _id: userId });
  } else {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are blocked');
  }
};
const loginUserWithPhoneAndPassword = async (phone, password) => {
  const user = await userService.getUserByPhone(phone);

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Phone or password');
  }
  // if (user && !user?.isPhoneVerified) {
  //   return {
  //     msg: `This ${phone} number is not verified! OTP sent on your number.`,
  //     status: 400,
  //   };
  // }
  return user;
};
const loginUserWithGoogle = async (info) => {
  try {
    console.log('infooo', info);
    // `https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,birthdays,genders,locations&access_token=${info.accessToken}`
    const resp = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${info.accessToken}`);
    if (resp.status === 200) {
      const temp = resp.data.name.split(' ');
      const uniqueUsername = await userService.getUniqueUsername(resp.data.given_name?.split(' ').join(''), resp.data.id);
      const res = await userService.createUser({
        username: uniqueUsername,
        googleId: resp.data.id,
        email: resp.data.email,
        refrenceId: info?.refrenceId,
        firstName: temp[0] ? temp[0] : resp.data.given_name,
        lastName: temp[temp.length - 1] ? temp[temp.length - 1] : resp.data.family_name,
        profile: resp.data.picture || 'https://i.pinimg.com/736x/06/d0/00/06d00052a36c6788ba5f9eeacb2c37c3.jpg',
        isRegistrationComplete: true,
      });
      let getAff = await db.get_affiliatesDB().findOne({ user_id: info?.refrenceId });
      console.log('getAff', getAff);
      console.log('res', res._id);

      if (info?.refrenceId && res && getAff) {
        await db
          .get_affiliatesDB()
          .findOneAndUpdate({ user_id: info?.refrenceId }, { $inc: { total_earned: 250 } }, { new: true });
        await db.get_affiliates_successful_actionsDB().insertOne({
          type: 'register',
          user_id: res?._id?.toString(),
          url: process.env.BASE_SITE_URL,
          commission: 250,
          referred_user_id: info?.refrenceId,
          timestamp: new Date(),
          affiliate_id: getAff?._id.toString(),
        });
        let find = await User.findOne({ _id: mongoose.Types.ObjectId(info?.refrenceId) });
        console.log('findinffff======>>>>', find);
        let comisData = {
          id: res?._id?.toString(),
          commision: 250,
        };

        await User.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(info?.refrenceId) },
          { $inc: { wallet: 250 }, $push: { affliateUser: comisData } },
          { new: true }
        );

        await User.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(info?.refrenceId) },
          { $inc: { wallet: 250 }, $push: { affliateUser: comisData } },
          { new: true }
        );

        await transactionModel.create({
          userId: info?.refrenceId,
          amount: 250,
          transactionDetails: {},
          prevWallet: parseFloat(find?.wallet),
          updatedWallet: parseFloat(find?.wallet + 250),
          transactionType: 'referal',
          updatedTicket: find?.ticket + 250,
        });
      }
      console.log('getAff', getAff);

      return res;
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to login with google');
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to login with google');
  }
};

const loginUserWithFaceBook = async (info) => {
  try {
    let findEmail = await User.findOne({ email: info?.facebookEmail});
     if(findEmail){
      return findEmail
     }
    if(!findEmail){
    console.log('infooo', info);
    const temp = info?.facebookName.split(' ');
          let res = await userService.createUser({
        username: info?.facebookName,
        facebookId: info?.facebookId,
        email: info?.facebookEmail,
        refrenceId: info?.refrenceId,
        firstName:  temp[0] ? temp[0]:"",
        lastName: temp[temp.length - 1] ? temp[temp.length - 1] : "",
        profile:'https://i.pinimg.com/736x/06/d0/00/06d00052a36c6788ba5f9eeacb2c37c3.jpg',
        isRegistrationComplete: true,
      });
      return res;
    }

    // throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to login with google');
  } catch (err) {
     console.log("errrrr",err);
    // throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to login with facebook');
  }
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    return;
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};
const verifyPhone = async (info) => {
  const { phone, recaptchaResponse } = info;
  if (!recaptchaResponse) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Recaptcha is not verified');
  }
  const option = {
    secret: config.recaptchaSecret,
    response: recaptchaResponse,
  };
  const dd = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, option, { params: option });
  if (!dd.data.success) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Recaptcha is not verified');
  }
  console.log('ddd =>', dd.data, config.recaptchaSecret);
  const user = await userService.getUserByPhone(phone);
  console.log({ user });
  if (user && user?.isPhoneVerified && user?.isRegistrationComplete) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `This ${phone} number is already registered`);
  }
  if (user && user?.isPhoneVerified && !user?.isRegistrationComplete) {
    return {
      status: 401,
    };
  }
  if (user && !user?.isPhoneVerified) {
    const sms = await smsService.sendVerificationSms(phone);
    return {
      msg: `This ${phone} number is not verified! OTP sent on your number.`,
      status: 200,
    };
  }
  const sms = await smsService.sendVerificationSms(phone);
  if (sms === 'pending') {
    await User.create({ phone: phone });
    return {
      msg: 'Otp has been send to your registeration number.',
      status: 200,
    };
  }
  throw new ApiError(httpStatus.UNAUTHORIZED, `Invalid phone number`);
};
const verifyPhoneForgetPassword = async (info) => {
  const { phone, recaptchaResponse } = info;
  if (!recaptchaResponse) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Recaptcha is not verified');
  }
  const option = {
    secret: config.recaptchaSecret,
    response: recaptchaResponse,
  };
  const dd = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, option, { params: option });
  if (!dd.data.success) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Recaptcha is not verified');
  }
  const user = await userService.getUserByPhone(phone);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `This ${phone} number is not registered`);
  }
  const sms = await smsService.sendVerificationSms(phone);
  if (sms === 'pending') {
    return {
      msg: 'Otp has been send to your registeration number.',
      status: 200,
    };
  }
  throw new ApiError(httpStatus.UNAUTHORIZED, `Invalid phone number`);
};

const verifyRegisterOtp = async (info) => {
  const { phone, otp } = info;
  let user = await userService.getUserByPhone(phone);
  if (user) {
    const status = await smsService.verifySms(phone, otp);
    if (status === 'approved') {
      await userService.updateUserById(user._id, { isPhoneVerified: true });
      return { msg: 'Your account is verified', status: 200 };
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Otp');
  }
  throw new ApiError(httpStatus.UNAUTHORIZED, 'Wrong OTP please enter again');
};
const verifyOtp = async (info, user) => {
  const { phone, otp } = info;
  if (phone) {
    const status = await smsService.verifySms(phone, otp);
    if (status === 'approved') {
      const upd = await userService.updateUserById(user._id, { phone: phone, isPhoneVerified: true });
      return { msg: 'Your phone is verified', status: 200, user: upd };
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Otp');
  }
  throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid phone number');
};
const registerUser = async (info, res) => {
  try {
    const { firstName, lastName, username, email, password, phone, termsAccept } = info;
    let user;
    if (phone) {
      user = await userService.getUserByPhone(phone);
    }
    const isEmail = await userService.getUserByEmail(email);
    if (isEmail) {
      return res.status(httpStatus.UNAUTHORIZED).send({ msg: `Email already registered` });
    }
    const userName = await User.findOne({ username: username?.toLowerCase().trim().split(' ').join('') });
    if (userName) {
      return res.status(httpStatus.UNAUTHORIZED).send({ msg: `Username already registered` });
    }
    if (user) {
      await userService.updateUserById(user._id, {
        firstName,
        lastName,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        termsAccept,
        isRegistrationComplete: true,
      });
      const tokens = await tokenService.generateAuthTokens(user);
      return { user, status: 200, tokens, msg: 'Registration successfully' };
    }
  } catch (error) {
    logger.info(JSON.stringify(err));
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Something went wrong! registration failed');
  }
};

const authService = {
  loginUserWithEmailAndPassword,
  loginUserWithPhoneAndPassword,
  verifyPhoneForgetPassword,
  loginUserWithGoogle,
  loginUserWithFaceBook,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  verifyPhone,
  verifyRegisterOtp,
  registerUser,
  verifyOtp,
};

export default authService;
