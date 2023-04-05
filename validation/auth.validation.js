import Joi from "joi";
import { password, captcha } from "./custom.validation.js";

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    username: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().required(),
    termsAccept: Joi.boolean().required(),
  }),
};
const phoneVerify = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    recaptchaResponse: Joi.string()
      .required("Recaptcha is required")
      .custom(captcha),
  }),
};
const verifyOtp = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    otp: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required(),
    recaptchaResponse: Joi.string()
      .required("Recaptcha is required")
      .custom(captcha),
  }),
};
const adminLogin = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const authValidation = {
  register,
  adminLogin,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  phoneVerify,
  verifyOtp,
};

export default authValidation;
