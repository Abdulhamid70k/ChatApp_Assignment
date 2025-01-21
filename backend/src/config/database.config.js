//src/config/databaseConfig.js
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL || !process.env.DB_NAME) {
            console.error("MongoDB COnnection Error -> Missing DB_URL or DB_NAME");
            process.exit(1)
        }
        console.log('connecting to database...')
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);

        console.log(` \n MongoDB connected ! DB host: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.error(" \n MongoDB COnnection Error -> ", error);
        process.exit(1)
    }
}


export default connectDB;