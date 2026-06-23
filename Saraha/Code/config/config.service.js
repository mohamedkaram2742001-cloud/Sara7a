import { config } from "dotenv";
import { resolve } from "node:path";

export const NODE_ENV = process.env.NODE_ENV;
export const path =
  NODE_ENV == "production"
    ? resolve("config/.env.production")
    : resolve("config/.env.development");
config({ path });
export const PORT = parseInt(process.env.PORT || "3000");
export const URI = String(process.env.URI) ;
export const REDIS_URI = String(process.env.REDIS_URI) ;

export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY
export const USER_REFREASH_TOKEN_SECRET_KEY = process.env.USER_REFREASH_TOKEN_SECRET_KEY

export const SYSTEM_TOKEN_SECRET_KEY = process.env.SYSTEM_TOKEN_SECRET_KEY
export const SYSTEM_REFREASH_TOKEN_SECRET_KEY = process.env.SYSTEM_REFREASH_TOKEN_SECRET_KEY

export const ACCESS_EXPIRS_IN = parseInt(process.env.ACCESS_EXPIRS_IN)
export const REFREASH_EXPIRS_IN = parseInt(process.env.REFREASH_EXPIRS_IN)

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10") ;
export const ENCRYPTION_SECRET_KEY = Buffer.from(String(process.env.ENCRYPTION_SECRET_KEY)) ;
//===================== OTP SEND ============================
export const EMAIL_APP = process.env.EMAIL_APP;
export const PASSWORD_APP = process.env.PASSWORD_APP ;
export const APPLICATION_NAME = process.env.APPLICATION_NAME ;
//====================== Sign with google ===================
export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID ;

//====================== Social Link ======================= 
export const FACEBOOK_LINK = process.env.FACEBOOK_LINK
export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK
export const TWITER_LINK = process.env.TWITER_LINK

//====================== Cloudinary ========================
export const CLOUD_NAME = process.env.CLOUD_NAME
export const API_KEY = process.env.API_KEY
export const API_SECRET = process.env.API_SECRET

//====================== Cors ==============================
export const ORIGIN = process.env.ORIGIN?.split('|') || [];
