import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/attendance";

const isServerlessProduction =
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

const connectWithUri = async (uri, label = "MongoDB") => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 2500,
  });
  console.log(`${label} connected`);
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();
  const fallbackUri = process.env.MONGODB_FALLBACK_URI?.trim()
    || (isServerlessProduction ? "" : DEFAULT_LOCAL_URI);

  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  if (uri.includes("cluster0.xxxxx.mongodb.net")) {
    throw new Error(
      "MONGODB_URI contains placeholder host cluster0.xxxxx.mongodb.net. Replace it with your real Atlas host (example: cluster0.ab12c.mongodb.net)."
    );
  }

  try {
    await connectWithUri(uri, "MongoDB");
  } catch (error) {
    const isAtlasUri = uri.includes("mongodb.net");
    const isSelectionError = error?.name === "MongooseServerSelectionError";

    if (isAtlasUri && isSelectionError) {
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect cleanup failures
      }

      if (fallbackUri) {
        try {
          console.warn(
            "Atlas connection failed (likely IP whitelist/network). Trying fallback URI..."
          );
          await connectWithUri(fallbackUri, "MongoDB fallback");
          return;
        } catch {
          throw new Error(
            "Could not connect to Atlas or fallback MongoDB. Add your current IP in Atlas Network Access, or run local MongoDB at mongodb://127.0.0.1:27017 and keep MONGODB_FALLBACK_URI set."
          );
        }
      }

      throw new Error(
        "Could not connect to MongoDB Atlas. Add your current IP in Atlas Network Access and verify connection string credentials."
      );
    }

    throw error;
  }
};
