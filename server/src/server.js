import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config({ override: true });

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Stop the other process or change PORT in .env`
        );
      } else {
        console.error("Server listen failed", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Server startup failed", error);
    process.exit(1);
  }
};

start();
