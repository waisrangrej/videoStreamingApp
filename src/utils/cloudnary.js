import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDNARY_CLOUD_NAME,
    api_key:process.env.CLOUDNARY_API_KEY,
    api_secret:process.env.CLOUDNARY_API_SECRET
})

const uploadonCloudnary= async(localfilePath)=>{
    try {
        if(!localfilePath) return "could not find the path ";
        //upload on cloudnary
     const response= await  cloudinary.uploader.upload(localfilePath,{
        resource_type:"auto"
     })
        //file has been uploaded successfully
        // console.log(("file is uploaded in cloudnary",response.url));
         
        fs.unlinkSync(localfilePath)
        return response
    } catch (error) {
        //remove the localy temporary saved file as the upload opreration got failed
      fs.unlinkSync(localfilePath)
      return null
    }
}

export {uploadonCloudnary}
