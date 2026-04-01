import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let dbReadyPromise;

export default async function handler(req, res) {
	if (!dbReadyPromise) {
		dbReadyPromise = connectDB().catch((error) => {
			dbReadyPromise = undefined;
			throw error;
		});
	}

	await dbReadyPromise;
	return new Promise((resolve) => {
		app(req, res);
		res.on("finish", resolve);
	});
}
