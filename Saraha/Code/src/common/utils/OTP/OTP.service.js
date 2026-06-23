import { get, otpBlockKey, otpMaxRequestKey, set, ttl } from "../../services/index.js";
import { ConflictException } from "../response/index.js";
export const checkOtpBlcok = async({type , key , action})=>{
      const blockKey = otpBlockKey({type , key , action });
      const remainingBlockTime = await ttl(blockKey);
      if (remainingBlockTime > 0) {
        throw ConflictException({ message: `You have reached max request trail count please try again later after ${remainingBlockTime} seconds`});
      }
      return blockKey
}
export const checkOTPRequest = async({type , key , action , blockKey , attampt = 3 }={})=>{
    const maxTrialCountKey = otpMaxRequestKey({type , key , action })
      const checkMaxOtpRequest = Number(await get({ key: maxTrialCountKey }) || 0);
      if (checkMaxOtpRequest >= attampt) {
          await set({
            key: blockKey,
            value: 0,
            ttl: 300,
          });
        throw ConflictException({ message: `You have reached max request trail count please try again later after 5 minutes`});
      }
      return {maxTrialCountKey , checkMaxOtpRequest}
}