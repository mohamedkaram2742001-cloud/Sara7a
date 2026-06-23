import { TokenTypeEnum } from "../common/enum/index.js";
import { BadRequestException, ForbiddenException } from "../common/utils/response/index.js";
import { decodeToken } from "../common/utils/security/index.js";
export const authentication = (tokenType = TokenTypeEnum.Access) => {
  return async (req, res, next) => {
    if (!req.headers?.authorization) {
      throw BadRequestException({ message: "Missing authorization key" });
    }
    const { authorization } = req.headers;
    const [flag, credential] = authorization.split(" ");
    const {user , decode} = await decodeToken({token: credential,tokenType});
    req.user = user,
    req.decode = decode
    next();
  };
};
export const authorization = ({accessRole = [], tokenType = TokenTypeEnum.Access} = {}) => {
  return async (req, res, next) => {
    if (!req.headers?.authorization) {
      throw BadRequestException({ message: "Missing authorization key" });
    }
    const { authorization } = req.headers;
    const [flag, credential] = authorization.split(" ");
    const {user , decode} = await decodeToken({token: credential,tokenType});
    req.user = user,
    req.decode = decode
    if (!accessRole.includes(req.user.role)) {
      throw ForbiddenException({ message: "Not allowed account" });
    }
    next();
  };
};
