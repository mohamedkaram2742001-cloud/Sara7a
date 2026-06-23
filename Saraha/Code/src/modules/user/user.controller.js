import { Router } from "express";
import { successResponse } from "../../common/utils/response/index.js";
import { confirm2Step_Verification, deleteAccount, enable2Step_Verification, getUserProfileAndShare, logout, profileCover, profilePicture, rotateToken, updateAccount, updatePassword } from "./user.service.js";
import {  authentication, authorization, validation } from "../../middleware/index.js";
import { endPoint } from "./user.auth.js";
import { TokenTypeEnum } from "../../common/enum/index.js";
import { cloudFileUpload, decodeToken, fieldValidation } from "../../common/utils/index.js";
import * as validators from './user.validation.js'
const router = Router();
router.get("/:profileId",async (req, res, next) => {
  let viewer = null;
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const [flag, credential] = authHeader.split(" ");
    const decoded = await decodeToken({ token: credential });
    viewer = decoded.user;
  }
  const account = await getUserProfileAndShare({profileId : req.params.profileId ,viewer , ip :  req.ip});
  return successResponse(res, 200, account);
});
router.patch("/update-password", authorization({accessRole : endPoint.Profile}) ,async (req, res, next) => {
  const account = await updatePassword(req.body , req.user);
  return successResponse(res, 200, account);
});
router.patch("/enable-2Step-verification", authorization({accessRole : endPoint.Profile}) ,async (req, res, next) => {
  const account = await enable2Step_Verification(req.user);
  return successResponse(res, 200, account);
});
router.patch("/confirm-2Step-verification", authorization({accessRole : endPoint.Profile}),validation(validators.confirm2Step_Verification) ,async (req, res, next) => {
  const account = await confirm2Step_Verification(req.user , req.body);
  return successResponse(res, 200, account);
});
router.patch("/profile-picture",authentication(),cloudFileUpload({validation : fieldValidation.image , size : 12}).single('profilePicture'),validation(validators.profileImage) ,async (req, res, next) => {
  const account = await profilePicture(req.file , req.user);
  return successResponse(res, 200, account);
});
router.patch("/profile-cover-picture",authentication(),cloudFileUpload({validation : fieldValidation.image , size : 10}).single("profileCover"),validation(validators.profileImage)  ,async (req, res, next) => {
  const account = await profileCover(req.file , req.user);
  return successResponse(res, 200, account);
});
router.get("/rotate", authorization({accessRole : endPoint.Profile , tokenType : TokenTypeEnum.Refreash}), async (req, res, next) => {
  const account = await rotateToken(req.user, `${req.protocol}://${req.host}`);
  return successResponse(res, 200, account);
});
router.post("/logout", authentication(), async (req, res, next) => {
  const status = await logout(req.body,req.user, req.decode);
  return successResponse(res, status);
});
router.patch("/:id", authentication(), async (req, res, next) => {
  const acconut = await updateAccount(req.params.id , req.body);
  return successResponse(res, 200 , acconut);
});
router.delete("/:id", authentication(), async (req, res, next) => {
  const acconut = await deleteAccount(req.user);
  return successResponse(res, 200 , acconut);
});
export default router;
