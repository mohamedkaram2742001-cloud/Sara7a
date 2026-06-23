import { Router } from "express";
import { deleteMessage, getAllMessage, getMessage, markMessageAsRead, sendMessage } from "./message.service.js";
import { successResponse } from "../../common/utils/response/index.js";
import { cloudFileUpload, decodeToken, fieldValidation } from "../../common/utils/index.js";
import * as validators from "./message.validation.js";
import { authorization, validation } from "../../middleware/index.js";
import {endPoint} from './message.auth.js'
const router = Router();
router.post("/:receiverId",
  async (req, res, next) => {
    if (req.headers.authorization) {
      const { user, decode } = await decodeToken({ token: req.headers.authorization.split(" ")[1]});
      req.user = user
      req.decode = decode
    }
    next()
  },
  cloudFileUpload({ validation: fieldValidation.image , size : 10}).array("attachments"),
  validation(validators.sendMessage),
  async (req, res, next) => {
    const message = await sendMessage( req.files, req.body, req.params.receiverId, req.user);
    return successResponse(res, 201, message);
  },
);
router.get("/list",authorization({accessRole : endPoint.Message}),async (req, res, next) => {
    const message = await getAllMessage(req.user);
    return successResponse(res, 200, message);
  },
);
router.get("/:messageId",authorization({accessRole : endPoint.Message}),validation(validators.getMessage),async (req, res, next) => {
    const message = await getMessage(req.params.messageId , req.user);
    return successResponse(res, 200, message);
  },
);
router.patch(
  "/:messageId/read",
  authorization({ accessRole: endPoint.Message }),
  async (req, res) => {
    const message = await markMessageAsRead(
      req.params.messageId,
      req.user
    );

    return successResponse(res, 200, message);
  }
);
router.delete("/deleteMessage/:messageId",authorization({accessRole : endPoint.Message}),validation(validators.getMessage),async (req, res, next) => {
    const message = await deleteMessage(req.params.messageId , req.user);
    return successResponse(res, 200, message);
  },
);
export default router;
