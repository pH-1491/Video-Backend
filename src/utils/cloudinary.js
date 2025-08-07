import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
        //file has been uploaded sucessfully
        console.log('file is uploaded on cloudinary',response.url);
        return response;
    }catch(e){
        fs.unlinkSync(localFilePath); //removes the locally saved file saved temporary file as the upoad operation got failed
        return null;
    }

}

export {uploadOnCloudinary}