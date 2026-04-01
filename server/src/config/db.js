import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  if (uri.includes("cluster0.xxxxx.mongodb.net")) {
    throw new Error(
      "MONGODB_URI contains placeholder host cluster0.xxxxx.mongodb.net. Replace it with your real Atlas host (example: cluster0.ab12c.mongodb.net)."
    );
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
};
