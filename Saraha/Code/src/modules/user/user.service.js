import mongoose from "mongoose";
import { APPLICATION_NAME } from "../../../config/config.service.js";
import {
  OTPActionsEnum,
  OTPSubjectEnum,
  OTPTitleEnum,
  OTPTypeEnum,
  LogoutEnum,
  ProviderEnum,
} from "../../common/enum/index.js";
import {
  deleteFile,
  deleteImage,
  deleteKey,
  expire,
  get,
  incr,
  keys,
  otpKey,
  profileViewed,
  profileViewers,
  profileViewsKey,
  revokeTokenBaseKey,
  set,
  uploadFile,
} from "../../common/services/index.js";
import {
  checkOtpBlcok,
  checkOTPRequest,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decrypt,
  emailEmitter,
  encrypt,
  generateOTP,
  generatHash,
  NotFoundException,
} from "../../common/utils/index.js";
import {
  deleteOne,
  findOne,
  findOneAndUpdate,
} from "../../DB/dataBase.service.js";
import { userModel } from "../../DB/models/user.model.js";
import { redisClient } from "../../DB/redis.connection.js";

const generateOTPV2StepVerification = async (email) => {
  const blockKey = await checkOtpBlcok({
    type: OTPTypeEnum.TwoStepVerification,
    key: email,
    action: OTPActionsEnum.BlockTwoStepVerification,
  });
  const { maxTrialCountKey, checkMaxOtpRequest } = await checkOTPRequest({
    type: OTPTypeEnum.TwoStepVerification,
    key: email,
    account: OTPActionsEnum.Request,
    blockKey,
  });
  const code = await generateOTP();
  await set({
    key: otpKey({ type: OTPTypeEnum.TwoStepVerification, key: email }),
    value: await generatHash(code),
    ttl: 120,
  });
  checkMaxOtpRequest > 0
    ? await incr({ key: maxTrialCountKey })
    : await set({ key: maxTrialCountKey, value: 1, ttl: 300 });
  emailEmitter.emit("SEND OTP", {
    to: email,
    code,
    subject: OTPSubjectEnum.TwoStepVerification,
    title: OTPTitleEnum.TwoStepVerification,
  });
  return;
};
export const getUserProfileAndShare = async ({
  profileId,
  viewer = null,
  ip,
}) => {
  const PROFILE_VIEW_TTL = 7 * 24 * 60 * 60;

  const viewersKey = `profile:${profileId}:viewers`;
  const viewsKey = `profile:${profileId}:views`;
  const viewedId = viewer?._id ? viewer._id.toString() : ip;
  const viewerName = viewer?.userName || "anonymous";
  if (viewer?._id?.toString() === profileId) {
    const user = await userModel
      .findById(profileId)
      .select("userName email phone profilePicture profileCover bio gender DOB isTwoFactorEnabled")
      .lean();

    if (!user) {
      throw NotFoundException({ message: "هذا الحساب غير موجود" });
    }
console.log({user});

    const profileViews = parseInt(await redisClient.get(viewsKey)) || 0;
    const viewersObj = await redisClient.hGetAll(viewersKey);
    const viewerList = Object.values(viewersObj).map((v) => JSON.parse(v));

    const result = {
      _id: user._id,
      viewerId : viewer?._id,
      userName: user.userName,
      isTwoFactorEnabled: user?.isTwoFactorEnabled,
      profilePicture: user?.profilePicture?.secure_url || undefined,
      profileCover: user?.profileCover?.secure_url || undefined,
      profileViews,
      viewers: viewerList,
      bio: user.bio,
      DOB: user.DOB,
      gender: user.gender,
    };

    if (viewer?._id?.toString() === profileId) {
      result.email = user.email;
      result.phone = user.phone ? await decrypt(user.phone) : null;
    }
    return result;
  }

  const user = await userModel
    .findById(profileId)
    .select("userName email phone profilePicture profileCover bio gender DOB")
    .lean();

  if (!user) {
    throw NotFoundException({ message: "هذا الحساب غير موجود" });
  }

  const existing = await redisClient.hExists(viewersKey, viewedId);

  if (!existing) {
    const viewerData = {
      userId: viewer?._id || null,
      userName: viewerName,
      viewedAt: new Date().toISOString(),
    };

    await redisClient.hSet(viewersKey, viewedId, JSON.stringify(viewerData));
    await expire({ key: viewersKey, ttl: PROFILE_VIEW_TTL });

    await redisClient.incr(viewsKey);
    await expire({ key: viewsKey, ttl: PROFILE_VIEW_TTL });
  }

  const profileViews = parseInt(await redisClient.get(viewsKey)) || 0;
  const viewersObj = await redisClient.hGetAll(viewersKey);
  const viewerList = Object.values(viewersObj).map((v) => JSON.parse(v));

  const result = {
    _id: user._id,
    viewerId : viewer?._id,
    userName: user.userName,
    isTwoFactorEnabled: user?.isTwoFactorEnabled,
    profilePicture: user?.profilePicture?.secure_url || undefined,
    profileCover: user?.profileCover?.secure_url || undefined,
    profileViews,
    viewers: viewerList,
    bio: user.bio,
    DOB: user.DOB,
    gender: user.gender,
  };

  if (viewer?._id?.toString() === profileId) {
    result.email = user.email;
    result.phone = user.phone ? await decrypt(user.phone) : null;
  }
  return result
};
export const enable2Step_Verification = async (user) => {  
  if (!user) {
    throw NotFoundException({ message: "Invalid 2 step verification" });
  }
  return await generateOTPV2StepVerification(user.email);
};
export const confirm2Step_Verification = async (user , { otp }) => {  
  console.log(user);
  
  const acconut = await findOne({
    model: userModel,
    filter: {
      email : user.email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.system,
      isTwoFactorEnabled: false ,
    },
  });
  if (!acconut) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }
  const hashedOTP = await get({
    key: otpKey({ type: OTPTypeEnum.TwoStepVerification, key: user.email }),
  });

  if (!hashedOTP) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!(await compareHash(otp, hashedOTP))) {
    throw ConflictException({ message: "Invalid otp" });
  }
  acconut.isTwoFactorEnabled = true;
  await acconut.save();
  await deleteKey(
    await keys(otpKey({ type: OTPTypeEnum.TwoStepVerification, key: user.email })),
  );
  return acconut;
};
export const profilePicture = async (file, user) => {
  const baseFolder = `${APPLICATION_NAME}/users/${user._id}`;
  if (user.profilePicture?.public_id) {
    await deleteFile(user.profilePicture.public_id);
  }
  const { public_id, secure_url } = await uploadFile({
    filePath: file.path,
    folder: `${baseFolder}/profile`,
  });
  user.profilePicture = { public_id, secure_url };
  await user.save();
  return {...user.toObject() , profilePicture : secure_url , profileCover : user?.profileCover?.secure_url};
};
export const profileCover = async (file, user) => {
  const baseFolder = `${APPLICATION_NAME}/users/${user._id}`;
  if (user.profileCover?.public_id) {
    await deleteFile(user.profileCover.public_id);
  }
  const { public_id, secure_url } = await uploadFile({
    filePath: file.path,
    folder: `${baseFolder}/cover`,
  });
  user.profileCover = { public_id, secure_url };
  await user.save();
    return {...user.toObject() ,profilePicture : user?.profilePicture?.secure_url ,profileCover : secure_url};

};
export const updatePassword = async (inputs, user) => {
  const { oldPassword, newPassword } = inputs;
  if (!(await compareHash(oldPassword, user.password))) {
    return NotFoundException({ message: "Invalid Password" });
  }
  user.password = await generatHash(newPassword);
  await user.save();
  return user;
};
export const logout = async ({ flag }, user, decode) => {
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialsTime = new Date(Date.now());
      await user.save();
      break;
    default:
      const ttl = decode.exp - Math.floor(Date.now() / 1000);
      await set({
        key: revokeTokenBaseKey(decode.jti),
        value: 1,
        ttl,
      });
      status = 201;
      break;
  }
  return status;
};
export const rotateToken = async (user, issure) => {
  return await createLoginCredentials(user, issure);
};
export const updateAccount = async (id, data) => {
  let Phone = data?.phone;
  if (Phone) {
    Phone = await encrypt(data.phone);
  }
  const ID = new mongoose.Types.ObjectId(id);
  const account = await userModel.findByIdAndUpdate(
    ID,
    { $set: { ...data, phone: Phone } },
    { new: true },
  );
  if (!account) {
    throw NotFoundException({ message: "Not Found" });
  }
  return account;
};
export const deleteAccount = async (user) => {
  await deleteImage(user);
  await deleteOne({ model: userModel, filter: { _id: user._id } });
  return "Done";
};
