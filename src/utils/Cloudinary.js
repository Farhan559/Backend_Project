import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloundinary = async (loadFilePath) => {
    try {
        if (!loadFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(loadFilePath, {
            resource_type: "auto"
        });

        // File loaded successfully
        console.log("File is uploaded on Cloudinary:", response.url);
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        if (fs.existsSync(loadFilePath)) {
            fs.unlinkSync(loadFilePath); // Remove the locally saved temporary file if the upload operation failed.
        }
        return null;
    }
}

export { uploadOnCloundinary };
