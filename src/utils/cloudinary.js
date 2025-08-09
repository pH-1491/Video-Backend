import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Ensure absolute path
        const resolvedPath = path.resolve(localFilePath);

        const response = await cloudinary.uploader.upload(resolvedPath, {
            resource_type: "auto"
        });

        // console.log("File uploaded to Cloudinary:", response.secure_url);

        // Delete local file after upload
        fs.unlinkSync(resolvedPath);

        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        // Remove local file on error
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};
