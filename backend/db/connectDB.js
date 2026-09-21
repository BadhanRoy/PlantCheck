import mongoose from "mongoose";

export const connectDB = async () => {
	if (!process.env.MONGO_URI) {
		console.warn("⚠️ MONGO_URI is not set. MongoDB connection skipped. Add it to backend/.env to enable database features.");
		return false;
	}

	try {
		console.log("mongo_uri: ", process.env.MONGO_URI);
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
		return true;
	} catch (error) {
		console.log("Error connection to MongoDB: ", error.message);
		return false;
	}
};