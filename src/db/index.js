import mongoose from "mongoose";
import { DB_NAME } from "./contants";

(async()=>{
    try {
            mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
            console.log(`\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("ERROR: ",error);
        throw err
    }
})