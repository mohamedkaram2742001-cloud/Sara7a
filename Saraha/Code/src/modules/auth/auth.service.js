import { ProviderEnum } from "../../common/enum/user.enum.js";
import { OAuth2Client } from "google-auth-library";
import {
  BadRequestException,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decrypt,
  emailEmitter,
  encrypt,
  generateOTP,
  generatHash,
  NotFoundException,
  UnauthorizadException,
} from "../../common/utils/index.js";
import { create, findOne } from "../../DB/index.js";
import { userModel } from "../../DB/models/index.js";
import { WEB_CLIENT_ID } from "../../../config/config.service.js";
import {
  deleteKey,
  get,
  incr,
  keys,
  otpKey,
  set,
  ttl,
} from "../../common/services/index.js";
import { OTPActionsEnum, OTPSubjectEnum, OTPTitleEnum, OTPTypeEnum } from "../../common/enum/index.js";
import { checkOtpBlcok, checkOTPRequest  } from "../../common/utils/OTP/index.js";

const generateAndSendConfirmEmailOtp = async (email) => {
  const blockKey = checkOtpBlcok({type : OTPTypeEnum.User , key : email , action : OTPActionsEnum.BlockRequest });
  const {maxTrialCountKey , checkMaxOtpRequest} = await checkOTPRequest({type : OTPTypeEnum.User , key : email , action : OTPActionsEnum.Request , blockKey})
  const code = await generateOTP();
  await set({ key: otpKey({type : OTPTypeEnum.User , key : email}), value: await generatHash(code), ttl: 120 });
  checkMaxOtpRequest > 0 ? await incr({ key: maxTrialCountKey }) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });
  emailEmitter.emit("SEND OTP" , {to : email , code , subject: OTPSubjectEnum.confirmEmail, title: OTPTitleEnum.confirmEmail})
  return;
};
const generateAndSendForgetPasswordOtp = async (email) => {
  const blockKey = checkOtpBlcok({type : OTPTypeEnum.forgetPassword , key : email , action : OTPActionsEnum.BlockForgetPassword });
  const {maxTrialCountKey , checkMaxOtpRequest} = await checkOTPRequest({type : OTPTypeEnum.forgetPassword , key : email , action : OTPActionsEnum.Request , blockKey})
  const code = await generateOTP();
  await set({ key: otpKey({type : OTPTypeEnum.forgetPassword , key : email}), value: await generatHash(code), ttl: 120 });
  checkMaxOtpRequest > 0 ? await incr({ key: maxTrialCountKey }) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });
  emailEmitter.emit("SEND OTP" , {to : email , code , subject: OTPSubjectEnum.forgetPassword, title: OTPTitleEnum.forgetPassword})
  return;
};
const generateAttamptLogin = async (email) => {
  const blockKey = checkOtpBlcok({type : OTPTypeEnum.Login , key : email , action : OTPActionsEnum.BlockLogin });
  const {maxTrialCountKey , checkMaxOtpRequest} = await checkOTPRequest({type : OTPTypeEnum.Login , key : email , action : OTPActionsEnum.Request , blockKey , attampt : 5})
  checkMaxOtpRequest > 0 ? await incr({ key: maxTrialCountKey }) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });
  return NotFoundException({ message: "Invalid login credentials or invalid login approach"});
};
const generateOTPV2StepVerification =  async(email)=>{
  const blockKey = await checkOtpBlcok({type : OTPTypeEnum.TwoStepVerification , key : email , action : OTPActionsEnum.BlockTwoStepVerification})
  const {maxTrialCountKey , checkMaxOtpRequest} = await checkOTPRequest({type : OTPTypeEnum.TwoStepVerification , key : email , action : OTPActionsEnum.Request , blockKey})
  const code = await generateOTP();
  await set({ key: otpKey({type : OTPTypeEnum.TwoStepVerification , key : email}), value: await generatHash(code), ttl: 120 });
  checkMaxOtpRequest > 0 ? await incr({ key: maxTrialCountKey }) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });
  emailEmitter.emit("SEND OTP" , {to : email , code , subject: OTPSubjectEnum.TwoStepVerification, title: OTPTitleEnum.TwoStepVerification})
  return;
  }
