import { redisClient } from "../../DB/index.js";
import { OTPActionsEnum, OTPTypeEnum } from "../enum/OTP.enum.js";
export const revokeTokenBaseKey = (id) => {
  return `RevokeToken::${id.toString()}`;
};
const baseOtp = ({ type = OTPTypeEnum.User, key, action = "" } = {}) => {
  return action
    ? `OTP::${type}::${key}::${action}`
    : `OTP::${type}::${key}`;
};
export const profileViewsKey = (profileId) => {
  return `PROFILE::VIEWS::${profileId}::COUNT`
};
export const profileViewed = (profileId , uniqueKey) => {
  return `PROFILE::VIEWS::${profileId}::${uniqueKey}`
};
export const profileViewers = (profileId) => {
  return `PROFILE::VIEWS::${profileId}::LIST`
};
export const otpKey = ({type , key}={}) => {
  return baseOtp({ type, key });
};
export const otpMaxRequestKey = ({type , key , action = OTPActionsEnum.Request}={}) => {
  return baseOtp({type , key , action})
};
export const otpBlockKey = ({type,key,action}={}) => {
  return baseOtp({type , key , action});
};
export const set = async ({ key, value, ttl, parse = false } = {}) => {
  try {
    if (parse) {
      value = JSON.stringify(value);
    }
    if (ttl) {
      return await redisClient.set(key, value, { EX: ttl });
    }
    await redisClient.set(key, value);
  } catch (error) {
    console.log(`Fail to add`);
  }
};
export const get = async ({ key, parse = false } = {}) => {
  try {
    return parse
      ? JSON.parse((await redisClient.get(key)) ?? "")
      : await redisClient.get(key);
  } catch (error) {
    console.log(`Fail to get`);
  }
};
export const update = async ({ key, value, ttl } = {}) => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    await redisClient.set(key, value, ttl);
  } catch (error) {
    console.log(`Fail to Update`);
  }
};
export const incr = async ({ key } = {}) => {
  try {
    await redisClient.incr(key);
  } catch (error) {
    console.log(`Fail to Incr`);
  }
};
export const expire = async ({ key, ttl } = {}) => {
  try {
    await redisClient.expire(key, ttl);
  } catch (error) {
    console.log(`Fail to expire`);
  }
};
export const deleteKey = async (key) => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    console.log("Fali to set this operation");
  }
};
export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("Redis ttl Error", error);
    return -2;
  }
};
export const keys = async (prefix) => {
  try {
    return await redisClient.keys(`${prefix}*`);
  } catch (error) {
    console.log("Redis Keys Error", error);
    return -2;
  }
};
export const mGet = async (keys = []) => {
  try {
    if (!keys.length) {
      return 0;
    }
    return await redisClient.mGet(keys);
  } catch (error) {
    console.log("Redis Keys Error", error);
  }
};