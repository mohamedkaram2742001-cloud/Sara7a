import multer, { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import fs, { mkdirSync } from "node:fs";
import {resolve} from "node:path";
export const upload = ({customePath = "general" , size = 2 , validation = []})=>{
  const uploadDir = resolve("../Whisper-upload")
  if (!fs.existsSync(uploadDir)) {
    mkdirSync(uploadDir , {recursive : true})
  }
  const fullPath = resolve(`${uploadDir}/${customePath}`)
  const storage = multer.diskStorage({
    destination : (req , file , cb)=>{
      cb(null , fullPath)
    },
    filename : (req , file , cb)=>{
      const uniqueFileName = randomUUID()+ "-" + file.originalname
      file.finalPath = `Whisper-upload/${customePath}/${uniqueFileName}`
      cb(null , uniqueFileName)
    }
  })
  const fileFilter = (req , file , cb)=>{
    if (!validation.includes(file.mimetype)) {
      return cb(new Error(`Invalid gile formate this endpoint accept only ${validation}`),false)
    }
    return cb(null , true)
  }
  return multer({fileFilter , storage , limits : {fileSize : size * 1024 * 1024}})
}