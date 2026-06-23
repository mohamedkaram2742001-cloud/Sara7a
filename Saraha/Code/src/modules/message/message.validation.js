import Joi from "joi";
import { fieldValidation, generalValidationFields, JOI_messages } from "../../common/utils/index.js";
export const sendMessage = {
  params: Joi.object({
    receiverId: generalValidationFields.id.label("receiverId").messages(JOI_messages).required(),
  }),
  body: Joi.object({
    content: Joi.string().min(2).max(10000).label("Content").messages(JOI_messages),
    senderId: generalValidationFields.id.label("senderId").messages(JOI_messages),
  }),
  files: Joi.array().items(generalValidationFields.file(fieldValidation.image).label("attachments").messages(JOI_messages))
};
export const getMessage = {
  params: Joi.object({
    messageId: generalValidationFields.id.label("messageId").messages(JOI_messages).required(),
  }),
};
