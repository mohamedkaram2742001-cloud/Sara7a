export const fieldValidation = {
  image : ['image/jpeg' ,  'image/png' , 'image/gif' , 'image/jpg' , 'image/JPG' , 'image/heic' , 'image/heif'],
  video : ['video/mp4' ,  'video/mkv' , 'video/avi'],
  audio : ['audio/mpeg' ,  'audio/wav' , 'audio/ogg'],
  pdf : ['application/pdf'],
}
export const fileFilter = (validation = [])=>{
    return (req , file , cb)=>{
        if (!validation.includes(file.mimetype)) {
            cb(new Error('Invalid file format',{cause : {statusCode : 400}}),false)
        }
        cb(null , true)
    }
}