import { NODE_ENV } from "../../config/config.service.js";

// Fixed error structure
export const globalErrorHandling = (error , req , res , next) => {
  const status = error.cause?.status ?? 500;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "Something went wrong server error";
  const displayErrorMessage = error.message || defaultErrorMessage
  return res.status(status).json({
    status,
    errorMessage: mood ? status == 500 ?  defaultErrorMessage : displayErrorMessage : displayErrorMessage,
    extra : error?.cause?.extra,
    stack: mood ? undefined : error.stack
  });
};