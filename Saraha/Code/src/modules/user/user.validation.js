import Joi from "joi";
import { fieldValidation, generalValidationFields } from "../../common/utils/index.js";

export const shareProfile = {
    params : Joi.object().keys({
        id : generalValidationFields.id.required()
    }).required()
}
export const profileImage = {
    file : generalValidationFields.file(fieldValidation.image).required()
}
export const profileAttachments = {
    files : Joi.object().keys({
        profilPicture : generalValidationFields.file(fieldValidation.image).length(1).required(),
        profilCover : generalValidationFields.file(fieldValidation.image).length(1).required()
    }).required()
}
export const enable2Step_Verification = {
    body : Joi.object().keys({
        isTwoFactorEnabled : generalValidationFields.isTwoFactorEnabled.required(),
    })
}
export const confirm2Step_Verification = {
    body : Joi.object().keys({
        otp : generalValidationFields.otp.required(),
    }).required(),
}
export const resend2Step_VerificationCode = {
    body : Joi.object().keys({
        email : generalValidationFields.email.required(),
    }).required(),
}
export const updatePassword = {
    body : Joi.object().keys({
        oldPassword : generalValidationFields.password.required(),
        newPassword : generalValidationFields.password.required(),
        confirmPassword : generalValidationFields.confirmPassword("newPassword").required(),
    }).required(),
}