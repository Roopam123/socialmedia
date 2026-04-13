import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined");
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB Error:", err.message);
});

export default connectDB;