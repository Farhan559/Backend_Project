import mongoose from "mongoose";
import dotenv from "dotenv"; // Ensure dotenv is imported
import { DB_NAME } from "../contants.js";

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.DATABASE_URI);
        console.log(`\nMongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB CONNECTION ERROR", error);
        process.exit(1); // Exit the process on error
    }
};

export default connectDB;
