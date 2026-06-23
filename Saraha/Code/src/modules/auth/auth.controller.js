import { Router } from "express";
import { confirmEmail, confirmForgetPassword, confirmLogin, forgetPassword, login, loginWithGmail, reSendConfrimEmail, reSendConfrimLogin, resetPassword, signUp, signupWithGmail } from "./auth.service.js";
import { upload, successResponse, fieldValidation } from "../../common/utils/index.js";
import * as validators from './auth.validation.js'
import { validation } from "../../middleware/index.js";
const router = Router();
router.post(
  "/signup",
  upload({customePath : "user/image/profile" , size : 8 , validation : fieldValidation.image }).single("profilePicture"),
  validation(validators.signup),
  async (req, res, next) => {
    const account = await signUp(req.body, req.file);
    return successResponse(res, 201, { data: account });
  },
);
router.patch("/confirm-email",validation(validators.confirmOTP),async (req, res, next) => {
    const account = await confirmEmail(req.body);
    return successResponse(res, 200, { data: account });
  },
);
router.patch("/resend-confirm-email",validation(validators.resendOTP),async (req, res, next) => {
    const account = await reSendConfrimEmail(req.body);
    return successResponse(res, 200, { data: account });
  },
);
router.post("/signup/gmail", async (req, res, next) => {
  const {account , status = 201} = await signupWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse(res, status, {data:  account });
});
router.post("/login/gmail", async (req, res, next) => {
  const account = await loginWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse(res, 200, { data: account });
});
router.post("/login",validation(validators.login) ,async (req, res, next) => {
    const account = await login(req.body, `${req.protocol}://${req.host}`);
    return successResponse(res, 200, account );
});
router.patch("/login-confirm",validation(validators.confirmOTP) ,async (req, res, next) => {
    const account = await confirmLogin(req.body, `${req.protocol}://${req.host}`);
    return successResponse(res, 200, account );
});
router.patch("/resend-confirm-login",validation(validators.resendOTP),async (req, res, next) => {
    const account = await reSendConfrimLogin(req.body ,`${req.protocol}://${req.host}`);
    return successResponse(res, 200, { data: account });
  },
router.patch("/forget-password",validation(validators.forgetPassword) ,async (req, res, next) => {
  const account = await forgetPassword(req.body);
  return successResponse(res, 200, account);
}),
router.patch("/confirm-forget-password",validation(validators.confirmOTP),async (req, res, next) => {
    const account = await confirmForgetPassword(req.body);
    return successResponse(res, 200, { data: account });
  },
),
router.patch("/reset-password",validation(validators.resetPassword) ,async (req, res, next) => {
  const account = await resetPassword(req.body);
  return successResponse(res, 200, account);
})
);
export default router;
