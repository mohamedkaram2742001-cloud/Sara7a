import multer from "multer";
import { fileFilter } from "./multer.validation.js";

export const cloudFileUpload = ({ validation = [], size = 5 }) => {
    const storage = multer.diskStorage({})
    return multer({fileFilter : fileFilter(validation) ,storage, limits : {fileSize : size * 1024 * 1024}})
};