export const signUp = async (inputs) => {
  const { email, phone, userName, password, confirmPassword } = inputs;
  const checkUserExist = await findOne({ model: userModel, filter: { email } });
  if (checkUserExist) {
    return ConflictException({ message: "User Exist" });
  }
  const user = await userModel.create([
    {
      userName,
      email,
      password: await generatHash(password, 12, "bcrypt"),
      confirmPassword,
      phone: await encrypt(phone),
    },
  ]);
  await generateAndSendConfirmEmailOtp(email);
  return user;
};
export const reSendConfrimEmail = async (input) => {
  const { email } = input;
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: null,
      provider: ProviderEnum.system,
    },
  });
  
  if (!account) {
    throw NotFoundException({ message: `Fail to find matching acconut` });
  }
  const remainingTime = await ttl(otpKey({type : OTPTypeEnum.User , key : email}));
  if (remainingTime > 0) {
    throw ConflictException({ message: `Sorry we cannot provide new otp untail exist one is expired you can try again later after ${remainingTime}`});
  }
  await generateAndSendConfirmEmailOtp(email);
};
export const confirmEmail = async ({ email, otp }) => {
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: null,
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }
  const hashedOTP = await get({ key: otpKey({type : OTPTypeEnum.User ,key : email}) });

  if (!hashedOTP) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!(await compareHash(otp, hashedOTP))) {
    throw ConflictException({ message: "Invalid otp" });
  }
  user.confirmEmail = new Date();
  await user.save();
  await deleteKey(await keys(otpKey({type : OTPTypeEnum.User ,key : email})))
  return "Email verified successfully";
};
export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      confirmEmail: { $exists: true },
    },
  });
  if (!user) {
    return NotFoundException({
      message: "Invalid login credentials or invalid login approach",
    });
  }
  const match = await compareHash(password, user.password);
  if (!match) {
   await generateAttamptLogin(email)
  }
  if (user.isTwoFactorEnabled) {
    await generateOTPV2StepVerification(email)
    return  "OTP sent to your email"
  }
  await deleteKey(await keys(otpKey({type : OTPTypeEnum.Login ,key : email})))
  user.phone = await decrypt(user.phone);
  return await createLoginCredentials(user, issuer);
};
export const confirmLogin = async ({ email, otp } , issuer) => {
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      isTwoFactorEnabled : {$exists : true}
    },
  });
  if (!user) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }
  const hashedOTP = await get({ key: otpKey({type : OTPTypeEnum.TwoStepVerification ,key : email}) });
  if (!hashedOTP) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!(await compareHash(otp, hashedOTP))) {
    throw ConflictException({ message: "Invalid otp" });
  }
  await deleteKey(await keys(otpKey({type : OTPTypeEnum.TwoStepVerification ,key : email})))
  return await createLoginCredentials(user, issuer);
};
export const reSendConfrimLogin = async (input) => {
  const { email } = input;
  const account = await findOne({
    model: userModel,
    filter: {
      email,
      isTwoFactorEnabled: { $exists: true },
      provider: ProviderEnum.system,
    },
  });
  if (!account) {
    throw NotFoundException({ message: `Fail to find matching acconut` });
  }
  const remainingTime = await ttl(otpKey({type : OTPTypeEnum.TwoStepVerification , key : email}));
  if (remainingTime > 0) {
    throw ConflictException({ message: `Sorry we cannot provide new otp untail exist one is expired you can try again later after ${remainingTime}`});
  }
  await generateOTPV2StepVerification(email);
};
export const signupWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email: payload.email },
  });
  if (checkUserExist) {
    if (checkUserExist?.provider == ProviderEnum.system) {
      throw ConflictException({
        message: "Account already exist with diffrent provider ",
      });
    }
    const account = await loginWithGmail({ idToken }, issuer);
    return { account, status: 200 };
  }

  const user = await create({
    model: userModel,
    data: {
      userName : `${payload.given_name} ${payload.family_name}`,
      email: payload.email,
      provider: ProviderEnum.google,
      profilePic: payload.picture,
      confirmEmail: new Date(),
    },
  });
  return { account: await createLoginCredentials(user, issuer) };
};
export const loginWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  const user = await findOne({
    model: userModel,
    filter: { email: payload.email, provider: ProviderEnum.google },
  });
  if (!user) {
    return NotFoundException({
      message: "Invalid login credentials or invalid login approach",
    });
  }
  return await createLoginCredentials(user, issuer);
};
const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw BadRequestException({
      message: "Fail to verify this account with google",
    });
  }
  return payload;
};
export const forgetPassword = async({email})=>{
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
      confirmEmail: { $exists: true },
    },
  });
   if (!user) {
    return NotFoundException({ message: "This account not found" });
  }
  const remainingTime = await ttl(otpKey({type : OTPTypeEnum.forgetPassword , key : email}));
  if (remainingTime > 0) {
    throw ConflictException({ message: `Sorry we cannot provide new otp untail exist one is expired you can try again later after ${remainingTime}`});
  }
  await generateAndSendForgetPasswordOtp(email)
  return "OTP sent to your email"
}
export const confirmForgetPassword = async ({ email, otp }) => {
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }
  const hashedOTP = await get({ key: otpKey({type : OTPTypeEnum.forgetPassword ,key : email}) });

  if (!hashedOTP) {
    throw NotFoundException({ message: "Expired otp" });
  }
  const checkOtp = await compareHash(otp, hashedOTP)
  if (!checkOtp) {
    throw ConflictException({ message: "Invalid otp" });
  }
  await deleteKey(await keys(otpKey({type : OTPTypeEnum.forgetPassword ,key : email})))
  await set({key : otpKey({type : OTPTypeEnum.resetPassword , key : email}) , value : 1 , ttl : 120}) 
  return "OTP verified successfully";
};
export const resetPassword = async ({email , password}) => {
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }
  const session = await get({ key: otpKey({type : OTPTypeEnum.resetPassword ,key : email}) });
  if (!session) {
    throw UnauthorizadException({ message: "Invalid reset session" });
  }
  const newPassword = password
  const checkSamePassword = await compareHash(newPassword , user.password)
  if (checkSamePassword) {
    throw ConflictException({ message: "This password used befor you can't use it" });
  }
  user.password = await generatHash(newPassword)
  user.changeCredentialsTime = new Date(Date.now())
  await user.save()
  return user
};