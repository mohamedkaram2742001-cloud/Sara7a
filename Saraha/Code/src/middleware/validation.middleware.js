import { BadRequestException } from "../common/utils/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const keys = Object.keys(schema) || [];
    for (const key of keys) {
      const validationResult = schema[key].validate(req[key], { abortEarly: false });
      if (validationResult.error) {
        errors.push({
            key , details : validationResult.error.details.map(ele =>{
                return {message : ele.message , path : ele.path}
            })
        })
      }
    }
    if (errors.length) {
      throw BadRequestException({
        message: "Validation error",
        extra: {errors},
      });
    }
    next();
  };
};
