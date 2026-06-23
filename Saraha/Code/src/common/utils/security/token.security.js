import jwt from "jsonwebtoken";
import {
  ACCESS_EXPIRS_IN,
  REFREASH_EXPIRS_IN,
  SYSTEM_REFREASH_TOKEN_SECRET_KEY,
  SYSTEM_TOKEN_SECRET_KEY,
  USER_REFREASH_TOKEN_SECRET_KEY,
  USER_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { AudienceEnum, RoleEnum, TokenTypeEnum } from "../../enum/index.js";
import {
  BadRequestException,
  UnauthorizadException,
} from "../response/index.js";
import { findOne } from "../../../DB/index.js";
import { userModel } from "../../../DB/models/user.model.js";
import { randomUUID } from "crypto";
import { get, revokeTokenBaseKey } from "../../services/redis.service.js";
export const generateToken = async ({
  payload = {},
  secret = USER_TOKEN_SECRET_KEY,
  options = {},
} = {}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token,
  secret = USER_TOKEN_SECRET_KEY,
} = {}) => {
  return jwt.verify(token, secret);
};

export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreashSignature = undefined;
  let audience = AudienceEnum.User;
  switch (role) {
    case RoleEnum.Admin:
      accessSignature = SYSTEM_TOKEN_SECRET_KEY;
      refreashSignature = SYSTEM_REFREASH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.System;
      break;
    default:
      accessSignature = USER_TOKEN_SECRET_KEY;
      refreashSignature = USER_REFREASH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.User;
      break;
  }
  return { accessSignature, refreashSignature, audience };
};

export const getSignatureLevel = async (audienceType) => {
  let signatureLevel;
  switch (audienceType) {
    case AudienceEnum.System:
      signatureLevel = RoleEnum.Admin;
      break;
    default:
      signatureLevel = RoleEnum.User;
      break;
  }
  return signatureLevel;
};

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreashSignature, audience } =
    await getTokenSignature(user.role);
  const jwtId = randomUUID();
  const access_Token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.Access, audience],
      expiresIn: ACCESS_EXPIRS_IN,
      jwtid: jwtId,
    },
  });
  const refreash_Token = await generateToken({
    payload: { sub: user._id },
    secret: refreashSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.Refreash, audience],
      expiresIn: REFREASH_EXPIRS_IN,
      jwtid: jwtId,
    },
  });
  return {
    user: {
      _id: user._id,
      userName: user.userName,
      profilePicture: user?.profilePicture?.secure_url,
      profileCover: user?.profileCover?.secure_url,
      email: user.email,
    },
    access_Token,
    refreash_Token,
  };
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.Access,
} = {}) => {
  try {
    const decode = jwt.decode(token);
    if (!decode?.aud.length) {
      throw BadRequestException({
        message: "Fail to decoded this token aud is required",
      });
    }
    const [decodedTokenType, audienceType] = decode.aud;
    if (decodedTokenType !== tokenType) {
      throw BadRequestException({
        message: `Invalid token type token of type ${decodedTokenType} cannot access this api while we expected token of type ${tokenType}`,
      });
    }
    const signatureLevel = await getSignatureLevel(audienceType);
    const { accessSignature, refreashSignature } =
      await getTokenSignature(signatureLevel);
    const verifiedData = await verifyToken({
      token,
      secret:
        tokenType === TokenTypeEnum.Refreash
          ? refreashSignature
          : accessSignature,
    });
    const isRevoked = await get({
      key: revokeTokenBaseKey(verifiedData.jti),
    });

    if (isRevoked) {
      throw UnauthorizadException({ message: "Invalid login session" });
    }
    const user = await findOne({
      model: userModel,
      filter: { _id: verifiedData.sub },
    });
    if (!user) {
      throw UnauthorizadException({ message: "Not Register account" });
    }
    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime?.getTime() > verifiedData.iat * 1000
    ) {
      throw UnauthorizadException({ message: "Invalid login session" });
    }
    return { user, decode: verifiedData };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw UnauthorizadException({
        message: "Token expired",
      });
    }
    throw err;
  }
};
