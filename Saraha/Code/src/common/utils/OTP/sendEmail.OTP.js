import nodemailer from "nodemailer";
import { APPLICATION_NAME, EMAIL_APP, PASSWORD_APP } from "../../../../config/config.service.js";
export const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const transporter = nodemailer.createTransport({
    service : "gmail",
    auth: {
        user:EMAIL_APP,
        pass:PASSWORD_APP,
    }
});
export const sendOTPEmail = async ({to,cc ,bcc , html , attachments = [] ,subject}={}) => {
  try {
    await transporter.sendMail({
      to,
      cc,
      bcc,
      subject,
      attachments,
      html,
      from: `"${APPLICATION_NAME} ❤️🚀"<${EMAIL_APP}>`,
    });
    
  } catch (error) {
    console.log("Email error:", error);
  }
};