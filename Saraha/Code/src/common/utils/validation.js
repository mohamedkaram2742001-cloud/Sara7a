import Joi from "joi";
import { Types } from "mongoose";
import { GenderEnum } from "../enum/user.enum.js";
export const generalValidationFields = {
    id : Joi.string().custom((value , helper)=>{return Types.ObjectId.isValid(value) ? true : helper.message(`Invalid ObjectId`)}),
    email : Joi.string().email({minDomainSegments : 2 , maxDomainSegments : 3 , tlds :{allow:['com','net']}}),
    password : Joi.string().pattern(new RegExp(/^(?=.*[A-Z]){1,}(?=.*[a-z]){1,}(?=.*[\d]){1,}(?=.*[\W]){1,}[\W\w].{8,25}/)).message("Must have uppercase, lowercase, number and special character."),
    userName : Joi.string().pattern(new RegExp(/^[a-zA-Z0-9_]{3,20}$/)),
    confirmPassword:(matchedPass)=>{return Joi.string().valid(Joi.ref(matchedPass))},
    otp : Joi.string().pattern(new RegExp(/^\d{6}$/)),
    phone:Joi.string().pattern(new RegExp(/^(02|2|\+20)?01[0-25]\d{8}$/)),
    file : function(mimetype = []){
      return Joi.object().keys({
        fieldname : Joi.string(),
        originalname : Joi.string(),
        encoding : Joi.string(),
        mimetype : Joi.string().valid(...Object.values(mimetype)),
        destination : Joi.string(),
        filename : Joi.string(),
        path : Joi.string(),
        size : Joi.number().positive(),
        buffer : Joi.binary()
      })
    },
    isTwoFactorEnabled : Joi.boolean(),
    DOB : Joi.date(),
    gender : Joi.string().valid(...Object.values(GenderEnum))
}
export const JOI_messages = {
  "any.required": "{{#label}} is required",
  "string.base": "{{#label}} must be a string",
  "string.empty": "{{#label}} cannot be empty",
  "string.email": "{{#label}} must be a valid email",
  "string.pattern.base": "{{#label}} format is invalid",
  "string.min": "{{#label}} must be at least {{#limit}} characters",
  "string.max": "{{#label}} must not exceed {{#limit}} characters",
  "number.base": "{{#label}} must be a number",
  "boolean.base": "{{#label}} must be true or false",
  "any.only": "{{#label}} does not match"
};
