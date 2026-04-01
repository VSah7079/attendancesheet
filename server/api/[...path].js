import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let dbReadyPromise;

const setCorsHeaders = (req, res) => {
	const origin = req.headers.origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Vary", "Origin");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
	setCorsHeaders(req, res);

	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	try {
		if (!dbReadyPromise) {
			dbReadyPromise = connectDB().catch((error) => {
				dbReadyPromise = undefined;
				throw error;
			});
		}

		await dbReadyPromise;
		return await new Promise((resolve) => {
			app(req, res);
			res.on("finish", resolve);
		});
	} catch (error) {
		console.error("Serverless handler failed", error);
		return res.status(500).json({
			message: "Server error",
			details: error?.message || "Unknown error",
		});
	}
}
