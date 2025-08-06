import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    console.log("Connecting to MongoDB at:", process.env.MONGODB_URI);

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB connected successfully to ${DB_NAME}!!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;
