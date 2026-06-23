import Joi from 'joi'
import { generalValidationFields } from '../../common/utils/validation.js'

export const login ={
    body : Joi.object().keys({
    email : generalValidationFields.email.required(),
    password : generalValidationFields.password.required()
    }).required()
}
export const signup = {
    body : login.body.append({
        userName : generalValidationFields.userName.required(),
        confirmPassword : generalValidationFields.confirmPassword("password").required(),
        phone : generalValidationFields.phone,
        gender : generalValidationFields.gender,
        DOB : generalValidationFields.DOB
    }).required(),
}
export const confirmOTP = {
    body : Joi.object().keys({
        email : generalValidationFields.email.required(),
        otp : generalValidationFields.otp.required(),
    }).required(),
}
export const resendOTP = {
    body : Joi.object().keys({
        email : generalValidationFields.email.required(),
    }).required(),
}
export const forgetPassword = {
    body : Joi.object().keys({
        email : generalValidationFields.email.required(),
    }).required(),
}
export const resetPassword = {
    body : Joi.object().keys({
        email : generalValidationFields.email.required(),
        password : generalValidationFields.password.required(),
        confirmPassword : generalValidationFields.confirmPassword("password").required(),
    }).required(),
}