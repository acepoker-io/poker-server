// import nodemailer from "nodemailer";
// import config from "../config/config.js";
// import logger from "../config/logger.js";

const sendVerificationEmail = async (to, token) => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${process.env.BASE_SITE_URL}/verify-email?token=${token}`; //config.siteUrls.baseURL
  const text = `Dear user,
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendEmail = async (to, subject, text) => {
  const msg = { from: process.env.EMAIL_FROM, to, subject, text }; //config.email.from
  await transport.sendMail(msg);
};

const emailService = {
  sendEmail,
  sendVerificationEmail,
};

export default emailService;
