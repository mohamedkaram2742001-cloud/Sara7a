import { NODE_ENV } from "../../../../config/config.service.js";
// General customized error method
export const ErrorResponse = ({message = "Fail" , status = 400 , extra=undefined} = {})=>{
    throw new Error(message , {cause : {status,extra}})
}

// Error-templated
export const BadRequestException = ({message = "BadRequestException" , extra = undefined}={})=>{
  return ErrorResponse({message , status : 400 , extra})
}
export const NotFoundException = ({message = "NotFoundException" , extra = undefined} = {})=>{
    return ErrorResponse({message , cause : {status : 404 , extra}})
}
export const ConflictException = ({message = "ConflictException" , extra = undefined} = {})=>{
    return ErrorResponse({message , status : 409 , extra})
}
export const UnauthorizadException = ({message = "UnauthorizadException" , extra = undefined} = {})=>{
    return ErrorResponse({message , status : 401 , extra})
}
export const ForbiddenException = ({message = "ForbiddenException" , extra = undefined} = {})=>{
    return ErrorResponse({message , status : 403 , extra})
}
