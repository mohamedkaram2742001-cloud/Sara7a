import { hash , compare } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";
import * as argon2 from 'argon2'
import { HashEnum } from "../../enum/index.js";
export const generatHash = async (plainText , salt = SALT_ROUND , algo = HashEnum.Bcrypt)=>{
    let hashResult = ''
    switch (algo) {
        case HashEnum.Argon:
            hashResult = await argon2.hash(plainText)
            break;
        default:
            hashResult = await hash(plainText , salt)
            break;
    }
    return  hashResult
}
export const compareHash = async (plainText , cipherText , algo = HashEnum.Bcrypt)=>{
    let match = false
    switch (algo) {
        case HashEnum.Argon:
            match  = await argon2.verify(cipherText , plainText)
            break;
        default:
            match  = await compare(plainText , cipherText)
            break;
    }
    return match
}