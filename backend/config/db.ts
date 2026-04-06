import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.warn('WARNING: MONGO_URI not found in environment variables. Falling back to localhost.');
        } else {
            const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
            console.log(`Attempting to connect to MongoDB: ${maskedUri}`);
        }

        const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/opspulse');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Log stack trace for deeper debugging of "connectivity" issues
        if (error.stack) console.debug(error.stack);
        process.exit(1);
    }
};

export default connectDB;
