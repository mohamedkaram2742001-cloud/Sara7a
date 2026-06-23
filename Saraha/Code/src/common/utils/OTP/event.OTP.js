import { EventEmitter } from "node:events";
import { sendOTPEmail } from "./sendEmail.OTP.js";
import { verifyEmailTemplate } from "./template.OTP.js";
import { OTPTitleEnum } from "../../enum/index.js";

export const emailEmitter = new EventEmitter()
emailEmitter.on("SEND OTP" , async({to , code , subject = "Verify Account" , title = OTPTitleEnum.confirmEmail}={})=>{
    try {
        return await sendOTPEmail({
        to,
        subject,
        html : verifyEmailTemplate({code, title})
    })
    } catch (error) {
        console.log(`Fail to send user email ${error.message} `);
    }
})