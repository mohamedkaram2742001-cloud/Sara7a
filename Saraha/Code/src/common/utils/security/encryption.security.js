import crypto from 'node:crypto'
import { ENCRYPTION_SECRET_KEY } from '../../../../config/config.service.js'
const IV_LENGTH = 16
export const encrypt = async (text)=>{
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc' , ENCRYPTION_SECRET_KEY , iv );
    let encryptData = cipher.update(text , 'utf-8' , 'hex');
    encryptData += cipher.final('hex');
    return `${iv.toString('hex')}:${encryptData}`
}
export const decrypt = async (encrypted)=>{
    const [iv , encryptData] = encrypted.split(":")
    const bineryIV = Buffer.from(iv,'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc' , ENCRYPTION_SECRET_KEY , bineryIV );
    let decryptData = decipher.update(encryptData , 'hex' , 'utf-8');
    decryptData += decipher.final('utf-8')
    return decryptData
}