import { APPLICATION_NAME } from '../../../config/config.service.js'
import {Cloudinary} from '../utils/multer/index.js'
export const uploadFile = async({filePath , folder})=>{
    return await Cloudinary.uploader.upload(filePath , {folder})
}
export const uploadFiles = async({files = [] , folder})=>{
    let attachments = []
    for (const file of files) {
        const {public_id , secure_url} = await uploadFile({filePath : file.path , folder})
        attachments.push({public_id , secure_url})
    }
    return attachments
}
export const deleteFile = async(public_id)=>{
    return await Cloudinary.uploader.destroy(public_id)
}
export const deleteFilesWithPublicIds = async(public_ids)=>{
    return await Cloudinary.api.delete_resources(public_ids)
}
export const deleteFolderAssets = async(folder)=>{
    return await Cloudinary.api.delete_resources_by_prefix(folder)
}
export const deleteFolder = async(folder)=>{
    return await Cloudinary.api.delete_folder(folder)
}
export const deleteImage = async(user)=>{
    const baseFolder = `${APPLICATION_NAME}/users/${user._id}`
      const folders = []
      if (user.profilePicture?.public_id) {
        folders.push(`${baseFolder}/profile`)
      }
      if (user.profileCover?.public_id) {
        folders.push(`${baseFolder}/cover`)
      }
      if (folders.length) {
        await deleteFolderAssets(baseFolder)
        await deleteFolder(baseFolder)
      }
}
export const deleteAttachments = async({attachments = [] ,  receiverId} = {})=>{
    const baseFolder = `${APPLICATION_NAME}/messages/${receiverId}`
      if (attachments.length) {
        await deleteFolderAssets(baseFolder)
        await deleteFolder(baseFolder)
      }
}

